import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { razorpay } from "@/lib/razorpay";
import { ApiResponse } from "@/types/apiResponse";

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // 2. Get checkoutId from request
    const { checkoutId } = await req.json();
    if (!checkoutId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, message: "Checkout ID required",statusCode:400 }, { status: 400 });
    }

    // 3. Fetch the Trusted Checkout Document
    const checkoutRef = adminDb.collection("checkouts").doc(checkoutId);
    const checkoutSnap = await checkoutRef.get();

    if (!checkoutSnap.exists) {
      return NextResponse.json<ApiResponse<null>>({ success: false, message: "Checkout not found",statusCode:404 }, { status: 404 });
    }

    const checkoutData = checkoutSnap.data();

    // Security: Ensure the user trying to pay owns this checkout
    if (checkoutData?.uid !== uid) {
      return NextResponse.json<ApiResponse<null>>({ success: false, message: "Forbidden" ,statusCode:403}, { status: 403 });
    }

    // 4. Create Razorpay Order
    // Note: Razorpay expects amount in PAISA (multiply by 100)
    const amountInPaisa = Math.round(checkoutData.pricing.payNow * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaisa,
      currency: "INR",
      receipt: checkoutId, // Link our ID to their receipt
      notes: {
        checkoutId: checkoutId,
        userId: uid,
      },
    });

    // 5. UPDATE Firestore with Razorpay ID (Link the two systems)
    await checkoutRef.update({
      razorpayOrderId: razorpayOrder.id,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaisa,
      currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("RAZORPAY CREATE ERROR:", error);
    return NextResponse.json<ApiResponse<null>>({ success: false, message: "Error processing payment",statusCode:500 }, { status: 500 });
  }
}