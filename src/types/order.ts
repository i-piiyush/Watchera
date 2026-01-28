// types/order.ts

export type OrderStatus = "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItem {
  productId: string;
  name: string;
  variantColor?: string;
  quantity: number;
  unitPrice: number;
  image?: string; // Assuming image is likely part of the item object
}

export interface Order {
  // --- Identifiers & Timestamps ---
  orderId: string;
  checkoutId: string;
  uid: string;
  createdAt: number;
  updatedAt: number;

  // --- Status & Modes ---
  status: OrderStatus;
  paymentMode: "cod" | "online"; 
  paymentStatus: "PAID" | "PENDING" | "FAILED"; // Inferred type
  razorpayOrderId?: string; // Optional (might not exist for COD)

  // --- User Info ---
  user: {
    phone: string;
    phoneVerified: boolean;
    avatar: string; // Console shows "" so it's a string
  };

  // --- Shipping Details ---
  shipping: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    paymentMethod: string; // Console output has this redundant field inside shipping
  };

  // --- Payment Specifics ---
  paymentDetails: {
    amountPaid: number;
    remainingAmount: number;
    // Razorpay fields are optional as they won't exist for COD (initially)
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };

  // --- Pricing Breakdown ---
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    payNow: number;
    total: number;
  };

  // --- Ordered Items ---
  items: OrderItem[];
}