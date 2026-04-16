import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bloo.com';

const PAYMENT_INFO = {
  zelle: { contact: 'payments@bloo.com', label: 'Email/Phone' },
  venmo: { contact: '@bloo-meals', label: 'Venmo Handle' },
} as const;

type PaymentMethod = keyof typeof PAYMENT_INFO | 'card';
type PaymentStatus = 'pending' | 'paid';

/** Allowed top-level JSON keys — rejects mass-assignment / unexpected fields (OWASP). */
const ALLOWED_BODY_KEYS = new Set([
  'orderId',
  'email',
  'paymentMethod',
  'totalPrice',
  'items',
  'csrfToken',
]);

const ITEM_KEYS = new Set(['meal_name', 'price', 'quantity']);

// —— Rate limiting (in-memory, per serverless instance — see comment below) ——
/** Primary: checkout email — avoids one NAT / missing IP blocking the whole app (`unknown`). */
const MAX_SENDS_PER_EMAIL_PER_HOUR = 15;
/** Secondary: real client IP when we have it (shared Wi‑Fi gets a higher cap than old global5). */
const MAX_SENDS_PER_KNOWN_IP_PER_HOUR = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

type RateHit = { t: number; orderId: string };

/** Bucket key → recent sends (orderId dedupes retries for the same order). */
const rateLimitBuckets = new Map<string, RateHit[]>();

/**
 * On Vercel, each function instance has its own memory; limits apply per warm
 * instance, not globally. Still reduces abuse without external services.
 */
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [key, hits] of rateLimitBuckets.entries()) {
    const kept = hits.filter((h) => h.t > cutoff);
    if (kept.length === 0) rateLimitBuckets.delete(key);
    else rateLimitBuckets.set(key, kept);
  }
}, CLEANUP_INTERVAL_MS);

function getHeader(
  req: { headers?: Record<string, string | string[] | undefined> },
  name: string,
): string | undefined {
  const h = req.headers;
  if (!h) return undefined;
  const v = h[name] ?? h[name.toLowerCase()];
  if (Array.isArray(v)) return v[0]?.trim();
  return typeof v === 'string' ? v.trim() : undefined;
}

function getClientIp(req: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const xff = getHeader(req, 'x-forwarded-for');
  const firstXff = xff?.split(',')[0]?.trim();
  const xRealIp = getHeader(req, 'x-real-ip');
  const cfConnecting = getHeader(req, 'cf-connecting-ip');
  const fromSocket = req.socket?.remoteAddress?.trim();
  const ip = firstXff || xRealIp || cfConnecting || fromSocket || '';
  return ip.length > 0 ? ip : 'unknown';
}

function pruneHits(hits: RateHit[], windowStart: number): RateHit[] {
  return hits.filter((h) => h.t > windowStart);
}

/**
 * Allows the request if under per-email and (when IP is known) per-IP caps.
 * Same `orderId` in the window does not consume extra slots (double-submit / retry).
 */
function tryConsumeRateLimit(emailNorm: string, ip: string, orderId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const hit: RateHit = { t: now, orderId };

  const emailKey = `e:${emailNorm}`;
  let emailHits = pruneHits(rateLimitBuckets.get(emailKey) ?? [], windowStart);
  /** Same order (e.g. double-submit): do not consume another slot or re-check IP. */
  if (emailHits.some((h) => h.orderId === orderId)) {
    rateLimitBuckets.set(emailKey, emailHits);
    return true;
  }
  if (emailHits.length >= MAX_SENDS_PER_EMAIL_PER_HOUR) {
    rateLimitBuckets.set(emailKey, emailHits);
    return false;
  }
  emailHits.push(hit);
  rateLimitBuckets.set(emailKey, emailHits);

  if (ip === 'unknown') {
    return true;
  }

  const ipKey = `i:${ip}`;
  let ipHits = pruneHits(rateLimitBuckets.get(ipKey) ?? [], windowStart);
  if (ipHits.some((h) => h.orderId === orderId)) {
    rateLimitBuckets.set(ipKey, ipHits);
    return true;
  }
  if (ipHits.length >= MAX_SENDS_PER_KNOWN_IP_PER_HOUR) {
    emailHits = emailHits.filter((h) => h.orderId !== orderId);
    rateLimitBuckets.set(emailKey, emailHits);
    return false;
  }
  ipHits.push(hit);
  rateLimitBuckets.set(ipKey, ipHits);
  return true;
}

// —— Validation helpers ——

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** UUID v4 from crypto.randomUUID() (client CSRF) or Postgres order id. */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Postgres UUID (any version). */
const UUID_GENERIC_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidPriceDecimals(n: number): boolean {
  if (!Number.isFinite(n) || n <= 0) return false;
  const cents = Math.round(n * 100);
  return Math.abs(cents / 100 - n) < 1e-9;
}

interface ValidatedItem {
  meal_name: string;
  price: number;
  quantity: number;
}

function validateItems(raw: unknown): { ok: true; items: ValidatedItem[] } | { ok: false } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false };

  const items: ValidatedItem[] = [];

  for (const el of raw) {
    if (el === null || typeof el !== 'object' || Array.isArray(el)) return { ok: false };
    const keys = Object.keys(el as object);
    if (keys.length !== ITEM_KEYS.size || keys.some((k) => !ITEM_KEYS.has(k))) return { ok: false };

    const { meal_name, price, quantity } = el as Record<string, unknown>;

    if (typeof meal_name !== 'string' || meal_name.trim().length === 0 || meal_name.length > 500) {
      return { ok: false };
    }
    if (typeof price !== 'number' || !isValidPriceDecimals(price) || price > 1_000_000) {
      return { ok: false };
    }
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return { ok: false };
    }

    items.push({ meal_name: meal_name.trim(), price, quantity });
  }

  return { ok: true, items };
}

const GENERIC_FAILURE = 'Order processing failed. Please try again.';
const INVALID_ORDER_DATA = 'Invalid order details. Please refresh the page and try again.';

interface OrderItem {
  meal_name: string;
  price: number;
  quantity: number;
}

export async function sendOrderEmails(params: {
  orderId: string;
  email: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  items: OrderItem[];
}) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }

  const { orderId, email, paymentMethod, paymentStatus, totalPrice, items } = params;

  const resend = new Resend(RESEND_API_KEY);
  const orderShortId = orderId.slice(0, 8);

  const itemRows = items
    .map(
      (item: OrderItem) =>
        `<li style="padding:5px 0">${escapeHtml(item.meal_name)} x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}</li>`,
    )
    .join('');

  const itemsHtml = itemRows
    ? `<h3>Items Ordered:</h3><ul style="list-style:none;padding-left:0">${itemRows}</ul>`
    : '';

  const safeTotal = totalPrice.toFixed(2);
  const safeEmailHtml = escapeHtml(email);

  const paymentHeading =
    paymentMethod === 'card'
      ? paymentStatus === 'paid'
        ? 'Payment Received'
        : 'Payment Pending'
      : 'Payment Instructions';

  const paymentBlock =
    paymentMethod === 'card'
      ? `
      <div style="background:#dcfce7;padding:20px;border-radius:8px;border-left:4px solid #22c55e;margin:20px 0">
        <h2 style="margin-top:0">${paymentHeading}</h2>
        <p>We’ve received your card payment of <strong>$${safeTotal}</strong>.</p>
        <p>Your order is confirmed. We’ll follow up with delivery details shortly.</p>
      </div>
    `
      : (() => {
          const paymentInfo = PAYMENT_INFO[paymentMethod];
          const pmLabel = paymentMethod === 'zelle' ? 'Zelle' : 'Venmo';
          return `
      <div style="background:#fef3c7;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0">
        <h2 style="margin-top:0">${paymentHeading}</h2>
        <p>Please send <strong>$${safeTotal}</strong> to:</p>
        <p><strong>${escapeHtml(paymentInfo.label)}:</strong> ${escapeHtml(paymentInfo.contact)}</p>
        <p style="color:#f59e0b"><strong>IMPORTANT:</strong> Include order #${escapeHtml(orderShortId)} in your payment note.</p>
      </div>
    `;
        })();

  const pmLabel =
    paymentMethod === 'card' ? 'Card (Stripe)' : paymentMethod === 'zelle' ? 'Zelle' : 'Venmo';

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#2563eb">Order Confirmation — Bloo</h1>
      <p>Thank you for your order!</p>
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
        <h2 style="margin-top:0">Order Details</h2>
        <p><strong>Order ID:</strong> #${escapeHtml(orderShortId)}</p>
        <p><strong>Total:</strong> $${safeTotal}</p>
        <p><strong>Payment Method:</strong> ${pmLabel}</p>
        ${itemsHtml}
      </div>
      ${paymentBlock}
      <p>Best regards,<br/>The Bloo Team</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#2563eb">${paymentMethod === 'card' ? 'Paid Order' : 'New Order Received'}</h1>
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
        <h2 style="margin-top:0">Order Details</h2>
        <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
        <p><strong>Customer Email:</strong> ${safeEmailHtml}</p>
        <p><strong>Total:</strong> $${safeTotal}</p>
        <p><strong>Payment Method:</strong> ${pmLabel}</p>
        ${itemsHtml}
      </div>
      ${
        paymentMethod === 'card'
          ? `<div style="background:#dcfce7;padding:20px;border-radius:8px;margin:20px 0">
        <h3 style="margin-top:0">Payment Status</h3>
        <p><strong>Status:</strong> ${escapeHtml(paymentStatus)}</p>
      </div>`
          : ''
      }
    </div>
  `;

  const customerResult = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Order Confirmation — Bloo',
    html: customerHtml,
  });

  const adminResult = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: ADMIN_EMAIL,
    subject: paymentMethod === 'card' ? `Paid Order — #${orderShortId}` : `New Order — #${orderShortId}`,
    html: adminHtml,
  });

  return { customerResult, adminResult, orderShortId };
}

export default async function handler(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
    body?: unknown;
  },
  res: { status: (n: number) => { json: (b: object) => void } },
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables');
    return res.status(500).json({ error: GENERIC_FAILURE });
  }

  const body = req.body;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: INVALID_ORDER_DATA });
  }

  const record = body as Record<string, unknown>;
  const bodyKeys = Object.keys(record);
  if (bodyKeys.some((k) => !ALLOWED_BODY_KEYS.has(k))) {
    return res.status(400).json({ error: INVALID_ORDER_DATA });
  }

  const { orderId, email, paymentMethod, totalPrice, items, csrfToken } = record;

  // —— CSRF token: format-only check (basic defense; production = signed tokens) ——
  if (typeof csrfToken !== 'string' || !UUID_V4_REGEX.test(csrfToken)) {
    return res.status(400).json({ error: INVALID_ORDER_DATA });
  }

  if (orderId == null || typeof orderId !== 'string' || !UUID_GENERIC_REGEX.test(orderId)) {
    return res.status(400).json({ error: INVALID_ORDER_DATA });
  }

  if (email == null || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Please enter your email address.' });
  }
  const emailTrim = email.trim();
  if (!EMAIL_REGEX.test(emailTrim) || emailTrim.length > 320) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (paymentMethod !== 'zelle' && paymentMethod !== 'venmo') {
    if (paymentMethod !== 'card') {
      return res.status(400).json({
        error: 'Invalid payment method. Use Card, Zelle, or Venmo.',
      });
    }
  }

  if (typeof totalPrice !== 'number' || !Number.isFinite(totalPrice)) {
    return res.status(400).json({ error: INVALID_ORDER_DATA });
  }

  const parsedItems = validateItems(items);
  if (!parsedItems.ok) {
    return res.status(400).json({ error: INVALID_ORDER_DATA });
  }

  const validatedItems = parsedItems.items;

  // —— Server-side price integrity (prevent tampered totals) ——
  const computedTotal = validatedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  if (Math.abs(computedTotal - totalPrice) > 0.01) {
    console.error('[send-order-email] Price mismatch — possible fraud', {
      submitted: totalPrice,
      computed: computedTotal,
      orderId: orderId.slice(0, 8),
    });
    return res.status(400).json({ error: INVALID_ORDER_DATA });
  }

  // —— Rate limit: per checkout email (+ per IP when known), after validation ——
  const emailNorm = emailTrim.toLowerCase();
  const clientIp = getClientIp(req);
  if (!tryConsumeRateLimit(emailNorm, clientIp, orderId)) {
    console.error('[send-order-email] Rate limit exceeded', {
      email: emailNorm,
      ip: clientIp,
      orderId: orderId.slice(0, 8),
    });
    return res.status(429).json({
      error: 'Too many order requests. Please try again in an hour.',
    });
  }

  const orderShortId = orderId.slice(0, 8);
  console.log(`[send-order-email] order=${orderShortId} to_customer=${emailTrim} to_admin=${ADMIN_EMAIL}`);

  let results: Awaited<ReturnType<typeof sendOrderEmails>>;
  try {
    results = await sendOrderEmails({
      orderId,
      email: emailTrim,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
      totalPrice,
      items: validatedItems,
    });
  } catch (e) {
    console.error('[send-order-email] Unexpected error during send', e);
    return res.status(500).json({ error: GENERIC_FAILURE });
  }

  const { customerResult, adminResult } = results;

  if (customerResult.error && adminResult.error) {
    console.error('[send-order-email] Both email sends failed');
    return res.status(500).json({ error: GENERIC_FAILURE });
  }

  // Do not return provider error objects to the client (information disclosure).
  return res.status(200).json({
    success: true,
    orderId: orderShortId,
    customerEmailId: customerResult.data?.id ?? null,
    adminEmailId: adminResult.data?.id ?? null,
  });
}

/** Minimal HTML entity encoding for untrusted strings embedded in email HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
