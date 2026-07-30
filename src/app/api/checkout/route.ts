import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRO_PRICE_ID is not set" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.stripeCustomerId ? undefined : user.email,
    customer: user.stripeCustomerId ?? undefined,
    client_reference_id: user.id,
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
