import { ReviewSchema } from "@/app/schemas/reviewSchema";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Review } from "@/types/review";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) => {
  try {
    const productId = (await params).productId;
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
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const user = userSnap.data();



    const body = await req.json();
    const parsed = ReviewSchema.safeParse({
      ...body,
      userId: decoded.uid,
      user: user?.name ||  "Anonymous",
      avatar: user?.avatar ?? "",
      isLiked:false,
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

    const reviewRef = productRef.collection("reviews").doc();

    const reviewData = {
      uid: reviewRef.id, // 👈 IMPORTANT
      userId: decoded.uid,
      user: user?.name ?? "Anonymous",
      avatar: user?.avatar ?? "",
      rating: parsed.data.rating,
      content: parsed.data.content,
      likedBy : parsed.data.likedBy,
      likes: 0,
      createdAt: Date.now(),
    };

    await reviewRef.set(reviewData);
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

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) => {
  const { productId } = await params;

  if (!productId) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        statusCode: 400,
        message: "Product ID is required",
      },
      { status: 400 }
    );
  }

  try {
    const reviewSnap = await adminDb
      .collection("products")
      .doc(productId)
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .get();

    const reviews: Review[] = reviewSnap.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as Omit<Review, "uid">),
    }));

    return NextResponse.json<ApiResponse<Review[]>>(
      {
        success: true,
        statusCode: 200,
        message: "Reviews fetched successfully",
        data: reviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("error while fetching reviews: ", error);
  }
};
