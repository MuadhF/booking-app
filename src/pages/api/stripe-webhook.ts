import Stripe from "stripe";
import { buffer } from "micro";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return res.status(400).send(`Webhook Error`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const metadata = session.metadata;

    // Insert booking into Supabase
    await supabase.from("bookings").insert({
      pitch_id: metadata.pitch_id,
      booking_date: metadata.booking_date,
      start_time: metadata.start_time,
      duration_hours: metadata.duration_hours,
      total_price: metadata.total_price,
      payment_status: "paid",
      status: "confirmed",
      stripe_session_id: session.id,
    });
  }

  res.json({ received: true });
}