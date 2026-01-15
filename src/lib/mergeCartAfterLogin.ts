import { CartItem, useCartStore } from "@/store/cartStore";
import { clearGuestCart, getGuestCart } from "./guestCart";
import axios from "axios";
import { auth } from "@/firebase/client";

export const mergeCartAfterLogin = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const zustandItems = useCartStore.getState().items;
  const guestItems = getGuestCart();
  
  // 1. Backend se purana data mangwao
  const token = await user.getIdToken();
  const res = await axios.get("/api/cart", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const backendItems: CartItem[] = res.data?.data?.items || [];

  const mergedMap = new Map<string, CartItem>();

  // 2. HELPER FUNCTION: Items ko map mein dhang se jodne ke liye
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

  // 3. TEENO (3) sources ko merge karo line-wise
  addToMap(backendItems); // Pehle Database wala
  addToMap(zustandItems); // Fir jo screen par dikh raha hai
  addToMap(guestItems);   // Fir jo localStorage mein guest wala hai

  const mergedCart = Array.from(mergedMap.values());

  // 4. STOP agar teeno khali hain (Faltu API call kyun karein?)
  if (mergedCart.length === 0) return;

  // 5. Database update karo
  await axios.post(
    "/api/cart",
    { items: mergedCart },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // 6. Final State update aur Guest cart clear
  useCartStore.setState({ items: mergedCart });
  clearGuestCart();

  console.log("✅ Everything Merged:", mergedCart);
};