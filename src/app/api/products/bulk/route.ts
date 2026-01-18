import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { CartItem, CartViewItem } from "@/types/cart";
import { Product, ProductVariant } from "@/types/product";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    // 1) Auth
    const authHeader = req.headers.get("authorization");
    console.log(authHeader)
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    // 2) Get cart doc
    
    const cartSnap = await adminDb.collection("carts").doc(decoded.uid).get();

    // cart empty is valid
    if (!cartSnap.exists) {
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

    const cartItems = (cartSnap.data()?.items ?? []) as CartItem[];

    if (cartItems.length === 0) {
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

    // 3) Fetch all products in one go
    const productRefs = cartItems.map((item) =>
      adminDb.collection("products").doc(item.productId)
    );

    const productSnaps = await adminDb.getAll(...productRefs);

    // 4) Build a product map for fast lookup
    const productMap = new Map<string, Product>();
    productSnaps.forEach((snap) => {
      if (snap.exists) {
        productMap.set(snap.id, { ...(snap.data() as Product), uid: snap.id });
      }
    });

    // 5) Create ready-to-render response
    const result: CartViewItem[] = cartItems
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null; // product deleted

        const variant = product.variants?.find(
          (v) => v.color === item.variantColor
        );

        // variant missing (color removed)
        if (!variant) return null;

        return {
          productId: product.uid,
          name: product.name,
          variantColor: item.variantColor,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          stock: variant.stock,
          image: variant.images?.[0]?.url ?? "",
        };
      })
      .filter(Boolean) as CartViewItem[];

    return NextResponse.json<ApiResponse<CartViewItem[]>>(
      {
        success: true,
        statusCode: 200,
        message: "Cart items fetched",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {


    console.log("error while fetching products for cart! ", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, statusCode: 500, message: "Server error" },
      { status: 500 }
    );
  }
};
