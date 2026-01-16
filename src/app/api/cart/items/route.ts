import { adminDb } from "@/firebase/admin";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/apiResponse";
import { CartViewItem } from "@/types/cart";
import { CartItem } from "@/store/cartStore";



export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    // -------------------------
    // 1) Validate body.items
    // -------------------------
    if (!body?.items || !Array.isArray(body.items)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          statusCode: 400,
          message: "Invalid request: items must be an array",
        },
        { status: 400 }
      );
    }

    const items: CartItem[] = body.items;

    if (items.length === 0) {
      return NextResponse.json<ApiResponse<CartViewItem[]>>(
        {
          success: true,
          statusCode: 200,
          message: "Cart is empty",
          data: [],
        },
        { status: 200 }
      );
    }

    // -------------------------
    // 2) Fetch all products in 1 go
    // -------------------------
    const productRefs = items.map((item) =>
      adminDb.collection("products").doc(item.productId)
    );

    const productSnaps = await adminDb.getAll(...productRefs);

    // productId -> productData
    const productMap = new Map<string, any>();
    productSnaps.forEach((snap) => {
      if (snap.exists) productMap.set(snap.id, snap.data());
    });

    // -------------------------
    // 3) Build final cart view items
    // -------------------------
    const result: CartViewItem[] = items.map((cartItem) => {
      const product = productMap.get(cartItem.productId);

      // if product missing/deleted
      if (!product) {
        return {
          productId: cartItem.productId,
          name: "Unknown Product",
          variantColor: cartItem.variantColor,
          quantity: cartItem.quantity,
          priceSnapshot: cartItem.priceSnapshot,
          image: "",
          stock: 0,
        };
      }

      const variants = product.variants || [];
      const selectedVariant =
        variants.find((v: any) => v.color === cartItem.variantColor) || null;

      const stock = selectedVariant?.stock ?? 0;
      const image = selectedVariant?.images?.[0]?.url ?? "";

      return {
        productId: cartItem.productId,
        name: product.name || "Unnamed Product",
        variantColor: cartItem.variantColor,
        quantity: cartItem.quantity,
        priceSnapshot: cartItem.priceSnapshot,
        image,
        stock,
      };
    });

    return NextResponse.json<ApiResponse<CartViewItem[]>>(
      {
        success: true,
        statusCode: 200,
        message: "Cart items resolved",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CART ITEMS RESOLVE ERROR:", error);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        statusCode: 500,
        message: "Server error",
      },
      { status: 500 }
    );
  }
};