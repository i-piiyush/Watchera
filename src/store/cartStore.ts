import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { auth } from "@/firebase/client";

// --------------------
// Types
// --------------------
export type CartItem = {
  productId: string;
  variantColor: string;
  quantity: number;
  priceSnapshot: number;
};

type CartState = {
  items: CartItem[];
  loading: boolean;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantColor: string) => void;
  increaseQty: (productId: string, variantColor: string) => void;
  decreaseQty: (productId: string, variantColor: string) => void;

  clearCart: () => void;
  loadCart: (userId?: string) => Promise<void>;
  syncToBackend: (userId?: string) => Promise<void>;
};

const getAuthHeader = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
};

// --------------------
// Store
// --------------------
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      // --------------------
      // Add item
      // --------------------
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              i.variantColor === item.variantColor
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId &&
                i.variantColor === item.variantColor
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }

          return { items: [...state.items, item] };
        });
      },

      // --------------------
      // Remove item
      // --------------------
      removeItem: (productId, variantColor) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId && i.variantColor === variantColor)
          ),
        }));
      },

      // --------------------
      // Increase quantity
      // --------------------
      increaseQty: (productId, variantColor) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantColor === variantColor
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }));
      },

      // --------------------
      // Decrease quantity
      // --------------------
      decreaseQty: (productId, variantColor) => {
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId && i.variantColor === variantColor
                ? { ...i, quantity: i.quantity - 1 }
                : i
            )
            .filter((i) => i.quantity > 0),
        }));
      },

      // --------------------
      // Clear cart
      // --------------------
      clearCart: () => {
        set({ items: [] });
      },

      // --------------------
      // Load cart (after login / refresh)
      // --------------------
      loadCart: async () => {
        set({ loading: true });
        try {
          const headers = await getAuthHeader();
          const res = await axios.get(`/api/cart`, { headers });
          set({ items: res.data.items || [] });
        } finally {
          set({ loading: false });
        }
      },

      // --------------------
      // Sync cart to backend
      // --------------------
      syncToBackend: async () => {
        const items = get().items;
        if (!items.length) return;

        const headers = await getAuthHeader();
        await axios.post(`/api/cart`, { items }, { headers });
      },
    }),
    {
      name: "cart-storage", // localStorage key
      partialize: (state) => ({ items: state.items }), // persist only items
    }
  )
);
