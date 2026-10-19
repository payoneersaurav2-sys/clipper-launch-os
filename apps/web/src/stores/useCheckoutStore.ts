import { create } from 'zustand';
import type { BillingInterval } from '@/lib/pricing';

export interface CheckoutModalState {
  isOpen: boolean;
  planId: 'creator' | 'pro' | 'agency';
  billing: BillingInterval;
  customPriceId?: string;
  checkoutUrl?: string;
  openCheckout: (params?: {
    planId?: 'creator' | 'pro' | 'agency';
    billing?: BillingInterval;
    paddlePriceId?: string;
    checkoutUrl?: string;
  }) => void;
  setBilling: (billing: BillingInterval) => void;
  setPlanId: (planId: 'creator' | 'pro' | 'agency') => void;
  closeCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutModalState>((set) => ({
  isOpen: false,
  planId: 'pro',
  billing: 'annual',
  customPriceId: undefined,
  checkoutUrl: undefined,
  openCheckout: (params) => {
    set({
      isOpen: true,
      planId: params?.planId ?? 'pro',
      billing: params?.billing ?? 'annual',
      customPriceId: params?.paddlePriceId,
      checkoutUrl: params?.checkoutUrl,
    });
  },
  setBilling: (billing) => set({ billing }),
  setPlanId: (planId) => set({ planId }),
  closeCheckout: () => set({ isOpen: false }),
}));
