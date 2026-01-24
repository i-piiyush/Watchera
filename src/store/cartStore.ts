import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { auth } from "@/firebase/client";
import { addToGuestCart } from "@/lib/guestCart"; 

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
  loadCart: () => Promise<void>;
  syncToBackend: () => Promise<void>;
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
      // Add item (Updated)
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

        // 🔥 AUTO-SYNC LOGIC
        if (auth.currentUser) {
           get().syncToBackend();
        } else {
           addToGuestCart(item);
        }
      },

      // --------------------
      // Remove item (Updated)
      // --------------------
      removeItem: (productId, variantColor) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId && i.variantColor === variantColor)
          ),
        }));

        // 🔥 AUTO-SYNC LOGIC
        if (auth.currentUser) {
           get().syncToBackend();
        } 
        // Optional: remove from guest cart if needed
      },

      // --------------------
      // Increase Qty (Updated)
      // --------------------
      increaseQty: (productId, variantColor) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantColor === variantColor
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }));

        // 🔥 AUTO-SYNC LOGIC
        if (auth.currentUser) {
           get().syncToBackend();
        }
      },

      // --------------------
      // Decrease Qty (Updated)
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

        // 🔥 AUTO-SYNC LOGIC
        if (auth.currentUser) {
           get().syncToBackend();
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      loadCart: async () => {
        set({ loading: true });
        try {
          const headers = await getAuthHeader();
          const res = await axios.get(`/api/cart`, { headers });
          set({ items: res.data.data?.items || [] }); // Fixed: added .data?.items
        } catch(e) {
            console.log("Load cart error", e)
        } finally {
          set({ loading: false });
        }
      },

      syncToBackend: async () => {
        const items = get().items;
        try {
            const headers = await getAuthHeader();
            await axios.post(`/api/cart`, { items }, { headers });
        } catch(e) {
            console.error("Sync failed", e);
        }
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);