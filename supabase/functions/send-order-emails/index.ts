import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "admin@bloo.com";

const PAYMENT_INFO = {
  zelle: {
    contact: "payments@bloo.com",
    label: "Email/Phone",
  },
  venmo: {
    contact: "@bloo-meals",
    label: "Venmo Handle",
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { orderId, email, paymentMethod, totalPrice } = await req.json();

    if (!orderId || !email || !paymentMethod || !totalPrice) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const paymentInfo = PAYMENT_INFO[paymentMethod as keyof typeof PAYMENT_INFO];
    const orderShortId = orderId.slice(0, 8);

    const customerEmailBody = `
Dear Customer,

Thank you for your order with Bloo!

Order Details:
- Order ID: #${orderShortId}
- Total Amount: $${totalPrice.toFixed(2)}
- Payment Method: ${paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'}

Payment Instructions:
Please send $${totalPrice.toFixed(2)} to:
${paymentInfo.label}: ${paymentInfo.contact}

IMPORTANT: Include order #${orderShortId} in your payment note.

We'll confirm your order once we verify your payment.

Best regards,
The Bloo Team
    `.trim();

    const adminEmailBody = `
New Order Received - Pending Payment Verification

Order Details:
- Order ID: ${orderId}
- Short ID: #${orderShortId}
- Customer Email: ${email}
- Total Amount: $${totalPrice.toFixed(2)}
- Payment Method: ${paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'}

Expected Payment:
${paymentInfo.label}: ${paymentInfo.contact}
Amount: $${totalPrice.toFixed(2)}

Please verify the payment and update the order status.

View Order: [Admin Panel Link]
    `.trim();

    console.log("Order emails prepared:");
    console.log("Customer Email:", email);
    console.log("Admin Email:", ADMIN_EMAIL);
    console.log("Order ID:", orderShortId);
    console.log("Total:", totalPrice);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order confirmation emails prepared",
        orderId: orderShortId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing order emails:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process order emails",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
