import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ productId: string; reviewId: string }> }
) => {
  try {
    const { productId, reviewId } = await params;

    // 1. Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, message: "Unauthorized", statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid; 
    const { action } = await req.json();

    if (!["like", "unlike"].includes(action)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, message: "Invalid action", statusCode: 400 },
        { status: 400 }
      );
    }

    const reviewRef = adminDb
      .collection("products")
      .doc(productId)
      .collection("reviews")
      .doc(reviewId);

    
    const updateData =
      action === "like"
        ? {
            likes: FieldValue.increment(1),
            likedBy: FieldValue.arrayUnion(userId), 
          }
        : {
            likes: FieldValue.increment(-1),
            likedBy: FieldValue.arrayRemove(userId), 
          };

    await reviewRef.update(updateData);

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: "Updated",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, message: "Server error", statusCode: 500 },
      { status: 500 }
    );
  }
};
