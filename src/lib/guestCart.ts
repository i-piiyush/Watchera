import { CartItem } from "@/store/cartStore";

// storage key
const KEY = "guest_cart";

// --------------------
// Get guest cart
// --------------------
export const getGuestCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEY) || "[]");
};

// --------------------
// Add item to guest cart
// --------------------
export const addToGuestCart = (item: CartItem) => {
  const cart = getGuestCart();

  const existing = cart.find(
    (i) =>
      i.productId === item.productId &&
      i.variantColor === item.variantColor
  );

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  localStorage.setItem(KEY, JSON.stringify(cart));
};

// --------------------
// Clear guest cart
// --------------------
export const clearGuestCart = () => {
  localStorage.removeItem(KEY);
};
