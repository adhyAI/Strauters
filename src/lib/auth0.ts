import { Auth0Client } from "@auth0/nextjs-auth0/server";

// On Vercel, prefer the stable production URL (falls back to the
// per-deployment VERCEL_URL) when APP_BASE_URL hasn't been set explicitly.
if (!process.env.APP_BASE_URL) {
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    process.env.APP_BASE_URL = `https://${vercelHost}`;
  }
}

export const auth0 = new Auth0Client();
