import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only key
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { pitch_id, pitchName, venueName, booking_date, start_time, duration_hours, total_price } = req.body;

  // 1️⃣ Create temporary booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      pitch_id,
      booking_date,
      start_time,
      duration_hours,
      total_price,
      status: "pending_payment",
      payment_status: "unpaid",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error });

  // 2️⃣ Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "sgd",
          product_data: {
            name: `${pitchName} - ${venueName}`,
            description: `${booking_date} ${start_time} (${duration_hours}h)`,
          },
          unit_amount: Math.round(total_price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      booking_id: booking.id,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?booking_id=${booking.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
  });

  // 3️⃣ Save session ID
  await supabase.from("bookings").update({ stripe_session_id: session.id }).eq("id", booking.id);

  res.json({ url: session.url });
}
