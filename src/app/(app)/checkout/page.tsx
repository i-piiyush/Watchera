"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Truck,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import axios from "axios";

// Stores & Config
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/firebase/client";
import { useCartStore } from "@/store/cartStore";
import { CartViewItem } from "@/types/cart";
import {
  INDIAN_STATES,
  ShippingFormData,
  shippingSchemaFrontend,
} from "@/app/schemas/shipingSchema";

// Shadcn UI Components
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiResponse } from "@/types/apiResponse";
import { CheckoutDoc } from "@/types/checkout";
import { loadRazorpayScript } from "@/lib/razorpay";

/** ---------- Micro Animations ---------- */
const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
} as const;

const SOFT_SCALE_TAP = { scale: 0.985 };
const SOFT_HOVER = { y: -1 };

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** ---------- Small UI Bits ---------- */
const FieldError = ({ msg }: { msg?: string }) => {
  if (!msg) return null;
  return <p className="mt-1.5 text-[11px] text-red-500 leading-snug">{msg}</p>;
};

const SkeletonLine = ({ w = "w-full" }: { w?: string }) => (
  <div
    className={cn("h-3 rounded-full bg-zinc-100 relative overflow-hidden", w)}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.3s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
  </div>
);

/** shimmer keyframes */
const shimmerStyle = `
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
`;

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">(
    "online",
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartViewItem[]>([]);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  const { user, loading } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchemaFrontend),
    defaultValues: { paymentMethod: "online" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (!user && !loading) {
      toast.error("Please login to proceed");
      router.replace("/login");
    }

    const fetchCartItems = async () => {
      try {
        setCheckoutLoading(true);
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await axios.post(
          "/api/cart/items",
          { items },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        setCartItems(res.data?.data || []);
      } catch (error) {
        console.error("Cart fetch error:", error);
      } finally {
        setCheckoutLoading(false);
      }
    };

    fetchCartItems();
  }, [user, loading, items, router]);

  useEffect(() => {
    setValue("paymentMethod", paymentMethod);
  }, [paymentMethod, setValue]);

  const subtotal = useMemo(() => {
    return (
      cartItems.reduce(
        (acc, item) => acc + item.priceSnapshot * item.quantity,
        0,
      ) ?? 0
    );
  }, [cartItems]);

  const total = subtotal;
  const advanceAmount = Math.ceil(total * 0.1);

  const onSubmit = async (formData: ShippingFormData) => {
    setCheckoutLoading(true);
    try {
      // 1. FIRST: Ensure Razorpay Script is loaded
      const isLoaded = await loadRazorpayScript(
        "https://checkout.razorpay.com/v1/checkout.js",
      );

      if (!isLoaded) {
        toast.error(
          "SDK failed to load. Please check your internet connection.",
        );
        setCheckoutLoading(false);
        return;
      }

      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      // 2. Create Checkout in DB
      const res = await axios.post<ApiResponse<CheckoutDoc>>(
        "api/checkout/create",
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const checkoutId = res.data?.data?.checkoutId;

      // 3. Create Razorpay Order
      const razorPayResponse = await axios.post(
        "/api/razorpay/create-order",
        { checkoutId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const rzpOrderData = razorPayResponse.data;

      if (!rzpOrderData.success) {
        throw new Error("Payment initialization failed");
      }

      // 4. Open Razorpay (Now safe because script is loaded)
      const options = {
        key: rzpOrderData.key,
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name: "Chhabra gifts",
        description: "Order Payment",
        order_id: rzpOrderData.razorpayOrderId,

        handler: async function (response: any) {
          console.log("Payment Success! Verifying...");

          const paymentData = {
            checkoutId: checkoutId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          };

          try {
            // 1. Verify Payment on Backend
            const verifyRes = await axios.post(
              "/api/razorpay/verify-payment",
              paymentData,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            const verifyData = verifyRes.data;

            if (verifyData?.success) {
              toast.success("Order Placed Successfully!");
              clearCart();
              router.replace(`/orders`);
            } else {
              console.error("Verification Failed:", verifyData);
              toast.error(
                "Payment Verification Failed. Please contact support.",
              );
              setCheckoutLoading(false);
            }
          } catch (verifyError) {
            console.error("Verification Error:", verifyError);
            toast.error(
              "Payment successful but verification failed. Check My Orders.",
            );
            setCheckoutLoading(false);
          }
        },
        theme: { color: "#F3DF96" },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setCheckoutLoading(false);
    } finally {
      // Keep loading true if successful to prevent double clicks during redirect
    }
  };

  const stateItems = useMemo(
    () => [
      { label: "Select a state", value: null as string | null },
      ...INDIAN_STATES.map((st) => ({ label: st, value: st })),
    ],
    [],
  );

  const ui = {
    page: "min-h-screen bg-white text-zinc-900",
    container: "max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14",
    grid: "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14",
    sectionTitle: "text-lg font-semibold tracking-tight",
    sectionHint: "text-sm text-zinc-500",
    card: "rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]",
    input: (err?: any) =>
      cn(
        "h-12 w-full rounded-xl border bg-white px-4 text-[14px]",
        "placeholder:text-zinc-400",
        "transition-all duration-200",
        "focus:outline-none focus:ring-4 focus:ring-zinc-100 focus:border-zinc-900",
        "hover:border-zinc-300",
        err
          ? "border-red-400 focus:border-red-500 focus:ring-red-50"
          : "border-zinc-200",
      ),
    label: "text-[12px] font-medium text-zinc-700",
    button: cn(
      "h-12 w-full rounded-xl bg-zinc-900 text-white text-[13px] font-semibold",
      "transition-all duration-200",
      "hover:bg-zinc-800 active:scale-[0.99]",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      "flex items-center justify-center gap-2",
      "shadow-sm",
    ),
    pill: "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600",
  };

  const isInitialLoading = checkoutLoading && cartItems.length === 0;

  if (isInitialLoading) {
    return (
      <div className={ui.page}>
        <style>{shimmerStyle}</style>
        <div className={ui.container}>
          <div className="max-w-xl">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Checkout
              </h1>
              <p className="mt-1 text-sm text-zinc-500">Loading your cart…</p>
            </div>
            <div className={cn(ui.card, "p-6 space-y-4")}>
              <SkeletonLine w="w-1/2" />
              <SkeletonLine />
              <SkeletonLine />
              <div className="pt-2">
                <SkeletonLine w="w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const PayLabel =
    paymentMethod === "cod"
      ? `Pay Advance ₹${advanceAmount.toLocaleString()}`
      : `Pay Securely ₹${total.toLocaleString()}`;

  const selectedState = watch("state");

  return (
    <div className={ui.page}>
      <style>{shimmerStyle}</style>

      {/* Top bar */}
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Checkout</p>
            <p className="text-xs text-zinc-500">
              Complete your shipping & payment
            </p>
          </div>
          <span className={ui.pill}>Total: ₹{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Mobile Summary */}
      <div className="lg:hidden border-b border-zinc-200 bg-zinc-50">
        <button
          onClick={() => setIsMobileSummaryOpen((v) => !v)}
          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between"
        >
          <span className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
            Order Summary
            {isMobileSummaryOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </span>
          <span className="text-sm font-semibold">
            ₹{total.toLocaleString()}
          </span>
        </button>

        <AnimatePresence>
          {isMobileSummaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden bg-white"
            >
              <div className="px-4 sm:px-6 pb-5 space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-700">
                      {item.name}{" "}
                      <span className="text-zinc-400 text-xs">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="font-semibold text-zinc-900">
                      ₹{(item.priceSnapshot * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={ui.container}>
        <form onSubmit={handleSubmit(onSubmit)} className={ui.grid}>
          {/* LEFT */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={FADE_UP}
            className="lg:col-span-7 space-y-10"
          >
            {/* Shipping */}
            <section className={cn(ui.card, "p-6 sm:p-8")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={ui.sectionTitle}>Shipping Address</h2>
                  <p className={cn(ui.sectionHint, "mt-1")}>
                    Use a reachable address for delivery updates.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={ui.label}>First name</label>
                  <input
                    {...register("firstName")}
                    className={ui.input(errors.firstName)}
                    placeholder="Anjali"
                  />
                  <FieldError msg={errors.firstName?.message} />
                </div>

                <div>
                  <label className={ui.label}>Last name</label>
                  <input
                    {...register("lastName")}
                    className={ui.input(errors.lastName)}
                    placeholder="Singh"
                  />
                  <FieldError msg={errors.lastName?.message} />
                </div>

                <div className="sm:col-span-2">
                  <label className={ui.label}>Street address</label>
                  <div className="relative">
                    <input
                      {...register("address")}
                      className={cn(ui.input(errors.address), "pr-11")}
                      placeholder="Flat, House no, Street, Area"
                    />
                    <MapPin className="absolute right-4 top-3.5 w-5 h-5 text-zinc-400 pointer-events-none" />
                  </div>
                  <FieldError msg={errors.address?.message} />
                </div>

                <div>
                  <label className={ui.label}>City</label>
                  <input
                    {...register("city")}
                    className={ui.input(errors.city)}
                    placeholder="Chandigarh"
                  />
                  <FieldError msg={errors.city?.message} />
                </div>

              <div className="sm:col-span-2">
  <label className={ui.label}>State</label>

  <Select
    // ❌ REMOVED: items={stateItems}
    onValueChange={(val: string) => {
      if (!val) return;
      setValue("state", val as (typeof INDIAN_STATES)[number], {
        shouldValidate: true,
        shouldDirty: true,
      });
      trigger("state");
    }}
    value={selectedState || undefined} // Controlled value
  >
    <SelectTrigger
      className={cn(
        "h-12 w-full rounded-xl border bg-white px-4 text-[14px]",
        "transition-all duration-200",
        "hover:border-zinc-300",
        "focus:ring-4 focus:ring-zinc-100 focus:border-zinc-900",
        errors.state
          ? "border-red-400 focus:ring-red-50"
          : "border-zinc-200"
      )}
    >
      <SelectValue placeholder="Select a state" />
    </SelectTrigger>

    <SelectContent className="bg-white border-zinc-200 max-h-72">
      <SelectGroup>
        <SelectLabel>States</SelectLabel>

        {/* ✅ CORRECT WAY: Map items here inside Content */}
        {stateItems.map((item) => {
          if (!item.value) return null; // Skip the "Select a state" placeholder item from list

          return (
            <SelectItem
              key={item.value}
              value={item.value}
              className="cursor-pointer focus:bg-zinc-50 focus:text-zinc-900"
            >
              {item.label}
            </SelectItem>
          );
        })}
      </SelectGroup>
    </SelectContent>
  </Select>

  <FieldError msg={errors.state?.message} />
</div>

                <div className="sm:col-span-2">
                  <label className={ui.label}>Pincode</label>
                  <input
                    {...register("pincode")}
                    inputMode="numeric"
                    className={ui.input(errors.pincode)}
                    placeholder="000000"
                  />
                  <FieldError msg={errors.pincode?.message} />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className={cn(ui.card, "p-6 sm:p-8")}>
              <div>
                <h2 className={ui.sectionTitle}>Payment Method</h2>
                <p className={cn(ui.sectionHint, "mt-1")}>
                  Choose the fastest and safest option.
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                {/* Online */}
                <motion.button
                  type="button"
                  whileTap={SOFT_SCALE_TAP}
                  whileHover={SOFT_HOVER}
                  onClick={() => setPaymentMethod("online")}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4 sm:p-5",
                    "transition-all duration-200",
                    paymentMethod === "online"
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center",
                          paymentMethod === "online"
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-700",
                        )}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Online payment
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          UPI, Cards, Netbanking
                        </p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {paymentMethod === "online" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-zinc-900" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* COD */}
                <motion.button
                  type="button"
                  whileTap={SOFT_SCALE_TAP}
                  whileHover={SOFT_HOVER}
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4 sm:p-5",
                    "transition-all duration-200",
                    paymentMethod === "cod"
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center",
                          paymentMethod === "cod"
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-700",
                        )}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Cash on delivery
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Requires 10% advance
                        </p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {paymentMethod === "cod" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-zinc-900" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              </div>
            </section>

            {/* --------------------------------------------------------- */}
            {/* UPDATED: We removed the inline button here.               */}
            {/* Added a Spacer instead so content isn't hidden behind     */}
            {/* the fixed bottom bar on mobile.                           */}
            {/* --------------------------------------------------------- */}
            <div className="lg:hidden pb-24" />
          </motion.div>

          {/* RIGHT: Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block lg:col-span-5"
          >
            <div className="sticky top-6 space-y-4">
              <div className={cn(ui.card, "p-6 sm:p-7")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Order Summary</h3>
                  <span className="text-xs text-zinc-500">
                    {cartItems.length} item(s)
                  </span>
                </div>

                <div className="mt-5 space-y-4 max-h-[44vh] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="w-14 h-16 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">
                            {item.name}
                          </p>
                          <p className="text-sm font-semibold">
                            ₹{item.priceSnapshot.toLocaleString()}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {item.variantColor} · Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-zinc-200 pt-5 space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-zinc-900">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Shipping</span>
                    <span className="font-medium text-zinc-900">Free</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-zinc-200">
                    <span className="font-semibold text-zinc-900">Total</span>
                    <span className="font-semibold text-zinc-900">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-5 ">
                  <motion.button
                    type="submit"
                    disabled={checkoutLoading}
                    whileTap={SOFT_SCALE_TAP}
                    className={ui.button}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      PayLabel
                    )}
                  </motion.button>
                </div>

                {paymentMethod === "cod" && (
                  <div className="mt-4 text-xs text-zinc-500">
                    You’ll pay{" "}
                    <span className="font-semibold">
                      ₹{advanceAmount.toLocaleString()}
                    </span>{" "}
                    now, remaining on delivery.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </form>
      </div>

      {/* Mobile Bottom Bar (Fixed) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/80 backdrop-blur p-4 z-50">
        <button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={checkoutLoading}
          className={ui.button}
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing…
            </>
          ) : (
            PayLabel
          )}
        </button>
      </div>
    </div>
  );
}