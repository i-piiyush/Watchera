import { ReviewSchema } from "@/app/schemas/reviewSchema";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) => {
  try {
    const productId = (await params).productId
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          statusCode: 401,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const parsed = ReviewSchema.safeParse({
      ...body,
      userId: decoded.uid,
      createdAt: Date.now(),
    });

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          statusCode: 400,
          message: "Invalid review data",
        },
        { status: 400 }
      );
    }

    const productRef = adminDb.collection("products").doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          statusCode: 404,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    await productRef.collection("reviews").add(parsed.data);
    await productRef.update({
      reviewCount: FieldValue.increment(1),
      ratingSum: FieldValue.increment(parsed.data.rating),
    });

    return NextResponse.json<ApiResponse<null>>(
      {
        success: true,
        statusCode: 201,
        message: "Review submitted",
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("error in submitting reveiw: ", error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      statusCode: 500,
      message: "server error",
    });
  }
};
