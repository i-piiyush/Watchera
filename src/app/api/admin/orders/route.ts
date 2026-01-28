import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";

// ============================================================
// 1. GET: Fetch All Orders (SECURED)
// ============================================================
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, message: "Unauthorized", statusCode: 401 },
      { status: 401 },
    );
  }

  const token = authHeader.split("Bearer ")[1];

  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();

  if (!userSnap.exists || userSnap.data()?.role !== "admin") {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, message: "Forbidden", statusCode: 403 },
      { status: 403 },
    );
  }

  try {
    const ordersRef = adminDb.collection("orders").orderBy("createdAt", "desc");
    const snapshot = await ordersRef.get();

    const orders = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let isPhoneVerified = data.user?.phoneVerified || false;

        if (data.uid && !isPhoneVerified) {
          const userSnap = await adminDb
            .collection("users")
            .doc(data.uid)
            .get();
          if (userSnap.exists) {
            isPhoneVerified = userSnap.data()?.phoneVerified || false;
          }
        }

        return {
          orderId: doc.id,
          ...data,
          user: { ...data.user, phoneVerified: isPhoneVerified },
          createdAt: data.createdAt?.toMillis
            ? data.createdAt.toMillis()
            : data.createdAt,
        };
      }),
    );

    return NextResponse.json<ApiResponse<any[]>>(
      {
        success: true,
        message: "Orders fetched successfully",
        statusCode: 200,
        data: orders,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        message: "Failed to fetch orders",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}

// ============================================================
// 2. PATCH: Update Status (SECURED)
// ============================================================
export async function PATCH(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, message: "Unauthorized", statusCode: 401 },
      { status: 401 },
    );
  }

  const token = authHeader.split("Bearer ")[1];

  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();

  if (!userSnap.exists || userSnap.data()?.role !== "admin") {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, message: "Forbidden", statusCode: 403 },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { orderId, action, uid } = body;
    const orderRef = adminDb.collection("orders").doc(orderId);

    if (action === "VERIFY_PHONE") {
      if (uid) {
        await adminDb
          .collection("users")
          .doc(uid)
          .update({ phoneVerified: true });
      }
      await orderRef.update({ "user.phoneVerified": true });
    } else if (action === "MARK_SHIPPED") {
      await orderRef.update({ status: "SHIPPED", shippedAt: new Date() });
    } else if (action === "MARK_DELIVERED") {
      await orderRef.update({ status: "DELIVERED", deliveredAt: new Date() });
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: true,
        message: `Action ${action} completed successfully`,
        statusCode: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        message: "Update failed",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
