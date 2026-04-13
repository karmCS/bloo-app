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
  /** Must match checkout-generated UUID; validated server-side (basic CSRF). */
  csrfToken: string;
}

export async function sendOrderEmails({
  orderId,
  email,
  paymentMethod,
  totalPrice,
  items,
  csrfToken,
}: SendOrderEmailsParams) {
  const response = await fetch('/api/send-order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      email,
      paymentMethod,
      totalPrice,
      items,
      csrfToken,
    }),
  });

  let body: { error?: string } = {};
  try {
    body = await response.json();
  } catch {
    /* non-JSON error body — don’t leak details to UI */
  }

  if (!response.ok) {
    if (response.status === 500) {
      throw new Error('Order processing failed. Please try again.');
    }
    throw new Error(
      body.error ?? 'Order processing failed. Please try again.'
    );
  }

  return body;
}
