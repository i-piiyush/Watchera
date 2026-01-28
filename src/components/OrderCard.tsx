"use client";

import React, { useState } from "react";
import { 
  Phone, Check, X, Truck, PackageCheck, Clock, CheckCircle, MapPin 
} from "lucide-react";
import { format } from "date-fns";
import { Order, OrderStatus } from "@/types/order";
import { toast } from "sonner";
import axios from "axios";
import { auth } from "@/firebase/client";
import { ApiResponse } from "@/types/apiResponse";
import { Spinner } from "./ui/spinner";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, updates: Partial<Order>) => void;
}

const OrderCard = ({ order, onStatusUpdate }: OrderCardProps) => {
  const [loading, setLoading] = useState(false);

  // Derived Logic
  const status: OrderStatus = order?.status || "PLACED";
  const isUnverified = !order?.user?.phoneVerified;
  const isDelivered = status === "DELIVERED";
  const isCancelled = status === "CANCELLED";

  const displayName = order?.shipping?.firstName || "Unknown Customer";

  const handleNextAction = async () => {
    let action = "";
    if (isUnverified) action = "VERIFY_PHONE";
    else if (status === "PLACED") action = "MARK_SHIPPED";
    else if (status === "SHIPPED") action = "MARK_DELIVERED";

    if (!action || !window.confirm(`Proceed with ${action.replace("_", " ")}?`)) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.patch<ApiResponse<null>>("/api/admin/orders", 
        { orderId: order.orderId, uid: order.uid, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Order Updated");
        let updates: Partial<Order> = {};
        if (action === "VERIFY_PHONE") updates = { user: { ...order.user, phoneVerified: true } };
        else if (action === "MARK_SHIPPED") updates = { status: "SHIPPED" };
        else if (action === "MARK_DELIVERED") updates = { status: "DELIVERED" };
        
        onStatusUpdate(order.orderId, updates);
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Standard Div instead of Card
    <div className={`rounded-xl border border-zinc-200 bg-white overflow-hidden transition-all shadow-sm hover:shadow-md ${isCancelled ? 'opacity-60 grayscale' : ''}`}>
      <div className="p-4 ">
        {/* Header: ID & Name */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold text-zinc-400">
              ID: {order?.orderId?.toUpperCase() || "N/A"}
            </span>
            <h3 className="font-bold text-lg text-zinc-900 leading-none">
              {displayName}
            </h3>
            <div className="flex items-center text-[10px] text-zinc-500 mt-1">
              <Clock className="w-3 h-3 mr-1" />
              {order?.createdAt ? format(new Date(order.createdAt), "dd MMM, hh:mm a") : "Date N/A"}
            </div>
          </div>
          
          {/* Custom Tailwind Badge */}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
            status === 'DELIVERED' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
            status === 'CANCELLED' ? 'border-red-500 text-red-600 bg-red-50' : 'border-zinc-300 text-zinc-600 bg-zinc-50'
          }`}>
            {status.toLowerCase()}
          </span>
        </div>

        {/* Contact Strip */}
        <div className="flex items-center justify-between mb-4 p-2 bg-zinc-900 rounded-lg text-white">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-sm font-medium">{order?.user?.phone}</span>
          </div>
          {order?.user?.phoneVerified ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-red-600 text-white rounded-full">Unverified</span>
          )}
        </div>

        {/* Payment & Amount */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Total Payable</p>
            <p className="text-xl font-black text-zinc-900">₹{order?.pricing?.total?.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-1 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 text-[10px] font-bold mb-1 uppercase">
              {order?.paymentMode}
            </span>
            {order?.paymentMode === 'cod' && (
              <p className="text-[10px] font-bold text-red-600 py-2">Pending: ₹{order.paymentDetails.remainingAmount}</p>
            )}
          </div>
        </div>

        {/* Location Box */}
        <div className="mb-5 p-3 bg-zinc-50 rounded-md border border-dashed border-zinc-200">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5" />
            <p className="text-xs text-zinc-600 leading-snug">
              {order?.shipping?.address}, {order?.shipping?.city}, {order?.shipping?.state} - {order?.shipping?.pincode}
            </p>
          </div>
        </div>

        {/* Action Button Logic */}
        {!isDelivered && !isCancelled ? (
          <button
            onClick={handleNextAction}
            disabled={loading}
            className={`w-full font-bold shadow-lg h-11 text-white rounded-md flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 ${
              isUnverified 
                ? "bg-red-600 hover:bg-red-700" 
                : status === "PLACED" 
                  ? "bg-zinc-900 hover:bg-zinc-800" 
                  : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Updating...
              </span>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full">
                {isUnverified ? (
                  <X className="w-4 h-4" />
                ) : status === "PLACED" ? (
                  <Truck className="w-4 h-4" />
                ) : (
                  <PackageCheck className="w-4 h-4" />
                )}
                
                <span>
                  {isUnverified 
                    ? "Verify Phone First" 
                    : status === "PLACED" 
                      ? "Mark as Shipped" 
                      : "Mark as Delivered"}
                </span>
              </div>
            )}
          </button>
        ) : isCancelled ? (
          <button disabled className="w-full h-11 bg-zinc-200 text-zinc-500 font-bold rounded-md cursor-not-allowed">
            Order Cancelled
          </button>
        ) : (
          <div className="flex justify-center h-10 rounded-md bg-zinc-900 text-zinc-50 items-center">
            <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" /> 
            Delivered & Closed
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(OrderCard);