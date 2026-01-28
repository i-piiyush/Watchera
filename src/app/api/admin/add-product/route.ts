import { createProductSchema } from "@/app/schemas/addProductSchema";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { Product } from "@/types/product";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, message: "Unauthorized", statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();

    if (!userSnap.exists || userSnap.data()?.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, message: "Forbidden", statusCode: 403 },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, message: "Invalid request body", statusCode: 400 },
        { status: 400 }
      );
    }

    const ref = adminDb.collection("products").doc();

    const product: Product = {
      uid: ref.id,
      ...parsed.data,
      ratingSum: 0,
      reviewCount: 0,
      discountedPrice: parsed.data.discountedPrice ?? undefined, 
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await ref.set(product);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      {
        success: true,
        message: "Product Added To Database",
        statusCode: 201,
        data: { id: ref.id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add product error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, message: "Server error", statusCode: 500 },
      { status: 500 }
    );
  }
};