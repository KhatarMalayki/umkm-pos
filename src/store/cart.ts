import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  productUnitId: string;
  productName: string;
  unitName: string;
  unitAbbr: string;
  price: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQty: (productUnitId: string, quantity: number) => void;
  removeItem: (productUnitId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productUnitId === newItem.productUnitId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productUnitId === newItem.productUnitId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
      },
      updateQty: (productUnitId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productUnitId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productUnitId === productUnitId ? { ...i, quantity } : i
          ),
        }));
      },
      removeItem: (productUnitId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productUnitId !== productUnitId),
        }));
      },
      clearCart: () => set({ items: [] }),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "umkm-cart" }
  )
);
