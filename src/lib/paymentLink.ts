export function buildUpgradeLink(userId: string): string {
  const base = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_URL;
  if (!base) return "#";
  const url = new URL(base);
  url.searchParams.set("client_reference_id", userId);
  return url.toString();
}
