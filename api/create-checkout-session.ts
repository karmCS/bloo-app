import Stripe from 'stripe';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { readRawBody } from './_lib/readRawBody';

type CartItemInput = {
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

function json(res: { status: (n: number) => { json: (b: unknown) => void } }, status: number, body: unknown) {
  return res.status(status).json(body);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

function isPositivePrice(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function validateBody(raw: unknown):
  | { ok: true; orderId: string; cartItems: CartItemInput[] }
  | { ok: false; error: string } {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid body.' };
  }

  const record = raw as Record<string, unknown>;
  const orderId = record.orderId;
  const cartItems = record.cartItems;

  if (!isNonEmptyString(orderId)) {
    return { ok: false, error: 'Invalid orderId.' };
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { ok: false, error: 'Cart is empty.' };
  }

  const validated: CartItemInput[] = [];
  for (const it of cartItems) {
    if (it === null || typeof it !== 'object' || Array.isArray(it)) {
      return { ok: false, error: 'Invalid cart item.' };
    }
    const r = it as Record<string, unknown>;
    const name = r.name;
    const price = r.price;
    const quantity = r.quantity;
    const image = r.image;

    if (!isNonEmptyString(name) || name.length > 500) return { ok: false, error: 'Invalid item name.' };
    if (!isPositivePrice(price) || price > 1_000_000) return { ok: false, error: 'Invalid item price.' };
    if (!isPositiveInt(quantity) || quantity > 99) return { ok: false, error: 'Invalid item quantity.' };
    if (image !== undefined && !(typeof image === 'string' && image.trim().length > 0 && image.length <= 2048)) {
      return { ok: false, error: 'Invalid item image.' };
    }

    validated.push({ name: name.trim(), price, quantity, image: typeof image === 'string' ? image.trim() : undefined });
  }

  return { ok: true, orderId: orderId.trim(), cartItems: validated };
}

export default async function handler(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    body?: unknown;
    on: (event: 'data' | 'end' | 'error', cb: (chunk?: unknown) => void) => void;
  },
  res: { status: (n: number) => { json: (b: unknown) => void } },
) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    console.log('ENV CHECK:', { hasKey: !!secretKey, appUrl: process.env.VITE_APP_URL });
    if (!secretKey) {
      return json(res, 500, { error: 'Stripe is not configured.' });
    }

    const appUrl = process.env.VITE_APP_URL;
    if (!appUrl) {
      return json(res, 500, { error: 'Missing VITE_APP_URL.' });
    }

    const raw = req.body ?? JSON.parse((await readRawBody(req)).toString('utf8') || '{}');
    const parsed = validateBody(raw);
    if (parsed.ok === false) {
      return json(res, 400, { error: parsed.error });
    }

    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: parsed.cartItems.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: toCents(it.price),
          product_data: {
            name: it.name,
            ...(it.image ? { images: [it.image] } : {}),
          },
        },
      })),
      success_url: `${appUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      metadata: { orderId: parsed.orderId },
    });

    if (!session.url) {
      return json(res, 500, { error: 'Stripe session did not return a URL.' });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
        payment_status: 'pending',
      })
      .eq('id', parsed.orderId);

    if (error) {
      return json(res, 500, { error: 'Failed to save Stripe session.' });
    }

    return json(res, 200, { url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return json(res, 500, { error: message });
  }
}

