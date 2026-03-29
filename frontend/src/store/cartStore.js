import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      getCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
