import { adminAuth, adminDb } from "@/firebase/admin";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/apiResponse";

// -----------------------------
// GET → Fetch user cart
// -----------------------------
export const GET = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const cartSnap = await adminDb
      .collection("carts")
      .doc(decoded.uid)
      .get();

    if (!cartSnap.exists) {
      return NextResponse.json<ApiResponse<{ items: any[] }>>({
        success: true,
        statusCode: 200,
        message: "Cart empty",
        data: { items: [] },
      });
    }

    return NextResponse.json<ApiResponse<{ items: any[] }>>({
      success: true,
      statusCode: 200,
      message: "Cart fetched",
      data: cartSnap.data() as { items: any[] },
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, statusCode: 500, message: "Server error" },
      { status: 500 }
    );
  }
};

// -----------------------------
// POST → Save / Sync cart
// -----------------------------
export const POST = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();

    if (!Array.isArray(body.items)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "Invalid cart data" },
        { status: 400 }
      );
    }

    await adminDb
      .collection("carts")
      .doc(decoded.uid)
      .set(
        {
          items: body.items,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      statusCode: 200,
      message: "Cart synced",
    });
  } catch (error) {
    console.error("POST CART ERROR:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, statusCode: 500, message: "Server error" },
      { status: 500 }
    );
  }
};
