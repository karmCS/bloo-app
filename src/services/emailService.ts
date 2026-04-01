const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@bloo.com';

const PAYMENT_INFO = {
  zelle: {
    contact: 'payments@bloo.com',
    label: 'Email/Phone',
  },
  venmo: {
    contact: '@bloo-meals',
    label: 'Venmo Handle',
  },
};

interface OrderItem {
  meal_name: string;
  price: number;
  quantity: number;
}

interface SendOrderEmailsParams {
  orderId: string;
  email: string;
  paymentMethod: 'zelle' | 'venmo';
  totalPrice: number;
  items: OrderItem[];
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

export async function sendOrderEmails({
  orderId,
  email,
  paymentMethod,
  totalPrice,
  items,
}: SendOrderEmailsParams) {
  if (!RESEND_API_KEY) {
    throw new Error('Resend API key is not configured');
  }

  const paymentInfo = PAYMENT_INFO[paymentMethod];
  const orderShortId = orderId.slice(0, 8);

  const customerEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Order Confirmation - Bloo</h1>
      <p>Dear Customer,</p>
      <p>Thank you for your order with Bloo!</p>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Order Details</h2>
        <p><strong>Order ID:</strong> #${orderShortId}</p>
        <p><strong>Total Amount:</strong> $${totalPrice.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'}</p>

        ${items.length > 0 ? `
          <h3>Items Ordered:</h3>
          <ul style="list-style: none; padding-left: 0;">
            ${items.map((item) => `
              <li style="padding: 5px 0;">
                ${item.meal_name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>

      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <h2 style="margin-top: 0;">Payment Instructions</h2>
        <p>Please send <strong>$${totalPrice.toFixed(2)}</strong> to:</p>
        <p><strong>${paymentInfo.label}:</strong> ${paymentInfo.contact}</p>
        <p style="color: #f59e0b;"><strong>IMPORTANT:</strong> Include order #${orderShortId} in your payment note.</p>
      </div>

      <p>We'll confirm your order once we verify your payment.</p>
      <p>Best regards,<br/>The Bloo Team</p>
    </div>
  `;

  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">New Order Received</h1>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Order Details</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Short ID:</strong> #${orderShortId}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Total Amount:</strong> $${totalPrice.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'}</p>

        ${items.length > 0 ? `
          <h3>Items Ordered:</h3>
          <ul style="list-style: none; padding-left: 0;">
            ${items.map((item) => `
              <li style="padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                ${item.meal_name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>

      <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Expected Payment</h3>
        <p><strong>${paymentInfo.label}:</strong> ${paymentInfo.contact}</p>
        <p><strong>Amount:</strong> $${totalPrice.toFixed(2)}</p>
      </div>

      <p>Please verify the payment and update the order status in the admin panel.</p>
    </div>
  `;

  await Promise.all([
    sendEmail(email, 'Order Confirmation - Bloo', customerEmailHtml),
    sendEmail(ADMIN_EMAIL, `New Order Received - #${orderShortId}`, adminEmailHtml),
  ]);

  return {
    success: true,
    message: 'Order confirmation emails sent successfully',
    orderId: orderShortId,
  };
}
