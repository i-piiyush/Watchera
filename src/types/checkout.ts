import { ShippingAddress } from "@/types/shipping";

export type PaymentMode = "cod" | "online";

export type CheckoutItemStatus = "OK";

export type CheckoutResolvedItem = {
  productId: string;
  name: string;
  variantColor: string;
  quantity: number;

  unitPrice: number;
  lineTotal: number;

  image: string;
  stock: number;

  status: CheckoutItemStatus;
};

export type CheckoutPricing = {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;

  // COD => 10% , Online => 100%
  payNow: number;
};

export type CheckoutDocStatus = "CREATED";

export type CheckoutDoc = {
  checkoutId: string;
  uid: string;

  paymentMode: PaymentMode;
  shipping: ShippingAddress;

  items: CheckoutResolvedItem[];
  pricing: CheckoutPricing;

  

  status: CheckoutDocStatus;

  createdAt: any; // can improve later
  updatedAt: any; // can improve later
};
