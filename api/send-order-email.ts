import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bloo.com';

const PAYMENT_INFO = {
  zelle: { contact: 'payments@bloo.com', label: 'Email/Phone' },
  venmo: { contact: '@bloo-meals', label: 'Venmo Handle' },
};

interface OrderItem {
  meal_name: string;
  price: number;
  quantity: number;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables');
    return res.status(500).json({ error: 'Email service not configured: RESEND_API_KEY missing' });
  }

  const { orderId, email, paymentMethod, totalPrice, items } = req.body;

  if (!orderId || !email || !paymentMethod || totalPrice == null) {
    return res.status(400).json({
      error: 'Missing required fields',
      received: { orderId: !!orderId, email: !!email, paymentMethod: !!paymentMethod, totalPrice },
    });
  }

  const paymentInfo = PAYMENT_INFO[paymentMethod as keyof typeof PAYMENT_INFO];
  if (!paymentInfo) {
    return res.status(400).json({ error: `Unknown payment method: ${paymentMethod}` });
  }

  const resend = new Resend(RESEND_API_KEY);
  const orderShortId = (orderId as string).slice(0, 8);

  const itemRows = (items as OrderItem[] | undefined)?.map(
    (item) =>
      `<li style="padding:5px 0">${item.meal_name} x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}</li>`
  ).join('') ?? '';

  const itemsHtml = itemRows
    ? `<h3>Items Ordered:</h3><ul style="list-style:none;padding-left:0">${itemRows}</ul>`
    : '';

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#2563eb">Order Confirmation — Bloo</h1>
      <p>Thank you for your order!</p>
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
        <h2 style="margin-top:0">Order Details</h2>
        <p><strong>Order ID:</strong> #${orderShortId}</p>
        <p><strong>Total:</strong> $${(totalPrice as number).toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'}</p>
        ${itemsHtml}
      </div>
      <div style="background:#fef3c7;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0">
        <h2 style="margin-top:0">Payment Instructions</h2>
        <p>Please send <strong>$${(totalPrice as number).toFixed(2)}</strong> to:</p>
        <p><strong>${paymentInfo.label}:</strong> ${paymentInfo.contact}</p>
        <p style="color:#f59e0b"><strong>IMPORTANT:</strong> Include order #${orderShortId} in your payment note.</p>
      </div>
      <p>We'll confirm your order once we verify your payment.</p>
      <p>Best regards,<br/>The Bloo Team</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#2563eb">New Order Received</h1>
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
        <h2 style="margin-top:0">Order Details</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Total:</strong> $${(totalPrice as number).toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'}</p>
        ${itemsHtml}
      </div>
      <div style="background:#dbeafe;padding:20px;border-radius:8px;margin:20px 0">
        <h3 style="margin-top:0">Expected Payment</h3>
        <p><strong>${paymentInfo.label}:</strong> ${paymentInfo.contact}</p>
        <p><strong>Amount:</strong> $${(totalPrice as number).toFixed(2)}</p>
      </div>
      <p>Please verify the payment and update the order status in the admin panel.</p>
    </div>
  `;

  try {
    const [customerResult, adminResult] = await Promise.all([
      resend.emails.send({
        from: 'Bloo <onboarding@resend.dev>',
        to: email as string,
        subject: 'Order Confirmation — Bloo',
        html: customerHtml,
      }),
      resend.emails.send({
        from: 'Bloo Orders <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `New Order — #${orderShortId}`,
        html: adminHtml,
      }),
    ]);

    console.log('Emails sent — customer:', customerResult, 'admin:', adminResult);

    return res.status(200).json({
      success: true,
      orderId: orderShortId,
      customerEmailId: customerResult.data?.id,
      adminEmailId: adminResult.data?.id,
    });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({
      error: 'Failed to send emails',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
