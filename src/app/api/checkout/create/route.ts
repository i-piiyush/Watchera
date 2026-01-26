import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";

import { ApiResponse } from "@/types/apiResponse";
import { shippingSchemaFrontend } from "@/app/schemas/shipingSchema";

import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import { CheckoutDoc, CheckoutResolvedItem, PaymentMode } from "@/types/checkout";


// -------------------------
// Helpers
// -------------------------
const roundTo2 = (n: number) => Math.round(n * 100) / 100;

const getTrustedUnitPrice = (product: Product) => {
  const hasValidDiscount =
    typeof product.discountedPrice === "number" &&
    product.discountedPrice > 0 &&
    product.discountedPrice < product.price;

  return hasValidDiscount ? product.discountedPrice! : product.price;
};

export const POST = async (req: Request) => {
  try {
    // ------------------------------------
    // 1) Auth check
    // ------------------------------------
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // ------------------------------------
    // 2) Validate shipping payload
    // ------------------------------------
    const body = await req.json();
    const parsed = shippingSchemaFrontend.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<any>>(
        {
          success: false,
          statusCode: 400,
          message: "Invalid shipping details",
          data: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const shipping = parsed.data;
    const paymentMode = shipping.paymentMethod as PaymentMode; // "cod" | "online"

    // ------------------------------------
    // 3) Fetch cart from DB (server trusted)
    // ------------------------------------
    const cartSnap = await adminDb.collection("carts").doc(uid).get();

    if (!cartSnap.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 404, message: "Cart is empty" },
        { status: 404 }
      );
    }

    const cartItems = (cartSnap.data()?.items || []) as CartItem[];

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 404, message: "Cart is empty" },
        { status: 404 }
      );
    }

    // ------------------------------------
    // 4) Fetch all products in bulk
    // ------------------------------------
    const productRefs = cartItems.map((i) =>
      adminDb.collection("products").doc(i.productId)
    );

    const productSnaps = await adminDb.getAll(...productRefs);

    const productsMap = new Map<string, Product>();

    productSnaps.forEach((snap) => {
      if (!snap.exists) return;

      const data = snap.data() as Omit<Product, "uid">;

      productsMap.set(snap.id, {
        uid: snap.id,
        ...data,
      } as Product);
    });

    // ------------------------------------
    // 5) Resolve items + calculate totals
    // ------------------------------------
    let subtotal = 0;

    const resolvedItems: CheckoutResolvedItem[] = cartItems.map((item) => {
      const product = productsMap.get(item.productId);

      if (!product) {
        // If product missing, we treat as invalid -> block checkout
        throw new Error(`Product not found: ${item.productId}`);
      }

      const variant = product.variants.find(
        (v) => v.color === item.variantColor
      );

      if (!variant) {
        throw new Error(
          `Variant not found: ${item.productId} (${item.variantColor})`
        );
      }

      if (variant.stock <= 0) {
        throw new Error(
          `Out of stock: ${product.name} (${item.variantColor})`
        );
      }

      const safeQty = Math.max(1, Number(item.quantity || 1));

      const unitPrice = getTrustedUnitPrice(product);
      const lineTotal = unitPrice * safeQty;

      subtotal += lineTotal;

      return {
        productId: product.uid,
        name: product.name,
        variantColor: variant.color,
        quantity: safeQty,

        unitPrice,
        lineTotal,

        image: variant.images?.[0]?.url || "",
        stock: variant.stock,

        status: "OK",
      };
    });

    // ------------------------------------
    // 6) Pricing rules (your current system)
    // ------------------------------------
    const shippingCharge = 0;
    const tax = 0;

    const total = roundTo2(subtotal + shippingCharge + tax);

    const payNow =
      paymentMode === "cod" ? roundTo2(total * 0.1) : roundTo2(total);

    // ------------------------------------
    // 7) Create checkout document
    // ------------------------------------
    const checkoutId = adminDb.collection("checkouts").doc().id;

    const checkoutDoc: CheckoutDoc = {
      checkoutId,
      uid,

      paymentMode,

      shipping, // includes paymentMethod already

      items: resolvedItems,

      pricing: {
        subtotal: roundTo2(subtotal),
        shipping: shippingCharge,
        tax,
        total,
        payNow,
      },

      status: "CREATED",

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await adminDb.collection("checkouts").doc(checkoutId).set(checkoutDoc);

    // ------------------------------------
    // 8) Return
    // ------------------------------------
    return NextResponse.json<ApiResponse<CheckoutDoc>>(
      {
        success: true,
        statusCode: 201,
        message: "Checkout created",
        data: checkoutDoc,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE CHECKOUT ERROR:", error);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        statusCode: 500,
        message:  "Server error",
      },
      { status: 500 }
    );
  }
};
