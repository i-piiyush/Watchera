import { adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { Product } from "@/types/product";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) => {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "Product ID is missing" },
        { status: 400 }
      );
    }
    const docRef = adminDb.collection("products").doc(uid);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json<ApiResponse<null>>(
        {
          message: "no product found with given id",
          statusCode: 404,
          success: false,
        },
        { status: 404 }
      );
    }

    const product = {
      uid: snap.id,
      ...snap.data(),
    } as Product;

    return NextResponse.json<ApiResponse<Product>>(
      {
        message: "Product fetched successfully!",
        statusCode: 200,
        success: true,
        data: product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("error while fetching product by id: ", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        message: "server error",
        statusCode: 500,
        success: false,
      },
      { status: 500 }
    );
  }
};
