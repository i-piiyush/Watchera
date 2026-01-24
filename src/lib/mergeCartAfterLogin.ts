import { CartItem, useCartStore } from "@/store/cartStore";
import { clearGuestCart, getGuestCart } from "./guestCart";
import axios from "axios";
import { auth } from "@/firebase/client";

export const mergeCartAfterLogin = async () => {
  const user = auth.currentUser;
  if (!user) return;

  // 1. Get truly "new" items from the specific guest storage
  const guestItems = getGuestCart();
  
  // 2. Get backend items
  const token = await user.getIdToken();
  const res = await axios.get("/api/cart", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const backendItems: CartItem[] = res.data?.data?.items || [];

  const mergedMap = new Map<string, CartItem>();

  const addToMap = (items: CartItem[]) => {
    items.forEach((item) => {
      const key = `${item.productId}_${item.variantColor}`;
      if (mergedMap.has(key)) {
        mergedMap.get(key)!.quantity += item.quantity;
      } else {
        mergedMap.set(key, { ...item });
      }
    });
  };

  // 3. MERGE LOGIC FIXED:
  // Only merge Backend + Guest. 
  // IGNORE zustandItems (because on refresh, they are just a stale copy of backend)
  addToMap(backendItems); 
  addToMap(guestItems);   

  const mergedCart = Array.from(mergedMap.values());

  // 4. Update Backend
  if (guestItems.length > 0) {
    // Only call API if we actually had guest items to merge
    await axios.post(
      "/api/cart",
      { items: mergedCart },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✅ Merged Guest Cart into Account");
  } else {
    // If no guest items, just trust the backend data (Fixes the refresh issue)
    console.log("⬇️ No guest items, loading backend cart");
  }

  // 5. Update Local State (Zustand) to match Backend
  useCartStore.setState({ items: mergedCart });
  
  // 6. Clear guest storage so we don't merge them again next time
  clearGuestCart();
};