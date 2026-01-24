"use client";

import React, { useEffect, useState } from "react";
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ChevronRight,
  Mail,
  Lock,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/apiResponse";
import { auth } from "@/firebase/client";
import {  CartViewItem } from "@/types/cart";
import { useCartStore } from "@/store/cartStore";



const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartItems,setCartItems] = useState<CartViewItem[]>([])
  const {user,loading} = useAuthStore()
  const {items} =useCartStore()

  const router = useRouter()

  useEffect(()=>{

   
    if(!user && !loading){
      toast.error("Please login first")
      router.replace("/login")

    }


    const fetchCartItems = async ()=>{
      try {
        setCheckoutLoading(true)
        const token = await auth.currentUser?.getIdToken()
        if(!token){
          return
        }
        const res = await axios.post("/api/cart/items",{
          items:items
        },{
          headers:{Authorization:`Bearer ${token}`}
        })

        setCartItems(res.data?.data|| [])
        console.log("cart fetched succesfully: ",res.data?.data)
      } catch (error) {
        const err = error as  AxiosError<ApiResponse<null>>
        console.log(err.response?.data?.message)
      }
      finally{setCheckoutLoading(false)}
    }

    fetchCartItems()
  },[user])

  // --- Calculations ---
  const subtotal = cartItems.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0) ?? 0;
  const shipping = 0; 
  const total = subtotal + shipping;
  
  // COD Logic: 10% Advance
  const advanceRate = 0.10;
  const advanceAmount = Math.ceil(total * advanceRate); // Round up for clean numbers
  const remainingCodAmount = total - advanceAmount;

  const handlePlaceOrder = async () => {
    setCheckoutLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCheckoutLoading(false);
    toast.success("Order placed successfully!");
  };

  // --- Styles ---
  // Minimal Shadcn-like Input with a luxury taller height
  const inputClass = "w-full bg-white border border-zinc-200 rounded-lg px-4 h-12 text-sm transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none";
  const labelClass = "text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5 block";
  const sectionTitleClass = "text-xl font-serif text-zinc-900 tracking-tight flex items-center gap-3";
if(checkoutLoading){
  return (
    <div>loading</div>
  )
}
  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-zinc-900 pb-20 selection:bg-zinc-900 ">
      
      {/* Header / Breadcrumb placeholder */}
      <div className="border-b border-zinc-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-end">
            
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <span>CART</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-zinc-900">CHECKOUT</span>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 lg:items-start">
          
          {/* --- LEFT COLUMN: Forms --- */}
          <section className="lg:col-span-7 flex flex-col gap-12">
            
            {/* 1. Contact Info */}
            <div className="space-y-4">
              <h2 className={sectionTitleClass}>
                <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-sans">1</span>
                Contact Information
              </h2>
              <div className="grid gap-4">
                 <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                     
                        <input type="email" placeholder="you@example.com" className={`${inputClass} pl-11`} />
                    </div>
                 </div>
              </div>
            </div>

            {/* 2. Shipping Details */}
            <div className="space-y-4">
              <h2 className={sectionTitleClass}>
                 <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-sans">2</span>
                 Shipping Address
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" className={inputClass} />
                </div>
              </div>
              
              <div>
                 <label className={labelClass}>Address</label>
                 <input type="text" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>City</label>
                    <input type="text" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Pincode</label>
                    <input type="text" className={inputClass} />
                </div>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="space-y-6">
              <h2 className={sectionTitleClass}>
                 <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-sans">3</span>
                 Payment Method
              </h2>
              
              <div className="grid gap-4">
                {/* Option 1: Online */}
                <div 
                  onClick={() => setPaymentMethod("online")}
                  className={`relative cursor-pointer border rounded-xl p-6 transition-all duration-300 ${
                    paymentMethod === "online" 
                      ? "border-zinc-900 bg-white shadow-lg ring-1 ring-zinc-900" 
                      : "border-zinc-200 bg-white/50 hover:border-zinc-300"
                  }`}
                >
                    <div className="flex items-start justify-between">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-full">
                                <CreditCard className="w-5 h-5 text-zinc-900" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-900">Pay Online</p>
                                <p className="text-sm text-zinc-500">UPI, Cards, Netbanking</p>
                            </div>
                         </div>
                         {paymentMethod === 'online' && (
                             <motion.div initial={{scale:0}} animate={{scale:1}} className="text-zinc-900">
                                 <CheckCircle2 className="w-6 h-6 fill-zinc-900 text-white" />
                             </motion.div>
                         )}
                    </div>
                </div>

                {/* Option 2: COD */}
                <div 
                  onClick={() => setPaymentMethod("cod")}
                  className={`relative cursor-pointer border rounded-xl p-6 transition-all duration-300 ${
                    paymentMethod === "cod" 
                      ? "border-zinc-900 bg-white shadow-lg ring-1 ring-zinc-900" 
                      : "border-zinc-200 bg-white/50 hover:border-zinc-300"
                  }`}
                >
                   <div className="flex items-start justify-between">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-full">
                                <Truck className="w-5 h-5 text-zinc-900" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-900">Cash on Delivery</p>
                                <p className="text-sm text-zinc-500">Advance booking required</p>
                            </div>
                         </div>
                         {paymentMethod === 'cod' && (
                             <motion.div initial={{scale:0}} animate={{scale:1}} className="text-zinc-900">
                                 <CheckCircle2 className="w-6 h-6 fill-zinc-900 text-white" />
                             </motion.div>
                         )}
                    </div>

                    <AnimatePresence>
                        {paymentMethod === 'cod' && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 pt-4 border-t border-dashed border-zinc-200">
                                    <div className="bg-zinc-50 rounded-lg p-4 text-sm flex gap-3">
                                        <div className="mt-0.5"><Lock className="w-4 h-4 text-zinc-400" /></div>
                                        <div className="text-zinc-600 space-y-1">
                                            <p className="font-medium text-zinc-900">Why the advance?</p>
                                            <p>To ensure genuine orders, we collect <span className="text-zinc-900 font-bold">10% (₹{advanceAmount.toLocaleString()})</span> now. You pay the remaining <span className="text-zinc-900 font-bold">₹{remainingCodAmount.toLocaleString()}</span> upon delivery.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </div>
            </div>
          </section>

          {/* --- RIGHT COLUMN: Order Summary --- */}
          <section className="lg:col-span-5 mt-12 lg:mt-0">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8 sticky top-24">
              <h2 className="text-xl font-serif text-zinc-900 mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-6 mb-8 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems?.map((item) => (
                  <div key={item.productId} className="flex gap-4 group">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start gap-2">
                           <h3 className="text-sm font-medium text-zinc-900 truncate">{item.name}</h3>
                           <p className="text-sm font-semibold text-zinc-900">₹{(item.priceSnapshot * item.quantity).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-zinc-500">{item.variantColor}</p>
                        <p className="text-xs text-zinc-400 mt-1">Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-3 pt-6 border-t border-zinc-100">
                 <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-zinc-900 font-medium">Free</span>
                 </div>
                 
                 <div className="flex justify-between items-end pt-3 text-zinc-900">
                    <span className="font-serif text-lg">Total</span>
                    <span className="font-bold text-xl">₹{total.toLocaleString()}</span>
                 </div>
              </div>

              {/* Dynamic Payment Breakdown Bar */}
              <AnimatePresence mode="wait">
                  {paymentMethod === 'cod' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200/60"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Due Now</span>
                            <span className="text-lg font-bold text-zinc-900">₹{advanceAmount.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between items-center text-xs text-zinc-400 border-t border-zinc-200 pt-2">
                            <span>Due on Delivery</span>
                            <span>₹{remainingCodAmount.toLocaleString()}</span>
                        </div>
                    </motion.div>
                  )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={checkoutLoading}
                className="w-full mt-6 bg-zinc-900 text-white h-14 rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>
                        {paymentMethod === 'cod' 
                            ? `Pay Advance ₹${advanceAmount.toLocaleString()}` 
                            : `Pay Securely ₹${total.toLocaleString()}`
                        }
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-6 flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted & Secure</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Checkout;