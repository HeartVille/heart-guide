import { headers } from "next/headers";

export async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const requestHeaders = await headers();
  return `https://${requestHeaders.get("host")}`;
}
