"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Truck,
  Package,
  Clock,
  ChevronRight,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  IndianRupee,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  ChevronDown,
  MoreVertical,
  Star,
  Download,
  FileText,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Order } from "@/types/order";
import axios from "axios";
import { auth } from "@/firebase/client";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/spinner";
import { ApiResponse } from "@/types/apiResponse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Monochromatic Luxury Theme - Light & Elegant
const theme = {
  background: "bg-[#fafafa]",
  surface: "bg-white",
  surfaceElevated: "bg-white",
  primary: {
    light: "text-[#8a8a8a]",
    DEFAULT: "text-[#5a5a5a]",
    dark: "text-[#2a2a2a]",
    bg: "bg-[#f8f8f8]",
    border: "border-[#e0e0e0]",
  },
  accent: {
    light: "text-[#c4c4c4]",
    DEFAULT: "text-[#8a8a8a]",
    dark: "text-[#5a5a5a]",
    bg: "bg-[#f5f5f5]",
    border: "border-[#e5e5e5]",
  },
  status: {
    PLACED: {
      color: "text-[#8a8a8a]",
      bgColor: "bg-[#f8f8f8]",
      borderColor: "border-[#e0e0e0]",
      progress: "bg-[#8a8a8a]",
    },
    SHIPPED: {
      color: "text-[#6b6b6b]",
      bgColor: "bg-[#f5f5f5]",
      borderColor: "border-[#d5d5d5]",
      progress: "bg-[#6b6b6b]",
    },
    DELIVERED: {
      color: "text-[#2a2a2a]",
      bgColor: "bg-[#f0f0f0]",
      borderColor: "border-[#c0c0c0]",
      progress: "bg-[#2a2a2a]",
    },
    CANCELLED: {
      color: "text-[#999999]",
      bgColor: "bg-[#f9f9f9]",
      borderColor: "border-[#e8e8e8]",
      progress: "bg-[#999999]",
    },
  },
};

// Status Config with user-friendly messages
const statusConfig = {
  PLACED: {
    label: "Order Placed",
    icon: Package,
    progress: 10,
    message:
      "Your order details are being verified. This process takes around 12 hours.",
    subMessage: "We'll update you once your order is confirmed.",
    timeline: [
      { label: "Order Placed", completed: true, current: true },
      { label: "Processing", completed: false, current: false },
      { label: "Shipped", completed: false, current: false },
      { label: "Delivered", completed: false, current: false },
    ],
  },
  SHIPPED: {
    label: "Shipped",
    icon: Truck,
    progress: 60,
    message: "Your item has been shipped! It will reach you within 7-10 days.",
    subMessage: "Track your package using the tracking ID provided below.",
    timeline: [
      { label: "Order Placed", completed: true, current: false },
      { label: "Processing", completed: true, current: false },
      { label: "Shipped", completed: true, current: true },
      { label: "Delivered", completed: false, current: false },
    ],
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle,
    progress: 100,
    message: "Your order has been successfully delivered!",
    subMessage: "We hope you love your purchase. Rate your experience below.",
    timeline: [
      { label: "Order Placed", completed: true, current: false },
      { label: "Processing", completed: true, current: false },
      { label: "Shipped", completed: true, current: false },
      { label: "Delivered", completed: true, current: true },
    ],
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Clock,
    progress: 0,
    message: "Your order has been cancelled.",
    subMessage: "Refund will be processed within 5-7 business days.",
    timeline: [
      { label: "Order Placed", completed: true, current: false },
      { label: "Processing", completed: false, current: false },
      { label: "Shipped", completed: false, current: false },
      { label: "Delivered", completed: false, current: false },
    ],
  },
};

const UserOrders = () => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "delivered" | "cancelled"
  >("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user && !loading) {
        toast.info("login to view your orders");
        router.replace("/login");
      }
      if (!user && loading) {
        return null;
      }

      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await axios.get<ApiResponse<null>>("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.data) {
          
          setOrders(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setOrderLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const openWithWhatsapp = (message: string) => {
    const phoneNumber = "919478260725"; 
    const text = message;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        "Today, " +
        date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    } else if (diffDays === 1) {
      return (
        "Yesterday, " +
        date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "active":
        return orders.filter(
          (order) => order.status === "PLACED" || order.status === "SHIPPED",
        );
      case "delivered":
        return orders.filter((order) => order.status === "DELIVERED");
      case "cancelled":
        return orders.filter((order) => order.status === "CANCELLED");
      default:
        return orders;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      active: orders.filter(
        (order) => order.status === "PLACED" || order.status === "SHIPPED",
      ).length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
      cancelled: orders.filter((order) => order.status === "CANCELLED").length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();
  const filteredOrders = getFilteredOrders();

  if (orderLoading) {
    return (
      <div
        className={`min-h-screen ${theme.background} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-t-transparent border-[#d0d0d0] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-6 h-6 text-[#8a8a8a]" />
            </div>
          </div>
          <p className="text-sm text-[#8a8a8a] tracking-wider">
            LOADING ORDERS
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.background} px-4 py-6 sm:px-6 lg:px-8`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header - Luxurious Design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-8 bg-[#2a2a2a]" />
                <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#2a2a2a]">
                  My Orders
                </h1>
              </div>
              <p className="text-sm tracking-wide text-[#8a8a8a] pl-5">
                Track and manage all your purchases
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <p className="font-medium text-[#2a2a2a] text-sm sm:text-base tracking-wide">
                  {user?.displayName || "Your Account"}
                </p>
                <p className="text-xs text-[#8a8a8a] tracking-wider">
                  {orders.length} ORDER{orders.length !== 1 ? "S" : ""}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f0f0f0] to-[#e0e0e0] flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-[#5a5a5a]" />
              </div>
            </div>
          </div>

          {/* Stats - Elegant Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(statusCounts).map(([key, count]) => (
              <motion.div
                key={key}
                whileHover={{ y: -2 }}
                className={`${theme.surface} p-5 rounded-lg border ${theme.primary.border} shadow-xs hover:shadow-sm transition-all duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#8a8a8a] mb-2">
                      {key === "all" ? "TOTAL" : key.toUpperCase()}
                    </p>
                    <p className="text-2xl font-light text-[#2a2a2a]">
                      {count}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#f8f8f8] flex items-center justify-center">
                    {key === "all" && (
                      <Package className="w-4 h-4 text-[#8a8a8a]" />
                    )}
                    {key === "active" && (
                      <Package className="w-4 h-4 text-[#8a8a8a]" />
                    )}
                    {key === "delivered" && (
                      <CheckCircle className="w-4 h-4 text-[#2a2a2a]" />
                    )}
                    {key === "cancelled" && (
                      <Clock className="w-4 h-4 text-[#999999]" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs - Minimal Elegance */}
        <div className="flex overflow-x-auto no-scrollbar mb-8 border-b border-[#e8e8e8]">
          {[
            { key: "all", label: `All (${statusCounts.all})`, icon: Package },
            {
              key: "active",
              label: `Active (${statusCounts.active})`,
              icon: Package,
            },
            {
              key: "delivered",
              label: `Delivered (${statusCounts.delivered})`,
              icon: CheckCircle,
            },
            {
              key: "cancelled",
              label: `Cancelled (${statusCounts.cancelled})`,
              icon: Clock,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 text-sm tracking-wide whitespace-nowrap flex-shrink-0 transition-all duration-300 relative",
                  activeTab === tab.key
                    ? "text-[#2a2a2a]"
                    : "text-[#8a8a8a] hover:text-[#5a5a5a]",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2a2a2a]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {filteredOrders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#f8f8f8] to-[#f0f0f0] flex items-center justify-center shadow-inner">
                  <Package className="w-8 h-8 text-[#c4c4c4]" />
                </div>
                <h3 className="text-lg font-light tracking-wide text-[#5a5a5a] mb-3">
                  No orders found
                </h3>
                <p className="text-sm text-[#8a8a8a] tracking-wide max-w-sm mx-auto">
                  {activeTab === "all"
                    ? "Begin your journey with us by placing your first order."
                    : `You don't have any ${activeTab} orders at the moment.`}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {filteredOrders.map((order, index) => {
                  const config = statusConfig[order.status];
                  const StatusIcon = config.icon;
                  const statusTheme = theme.status[order.status];
                  const isExpanded = expandedOrder === order.orderId;
                  const itemName = order.items?.[0]?.name || "Item";

                  return (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`${theme.surface} rounded-xl border ${theme.primary.border} shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden`}
                    >
                      {/* Order Header */}
                      <div
                        onClick={() =>
                          setExpandedOrder(isExpanded ? null : order.orderId)
                        }
                        className="p-5 cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded bg-[#f8f8f8] flex items-center justify-center">
                                <Package className="w-4 h-4 text-[#8a8a8a]" />
                              </div>
                              <div>
                                <h3 className="text-base font-medium text-[#2a2a2a] truncate">
                                  {order?.items?.[0]?.name || "Order Items"}
                                </h3>
                                <p className="text-xs text-[#8a8a8a] mt-1">
                                  Order ID: {order.orderId}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#8a8a8a]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(order.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                {order.pricing.total.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "px-4 py-2 rounded-full text-xs font-medium tracking-wide",
                                statusTheme.bgColor,
                                statusTheme.color,
                                statusTheme.borderColor,
                                "border",
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <StatusIcon className="w-3 h-3" />
                                {config.label}
                              </span>
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-[#c4c4c4]"
                            >
                              <ChevronDown className="w-5 h-5" />
                            </motion.div>
                          </div>
                        </div>

                        {/* Progress Bar - Subtle Design */}
                        <div className="mt-6">
                          <div className="flex justify-between text-xs text-[#8a8a8a] mb-2">
                            <span>ORDER PROGRESS</span>
                            <span className="font-medium">{config.progress}%</span>
                          </div>
                          <div className="h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${config.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={cn("h-full", statusTheme.progress)}
                            />
                          </div>
                        </div>

                        {/* Status Message - Elegant Card */}
                        <div className="mt-4 p-4 bg-[#fafafa] rounded-lg border border-[#f0f0f0]">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                statusTheme.bgColor,
                              )}
                            >
                              <StatusIcon
                                className={cn("w-4 h-4", statusTheme.color)}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#2a2a2a] mb-1">
                                {config.message}
                              </p>
                              <p className="text-xs text-[#8a8a8a]">
                                {config.subMessage}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#f0f0f0]"
                          >
                            <div className="p-5">
                              {/* Delivery Timeline */}
                              <div className="mb-8">
                                <h4 className="text-sm font-medium text-[#2a2a2a] mb-4 tracking-wide">
                                  DELIVERY TIMELINE
                                </h4>
                                <div className="space-y-4">
                                  {config.timeline.map((step, idx) => (
                                    <motion.div
                                      key={step.label}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className="flex items-center gap-4"
                                    >
                                      <div
                                        className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                                          step.completed
                                            ? cn(
                                                statusTheme.bgColor,
                                                statusTheme.borderColor,
                                              )
                                            : "bg-white border-[#e8e8e8]",
                                        )}
                                      >
                                        {step.completed ? (
                                          <CheckCircle
                                            className={cn(
                                              "w-4 h-4",
                                              statusTheme.color,
                                            )}
                                          />
                                        ) : step.current ? (
                                          <Clock className="w-4 h-4 text-[#8a8a8a]" />
                                        ) : (
                                          <div className="w-2 h-2 rounded-full bg-[#e0e0e0]" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                          <span
                                            className={cn(
                                              "text-sm",
                                              step.completed
                                                ? "text-[#2a2a2a]"
                                                : "text-[#8a8a8a]",
                                            )}
                                          >
                                            {step.label}
                                          </span>
                                        </div>
                                        {step.current && (
                                          <p className="text-xs text-[#8a8a8a] mt-1">
                                            Currently at this step
                                          </p>
                                        )}
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>

                              {/* Order Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Shipping Info */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded bg-[#f8f8f8] flex items-center justify-center">
                                      <MapPin className="w-4 h-4 text-[#8a8a8a]" />
                                    </div>
                                    <h4 className="text-sm font-medium text-[#2a2a2a] tracking-wide">
                                      SHIPPING ADDRESS
                                    </h4>
                                  </div>
                                  <div className="bg-[#fafafa] p-4 rounded-lg border border-[#f0f0f0]">
                                    <p className="text-sm font-medium text-[#2a2a2a] mb-1">
                                      {order.shipping.firstName}{" "}
                                      {order.shipping.lastName}
                                    </p>
                                    <p className="text-xs text-[#8a8a8a] mb-1">
                                      {order.shipping.address}
                                    </p>
                                    <p className="text-xs text-[#8a8a8a]">
                                      {order.shipping.city},{" "}
                                      {order.shipping.state} -{" "}
                                      {order.shipping.pincode}
                                    </p>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f0f0f0]">
                                      <Phone className="w-3 h-3 text-[#8a8a8a]" />
                                      <span className="text-xs text-[#8a8a8a]">
                                        {order.user.phone}
                                      </span>
                                      {order.user.phoneVerified && (
                                        <span className="ml-2 px-2 py-1 bg-[#f0f0f0] text-[#5a5a5a] text-xs rounded-full">
                                          Verified
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Info */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded bg-[#f8f8f8] flex items-center justify-center">
                                      <CreditCard className="w-4 h-4 text-[#8a8a8a]" />
                                    </div>
                                    <h4 className="text-sm font-medium text-[#2a2a2a] tracking-wide">
                                      PAYMENT DETAILS
                                    </h4>
                                  </div>
                                  <div className="bg-[#fafafa] p-4 rounded-lg border border-[#f0f0f0]">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-[#8a8a8a]">
                                          Order Total
                                        </span>
                                        <span className="text-sm font-medium text-[#2a2a2a] flex items-center">
                                          <IndianRupee className="w-3 h-3 mr-1" />
                                          {order.pricing.total.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-[#8a8a8a]">
                                          Payment Method
                                        </span>
                                        <span className="text-xs font-medium text-[#2a2a2a] flex items-center gap-1">
                                          {order?.paymentMode === "online" ? (
                                            <>
                                              <ShieldCheck className="w-3 h-3" />
                                              <span>Online Payment</span>
                                            </>
                                          ) : (
                                            <>
                                              <PackageCheck className="w-3 h-3" />
                                              <span>Cash on Delivery</span>
                                            </>
                                          )}
                                        </span>
                                      </div>
                                      {order.paymentDetails?.remainingAmount >
                                        0 && (
                                        <div className="flex justify-between items-center pt-3 border-t border-[#f0f0f0]">
                                          <span className="text-xs text-[#8a8a8a]">
                                            Amount to pay
                                          </span>
                                          <span className="text-sm font-medium text-[#8a8a8a] flex items-center">
                                            <IndianRupee className="w-3 h-3 mr-1" />
                                            {order.paymentDetails.remainingAmount.toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons - Elegant Design */}
                              <div className="mt-8 pt-6 border-t border-[#f0f0f0]">
                                <div className="flex flex-wrap gap-2">
                                  {order.status === "PLACED" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          openWithWhatsapp(
                                            `Hey, I ordered ${itemName} (Order ID: ${order.orderId}). I want to track my order status.`,
                                          )
                                        }
                                        className="px-4 py-2 bg-[#2a2a2a] text-white text-xs tracking-wide rounded-lg hover:bg-[#3a3a3a] transition-colors duration-300"
                                      >
                                        Track Order
                                      </button>
                                      <button
                                        onClick={() =>
                                          openWithWhatsapp(
                                            `Hey, I want to cancel my order for ${itemName} (Order ID: ${order.orderId}). Please assist me.`,
                                          )
                                        }
                                        className="px-4 py-2 border border-[#e0e0e0] text-[#5a5a5a] text-xs tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                                      >
                                        Cancel Order
                                      </button>
                                      <button
                                        onClick={() =>
                                          openWithWhatsapp(
                                            `Hey, I have a query regarding my order ${order.orderId}.`,
                                          )
                                        }
                                        className="px-4 py-2 border border-[#e0e0e0] text-[#5a5a5a] text-xs tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                                      >
                                        Contact Support
                                      </button>
                                    </>
                                  )}
                                  {order.status === "SHIPPED" && (
                                    <>
                                      <button
                                        className="px-4 py-2 bg-[#5a5a5a] text-white text-xs tracking-wide rounded-lg hover:bg-[#6a6a6a] transition-colors duration-300"
                                        onClick={() => {
                                          openWithWhatsapp(
                                            `Hey, I ordered ${itemName} from Chhabra Gifts. My Order ID is ${order.orderId}. Could you please share the tracking ID?`,
                                          );
                                        }}
                                      >
                                        Track Package
                                      </button>
                                      <button
                                        onClick={() =>
                                          openWithWhatsapp(
                                            `Hey, I need the tracking link for my shipped order ${order.orderId}.`,
                                          )
                                        }
                                        className="px-4 py-2 border border-[#e0e0e0] text-[#5a5a5a] text-xs tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                                      >
                                        View Tracking
                                      </button>
                                      <button
                                        onClick={() =>
                                          openWithWhatsapp(
                                            `Hey, I need help contacting the courier for my order ${order.orderId}.`,
                                          )
                                        }
                                        className="px-4 py-2 border border-[#e0e0e0] text-[#5a5a5a] text-xs tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                                      >
                                        Contact Courier
                                      </button>
                                    </>
                                  )}
                                  {order.status === "DELIVERED" && (
                                    <>
                                      <button
                                        onClick={() =>
                                        {
                                          router.replace(`/products/${order?.items[0]?.productId}`)
                                        }
                                        }
                                        className="px-4 py-2 bg-[#2a2a2a] text-white text-xs tracking-wide rounded-lg hover:bg-[#3a3a3a] transition-colors duration-300"
                                      >
                                        <Star className="w-3 h-3 inline mr-2" />
                                        Rate Product
                                      </button>
                                      <button
                                        onClick={() =>
                                         {
                                           router.replace(`/products/${order?.items[0]?.productId}`)
                                         }
                                        }
                                        className="px-4 py-2 border border-[#e0e0e0] text-[#5a5a5a] text-xs tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                                      >
                                        Buy Again
                                      </button>
                                    </>
                                  )}
                                  {order.status === "CANCELLED" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          openWithWhatsapp(
                                            `Hey, what is the refund status for my cancelled order ${order.orderId}?`,
                                          )
                                        }
                                        className="px-4 py-2 bg-[#8a8a8a] text-white text-xs tracking-wide rounded-lg hover:bg-[#9a9a9a] transition-colors duration-300"
                                      >
                                        View Refund Status
                                      </button>
                                      <button
                                        onClick={() =>
                                          openWithWhatsapp(
                                            `Hey, I want to re-order ${itemName}.`,
                                          )
                                        }
                                        className="px-4 py-2 border border-[#e0e0e0] text-[#5a5a5a] text-xs tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                                      >
                                        Buy Again
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Need Help Section - Luxury Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-br from-[#fafafa] to-white p-6 rounded-xl border border-[#f0f0f0] shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-light text-[#2a2a2a] mb-2 tracking-wide">
                Need assistance with your orders?
              </h4>
              <p className="text-sm text-[#8a8a8a] mb-4 max-w-2xl">
                Our dedicated support team is available to assist you with any
                inquiries regarding your orders, returns, or refunds. We're
                committed to providing you with exceptional service.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    openWithWhatsapp(
                      `Hey Support, I need assistance with my account or orders.`,
                    )
                  }
                  className="px-5 py-2.5 bg-[#2a2a2a] text-white text-sm tracking-wide rounded-lg hover:bg-[#3a3a3a] transition-colors duration-300"
                >
                  Contact Support
                </button>
                <button
                  onClick={() =>
                    openWithWhatsapp(`Hey, I have a question about FAQs.`)
                  }
                  className="px-5 py-2.5 border border-[#e0e0e0] text-[#5a5a5a] text-sm tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                >
                  FAQ & Help Center
                </button>
                <button
                  onClick={() =>
                    openWithWhatsapp(
                      `Hey, can you share the return/refund policy?`,
                    )
                  }
                  className="px-5 py-2.5 border border-[#e0e0e0] text-[#5a5a5a] text-sm tracking-wide rounded-lg hover:bg-[#fafafa] transition-colors duration-300"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Download Policy
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserOrders;