/**
 * Paddle.js client-side singleton.
 *
 * Environment variables required (set in Vercel / .env.local):
 *   VITE_PADDLE_CLIENT_TOKEN  – sandbox: "test_..."  |  live: "live_..."
 *   VITE_PADDLE_ENV           – "sandbox" | "production"
 *
 * initializePaddle() is idempotent; call it once from your app entry point
 * (e.g. App.tsx) and then use getPaddle() anywhere you need the instance.
 *
 * DO NOT import or call this file server-side. It is browser-only.
 */

import { initializePaddle as _initializePaddle, type Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined;

export async function initializePaddle(): Promise<void> {
  // No-op if already initialized or if credentials are absent (avoids crashes in CI/SSR).
  if (paddleInstance) return;

  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  if (!token) {
    // Paddle not yet configured — checkout will fall back to Whop URLs.
    return;
  }

  const env = (import.meta.env.VITE_PADDLE_ENV as string | undefined) ?? 'sandbox';

  paddleInstance = await _initializePaddle({
    token,
    environment: env === 'production' ? 'production' : 'sandbox',
    checkout: {
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        locale: 'en',
      },
    },
  });
}

/** Returns the initialized Paddle instance, or undefined if not yet ready. */
export function getPaddle(): Paddle | undefined {
  return paddleInstance;
}
