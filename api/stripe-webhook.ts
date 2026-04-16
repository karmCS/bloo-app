import Stripe from 'stripe';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { readRawBody } from './_lib/readRawBody';
import { sendOrderEmails } from './send-order-email';

export const config = { api: { bodyParser: false } };

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

function json(res: { status: (n: number) => { json: (b: unknown) => void } }, status: number, body: unknown) {
  return res.status(status).json(body);
}

export default async function handler(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    on: (event: 'data' | 'end' | 'error', cb: (chunk?: unknown) => void) => void;
  },
  res: { status: (n: number) => { json: (b: unknown) => void } },
) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return json(res, 500, { error: 'Stripe is not configured.' });
  }

  const signature = getHeader(req, 'stripe-signature');
  if (!signature) {
    return json(res, 400, { error: 'Missing Stripe signature.' });
  }

  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return json(res, 400, { error: 'Webhook signature verification failed.' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (typeof orderId === 'string' && orderId.trim().length > 0) {
        const supabase = getSupabaseAdmin();

        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            stripe_session_id: session.id,
          })
          .eq('id', orderId.trim());

        const { data: order } = await supabase
          .from('orders')
          .select('id, user_email, total_price, items')
          .eq('id', orderId.trim())
          .maybeSingle();

        if (order?.id && typeof order.user_email === 'string') {
          await sendOrderEmails({
            orderId: order.id,
            email: order.user_email,
            paymentMethod: 'card',
            paymentStatus: 'paid',
            totalPrice: typeof order.total_price === 'number' ? order.total_price : 0,
            items: Array.isArray(order.items) ? (order.items as any) : [],
          });
        }
      }
    }

    return json(res, 200, { received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return json(res, 200, { received: true, error: message });
  }
}

