"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  TicketPercent,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { auth } from "@/firebase/client";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/apiResponse";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { CartViewItem } from "@/types/cart";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { AppUser } from "@/types/user";

const Cart = () => {
  // Local state for static product data (images, names, prices)
  const [productDetails, setProductDetails] = useState<CartViewItem[]>([]);
  const [coupon, setCoupon] = useState("");
  
  // Local loading state for fetching details
  const [isFetchingDetails, setIsFetchingDetails] = useState(true);

  // Zustand Stores
  const {
    items, // Live source of truth for quantity & existence
    increaseQty,
    decreaseQty,
    removeItem,
    syncToBackend,
  } = useCartStore();

  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();

  // Create unique string that changes ONLY when items are Added/Removed
  // We use this to prevent re-fetching when just quantity changes
  const itemsSignature = useMemo(() => {
    return items
      .map((i) => `${i.productId}-${i.variantColor}`)
      .sort()
      .join("|");
  }, [items]);

  // -----------------------------
  // Fetch Product Details (Name, Image)
  // -----------------------------
  useEffect(() => {
    const fetchCartDetails = async () => {
      // If auth is still loading, wait.
      if (authLoading) return;

      setIsFetchingDetails(true);

      try {
        // If we have items in Zustand/Local Storage, fetch their details
        if (items.length > 0) {
          const res = await axios.post<ApiResponse<CartViewItem[]>>(
            "/api/cart/items",
            { items: items }
          );
          setProductDetails(res.data.data ?? []);
        } else {
          setProductDetails([]);
        }
      } catch (error) {
        console.error("Error fetching cart details:", error);
      } finally {
        setIsFetchingDetails(false);
      }
    };

    fetchCartDetails();
    
    // 🔥 CRITICAL FIX: We only re-run this if 'itemsSignature' changes (Add/Remove).
    // We do NOT include 'items' here, so quantity changes don't trigger a reload.
  }, [authLoading, itemsSignature]); 

  // -----------------------------
  // Merge Static Data (Server) with Live Quantity (Local)
  // -----------------------------
  const displayItems = useMemo(() => {
    return productDetails
      .map((detail) => {
        const liveItem = items.find(
          (i) =>
            i.productId === detail.productId &&
            i.variantColor === detail.variantColor
        );

        // Instant Update: We take quantity from 'liveItem' (Zustand) 
        // which updates immediately on click.
        if (liveItem) {
          return { ...detail, quantity: liveItem.quantity };
        }
        return null;
      })
      .filter((item): item is CartViewItem => item !== null);
  }, [productDetails, items]); // 'items' is here, so the UI updates instantly

  // -----------------------------
  // Checkout Logic
  // -----------------------------
  const checkout = async () => {
    if (!user) {
      toast.info("Please login before checking out!");
      router.replace("/login");
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Session expired, please login again");
        router.replace("/login");
        return;
      }

      const res = await axios.get<ApiResponse<AppUser>>("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dbUser = res.data.data;

      if (!dbUser) {
        toast.error("User not found");
        router.replace("/login");
        return;
      }

      const emailOk = dbUser.emailVerified === true;
      const phoneOk = dbUser.phoneVerified === true;

      if (emailOk && phoneOk) {
        router.replace("/checkout");
        return;
      }
      router.replace("/cart/verify");
    } catch (error) {
      const err = error as AxiosError<ApiResponse<null>>;
      toast.error(err.response?.data?.message || "Unable to verify user status");
    }
  };

  // -----------------------------
  // Helpers & Actions
  // -----------------------------
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 🔥 These actions update Zustand instantly.
  // The 'syncToBackend' happens asynchronously and doesn't block UI.
  const handleIncrease = (productId: string, variantColor: string) => {
    increaseQty(productId, variantColor);
    // Background sync - no await needed for UI
    if (user) syncToBackend().catch(console.error);
  };

  const handleDecrease = (productId: string, variantColor: string) => {
    decreaseQty(productId, variantColor);
    if (user) syncToBackend().catch(console.error);
  };

  const handleRemove = (productId: string, variantColor: string) => {
    removeItem(productId, variantColor);
    if (user) syncToBackend().catch(console.error);
  };

  // -----------------------------
  // Calculations
  // -----------------------------
  const subtotal = displayItems.reduce(
    (acc, item) => acc + item.priceSnapshot * item.quantity,
    0
  );
  const shipping = 0;
  const total = subtotal + shipping;


  // -----------------------------
  // 1. LOADING STATE (Auth OR Data Fetching)
  // -----------------------------
  // Only show full page spinner on initial load or if structure changes
  const isPageLoading = authLoading || isFetchingDetails;

  if (isPageLoading && displayItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white">
        <Spinner className="size-8 text-zinc-900" />
      </div>
    );
  }

  // -----------------------------
  // 2. EMPTY STATE
  // -----------------------------
  if (!isPageLoading && displayItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 bg-white animate-in fade-in duration-500">
        <div className="p-6 rounded-full bg-zinc-50 border border-zinc-100">
          <ShoppingBag className="h-10 w-10 text-zinc-300" strokeWidth={1} />
        </div>
        <h2 className="text-xl font-light text-zinc-900">Your bag is empty</h2>
        <Link href="/products">
          <Button
            variant="outline"
            className="rounded-none uppercase tracking-widest text-xs h-12 px-8"
          >
            Start Collection
          </Button>
        </Link>
      </div>
    );
  }

  // -----------------------------
  // 3. MAIN CART RENDER
  // -----------------------------
  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-black selection:text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
      <main className="container mx-auto px-4 md:px-6 py-12 lg:py-20">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-12">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight font-serif uppercase">
            Shopping Bag
          </h1>
          <p className="text-zinc-500 text-sm tracking-wide">
            {displayItems.length}{" "}
            {displayItems.length === 1 ? "Timepiece" : "Timepieces"} in your
            selection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          {/* LEFT: ITEMS LIST */}
          <div className="lg:col-span-7 space-y-0">
            <div className="hidden md:grid grid-cols-12 text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-4 mb-4">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Price</div>
            </div>

            {displayItems.map((item) => (
              <div
                key={`${item.productId}_${item.variantColor}`}
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-zinc-100 items-center transition-all duration-500 hover:bg-zinc-50/50 -mx-4 px-4 md:mx-0 md:px-0"
              >
                {/* Product Info */}
                <div className="col-span-6 flex gap-6 items-center">
                  <div className="relative h-24 w-20 overflow-hidden bg-zinc-100 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 mix-blend-multiply"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-medium text-base text-zinc-900 font-serif leading-none">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-light tracking-wide uppercase">
                      {item.variantColor}
                    </p>
                    <p className="md:hidden text-sm font-mono text-zinc-900 pt-1">
                      {formatPrice(item.priceSnapshot)}
                    </p>
                  </div>
                </div>

                {/* Quantity Control */}
                <div className="col-span-6 md:col-span-3 flex md:justify-center items-center gap-4 mt-4 md:mt-0">
                  <div className="flex items-center border border-zinc-200">
                    <button
                      onClick={() => handleDecrease(item.productId, item.variantColor)}
                      className="h-8 w-8 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrease(item.productId, item.variantColor)}
                      className="h-8 w-8 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.productId, item.variantColor)}
                    className="md:hidden text-xs text-red-500 uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>

                {/* Price + Remove (Desktop) */}
                <div className="hidden md:flex col-span-3 flex-col items-end gap-2">
                  <p className="text-sm font-mono text-zinc-900">
                    {formatPrice(item.priceSnapshot * item.quantity)}
                  </p>
                  <button
                    onClick={() => handleRemove(item.productId, item.variantColor)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-zinc-400 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: BILL */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-zinc-50 border border-zinc-100 p-8 relative overflow-hidden">
              <h2 className="text-lg font-serif font-medium uppercase tracking-widest mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="font-mono text-zinc-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Shipping Estimate</span>
                  <span className="font-mono text-zinc-900">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
               
              </div>

              <div className="my-6 border-b-2 border-dashed border-zinc-200 w-[110%] -ml-4" />

              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-medium uppercase tracking-widest">
                  Total Due
                </span>
                <span className="text-2xl font-mono font-medium text-zinc-900">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Coupon */}
              <div className="relative mb-6">
                <Input
                  placeholder="PROMO CODE"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="bg-white border-zinc-200 h-11 pr-12 font-mono text-xs uppercase placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-black rounded-none"
                />
                <TicketPercent className="absolute right-4 top-3.5 h-4 w-4 text-zinc-400" />
              </div>

              {/* Checkout */}
              <Button
                className="w-full h-14 bg-black text-white hover:bg-zinc-800 rounded-none uppercase tracking-[0.2em] text-xs font-medium group transition-all duration-500 relative overflow-hidden"
                onClick={checkout}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Checkout Securely{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>

              <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
                <CreditCard className="h-5 w-5 text-zinc-600" />
                <span className="text-[10px] text-zinc-400 uppercase tracking-wide self-center">
                  Encrypted Transaction
                </span>
              </div>
            </div>

            <p className="text-center text-[10px] text-zinc-400 mt-6 uppercase tracking-widest">
              Need assistance?{" "}
              <span className="underline cursor-pointer hover:text-black">
                Client Services
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;