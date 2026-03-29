import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SHIPPING_RATES = { us: 15, international: 45 };
export const TAX_RATE_US = 0.08;

function generateCartItemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      promoCode: null,        // { code, discountType, discountValue } | null
      shippingRegion: 'international', // 'us' | 'international'

      // ── Item actions ────────────────────────────────────────────────────────
      addItem: (config) => {
        const fabric = config.fabric || {};
        const item = {
          cartItemId: generateCartItemId(),
          suitConfig: { ...config },
          fabricId: fabric._id || null,
          fabricName: fabric.name || '',
          fabricSwatchUrl: fabric.thumbnailUrl || null,
          unitPrice: fabric.price || 0,
          quantity: 1,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({ items: [...state.items, item], isOpen: true }));
        return item;
      },

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        })),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemId === cartItemId
              ? { ...i, quantity: Math.max(1, quantity) }
              : i
          ),
        })),

      // ── Drawer ──────────────────────────────────────────────────────────────
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      // ── Promo code ──────────────────────────────────────────────────────────
      applyPromo: (promoData) => set({ promoCode: promoData }),
      removePromo: () => set({ promoCode: null }),

      // ── Shipping ────────────────────────────────────────────────────────────
      setShippingRegion: (region) => set({ shippingRegion: region }),

      // ── Bulk ────────────────────────────────────────────────────────────────
      clearCart: () => set({ items: [], promoCode: null }),

      setItems: (items) => set({ items }),

      // ── Computed ────────────────────────────────────────────────────────────
      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      getDiscount: () => {
        const { promoCode } = get();
        if (!promoCode) {
          return 0;
        }
        const subtotal = get().getSubtotal();
        if (promoCode.discountType === 'percentage') {
          return subtotal * (promoCode.discountValue / 100);
        }
        return Math.min(promoCode.discountValue, subtotal);
      },

      getShipping: () => {
        const { shippingRegion } = get();
        return SHIPPING_RATES[shippingRegion] ?? SHIPPING_RATES.international;
      },

      getTax: () => {
        const { shippingRegion } = get();
        if (shippingRegion !== 'us') {
          return 0;
        }
        return get().getSubtotal() * TAX_RATE_US;
      },

      getOrderTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const shipping = get().getShipping();
        const tax = get().getTax();
        return Math.max(0, subtotal - discount + shipping + tax);
      },

      // Legacy alias kept for backwards-compatibility
      getTotal: () => get().getSubtotal(),

      getCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        shippingRegion: state.shippingRegion,
      }),
    }
  )
);

export default useCartStore;
