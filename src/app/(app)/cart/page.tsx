"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { auth } from "@/firebase/client";
import axios from "axios";
import { ApiResponse } from "@/types/apiResponse";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

// --- DEMO DATA ---
const INITIAL_CART = [
  {
    id: "1",
    name: "Chronos Azure",
    variant: "Midnight Blue / Leather",
    price: 45000,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1000&auto=format&fit=crop",
    inStock: true,
  },
  {
    id: "2",
    name: "Lumina Gold",
    variant: "Rose Gold / Steel",
    price: 125000,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1000&auto=format&fit=crop",
    inStock: true,
  },
  {
    id: "3",
    name: "Apex Diver",
    variant: "Obsidian / Rubber",
    price: 32000,
    quantity: 2,
    image:
      "https://images.unsplash.com/photo-1539874754764-5a96559165b0?q=80&w=1000&auto=format&fit=crop",
    inStock: true,
  },
];

const Cart = () => {
  const [cartItems, setCartItems] = useState(INITIAL_CART);
  const [coupon, setCoupon] = useState("");
  const {items} = useCartStore()
  console.log("cart Items: " , items)

  // --- LOGIC ---
  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 50000 ? 0 : 500;
  const total = subtotal + shipping;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 bg-white">
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

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-black selection:text-white">
      <main className="container mx-auto px-4 md:px-6 py-12 lg:py-20">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-12">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight font-serif uppercase">
            Shopping Bag
          </h1>
          <p className="text-zinc-500 text-sm tracking-wide">
            {cartItems.length} {cartItems.length === 1 ? "Timepiece" : "Timepieces"} in
            your selection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          {/* --- LEFT: ITEMS LIST --- */}
          <div className="lg:col-span-7 space-y-0">
            {/* Table Header (Visual only) */}
            <div className="hidden md:grid grid-cols-12 text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-4 mb-4">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Price</div>
            </div>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-zinc-100 items-center transition-all duration-500 hover:bg-zinc-50/50 -mx-4 px-4 md:mx-0 md:px-0"
              >
                {/* Product Info */}
                <div className="col-span-6 flex gap-6 items-center">
                  <div className="relative h-24 w-20 overflow-hidden bg-zinc-100 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 mix-blend-multiply"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-base text-zinc-900 font-serif leading-none">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-light tracking-wide uppercase">
                      {item.variant}
                    </p>
                    {/* Mobile Price Display */}
                    <p className="md:hidden text-sm font-mono text-zinc-900 pt-1">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>

                {/* Quantity Control */}
                <div className="col-span-6 md:col-span-3 flex md:justify-center items-center gap-4 mt-4 md:mt-0">
                  <div className="flex items-center border border-zinc-200">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="h-8 w-8 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="h-8 w-8 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="md:hidden text-xs text-red-500 uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>

                {/* Price (Desktop) & Remove Action */}
                <div className="hidden md:flex col-span-3 flex-col items-end gap-2">
                  <p className="text-sm font-mono text-zinc-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-zinc-400 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* --- RIGHT: THE BILL (Sticky Summary) --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-zinc-50 border border-zinc-100 p-8 relative overflow-hidden">
              {/* Visual "Receipt" Notch Effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent opacity-20" />

              <h2 className="text-lg font-serif font-medium uppercase tracking-widest mb-6 flex items-center gap-2">
                Order Summary
              </h2>

              {/* Bill Details */}
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
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Tax (18%)</span>
                  <span className="font-mono text-zinc-900">
                    {formatPrice(subtotal * 0.18)}
                  </span>
                </div>
              </div>

              {/* Receipt Separator Line */}
              <div className="my-6 border-b-2 border-dashed border-zinc-200 w-[110%] -ml-4" />

              {/* Total */}
              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-medium uppercase tracking-widest">
                  Total Due
                </span>
                <span className="text-2xl font-mono font-medium text-zinc-900">
                  {formatPrice(total + subtotal * 0.18)}
                </span>
              </div>

              {/* Coupon Input */}
              <div className="relative mb-6">
                <Input
                  placeholder="PROMO CODE"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="bg-white border-zinc-200 h-11 pr-12 font-mono text-xs uppercase placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-black rounded-none"
                />
                <TicketPercent className="absolute right-4 top-3.5 h-4 w-4 text-zinc-400" />
              </div>

              {/* Checkout Button */}
              <Button className="w-full h-14 bg-black text-white hover:bg-zinc-800 rounded-none uppercase tracking-[0.2em] text-xs font-medium group transition-all duration-500 relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Checkout Securely{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                {/* Hover Effect Background */}
                <div className="absolute inset-0 bg-zinc-800 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </Button>

              <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
                {/* Just visual placeholders for luxury payment icons */}
                <CreditCard className="h-5 w-5 text-zinc-600" />
                <span className="text-[10px] text-zinc-400 uppercase tracking-wide self-center">
                  Encrypted Transaction
                </span>
              </div>
            </div>

            {/* Minimal Help Text */}
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
