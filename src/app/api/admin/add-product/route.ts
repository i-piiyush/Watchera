import { createProductSchema } from "@/app/schemas/addProductSchema";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { Product } from "@/types/product";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    //fetching tokens
    const authHeader = req.headers.get("authorization");



    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        message: "Unauthorized",
        statusCode: 401,
      });
    }

    //getting token
    const token = authHeader.split("Bearer ")[1];

    //verifying token and fetching user
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();

    //checking if user is admin
    if (userSnap.data()?.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        message: "Forbidden",
        statusCode: 403,
      });
    }

    //validating body
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        message: "Invalid request body",
        statusCode: 400,
      });
    }

    // 2️⃣ Extract images MANUALLY
    const images = body.images;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, message: "Images are required" },
        { status: 400 }
      );
    }

    // 3️⃣ Create doc
    const ref = adminDb.collection("products").doc();

    const product: Product = {
      uid: ref.id,
      ...parsed.data, // name, price, stock, description
      images, // ✅ THIS WAS MISSING
      avgRating: 0,
      reviewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await ref.set(product);

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      message: "Product Added To Database",
      statusCode: 201,
      data: { id: ref.id },
    });
  } catch (error) {
    console.error("Add product error:", error);

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      message: "Server error",
      statusCode: 500,
    });
  }
};
