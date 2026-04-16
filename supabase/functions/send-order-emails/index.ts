import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ORDER_NOTIFICATION_EMAIL =
  Deno.env.get("ORDER_NOTIFICATION_EMAIL")?.trim() ||
  Deno.env.get("ADMIN_EMAIL")?.trim() ||
  "admin@bloo.com";

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
    const { orderId, email, paymentMethod, totalPrice, items } = await req.json();

    console.log("Received request:", { orderId, email, paymentMethod, totalPrice, itemCount: items?.length });

    if (!orderId || !email || !paymentMethod || totalPrice == null) {
      console.error("Missing required fields:", { orderId: !!orderId, email: !!email, paymentMethod: !!paymentMethod, totalPrice });
      return new Response(
        JSON.stringify({ error: "Missing required fields", received: { orderId: !!orderId, email: !!email, paymentMethod: !!paymentMethod, totalPrice } }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured — set it via: supabase secrets set RESEND_API_KEY=re_...");
      return new Response(
        JSON.stringify({ error: "Email service not configured: RESEND_API_KEY missing" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const paymentInfo = PAYMENT_INFO[paymentMethod as keyof typeof PAYMENT_INFO];
    const orderShortId = orderId.slice(0, 8);

    const itemsList = items && items.length > 0
      ? items.map((item: any) => `- ${item.meal_name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')
      : 'No items listed';

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

          ${items && items.length > 0 ? `
            <h3>Items Ordered:</h3>
            <ul style="list-style: none; padding-left: 0;">
              ${items.map((item: any) => `
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

          ${items && items.length > 0 ? `
            <h3>Items Ordered:</h3>
            <ul style="list-style: none; padding-left: 0;">
              ${items.map((item: any) => `
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

    console.log("Sending customer email to:", email);
    const customerResult = await resend.emails.send({
      from: 'Bloo <orders@bloo.com>',
      to: email,
      subject: 'Order Confirmation - Bloo',
      html: customerEmailHtml,
    });
    console.log("Customer email result:", JSON.stringify(customerResult));

    console.log("Sending staff order notification to:", ORDER_NOTIFICATION_EMAIL);
    const adminResult = await resend.emails.send({
      from: 'Bloo Orders <orders@bloo.com>',
      to: ORDER_NOTIFICATION_EMAIL,
      subject: `New Order Received - #${orderShortId}`,
      html: adminEmailHtml,
    });
    console.log("Admin email result:", JSON.stringify(adminResult));

    console.log("Order emails sent successfully — orderId:", orderShortId, "total:", totalPrice);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order confirmation emails sent successfully",
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
        error: "Failed to send order emails",
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
