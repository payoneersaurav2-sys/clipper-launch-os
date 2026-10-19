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

import { initializePaddle as _initializePaddle, type Paddle, type PaddleEventData } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined;
let initPromise: Promise<Paddle | undefined> | null = null;

export type PaddleEventListener = (event: PaddleEventData) => void;
const eventListeners = new Set<PaddleEventListener>();

/**
 * Subscribe to real-time Paddle checkout events (checkout.loaded, checkout.completed, etc.)
 */
export function subscribePaddleEvents(listener: PaddleEventListener): () => void {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

export async function initializePaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return paddleInstance;
  if (initPromise) return initPromise;

  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  if (!token) {
    // Paddle not yet configured — checkout will fall back to Whop URLs.
    return undefined;
  }

  const env = (import.meta.env.VITE_PADDLE_ENV as string | undefined) ?? 'sandbox';

  initPromise = _initializePaddle({
    token,
    environment: env === 'production' ? 'production' : 'sandbox',
    eventCallback: (event) => {
      console.log('[Paddle Event]', event);
      eventListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.error('[Paddle Listener Error]', e);
        }
      });
      if ((event as any)?.type === 'checkout.warning' || (event as any)?.name === 'checkout.error' || (event as any)?.type === 'checkout.error') {
        console.error('[Paddle Error/Warning Detail]', event);
      }
    },
    checkout: {
      settings: {
        displayMode: 'inline',
        variant: 'one-page',
        theme: 'dark',
        locale: 'en',
        frameTarget: 'paddle-checkout-frame',
        frameInitialHeight: 450,
        frameStyle: 'width: 100%; min-height: 450px; background-color: transparent; border: none;',
        successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/complete`,
      },
    },
  }).then((inst) => {
    paddleInstance = inst;
    return inst;
  });

  return initPromise;
}

/** Returns the initialized Paddle instance, or undefined if not yet ready. */
export function getPaddle(): Paddle | undefined {
  return paddleInstance;
}

/** Asynchronously returns the initialized Paddle instance, awaiting initialization if necessary. */
export async function getPaddleAsync(): Promise<Paddle | undefined> {
  if (paddleInstance) return paddleInstance;
  return initializePaddle();
}
