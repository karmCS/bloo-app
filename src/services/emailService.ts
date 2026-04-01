interface OrderItem {
  meal_name: string;
  price: number;
  quantity: number;
}

interface SendOrderEmailsParams {
  orderId: string | null;
  email: string;
  paymentMethod: 'zelle' | 'venmo';
  totalPrice: number;
  items: OrderItem[];
}

export async function sendOrderEmails({
  orderId,
  email,
  paymentMethod,
  totalPrice,
  items,
}: SendOrderEmailsParams) {
  const response = await fetch('/api/send-order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, email, paymentMethod, totalPrice, items }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || `Email API returned ${response.status}`);
  }

  return body;
}
