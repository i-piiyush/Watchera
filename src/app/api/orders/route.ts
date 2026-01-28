import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    // 1. Authorization Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Unauthorized: Missing or invalid token",
          statusCode: 401,
        },
        { status: 401 }
      );
    }

    // 2. Verify Token
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);


    const ordersQuery = adminDb
      .collection("orders")
      .where("uid", "==", decoded.uid)
      .orderBy("createdAt", "desc");

    const snapshot = await ordersQuery.get();

    // 4. Transform Data
    // We must map over the docs to extract data and convert Timestamps
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        orderId: doc.id,
        ...data,
        // Convert Firestore Timestamp to number (milliseconds) to prevent JSON serialization errors
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
      };
    });

    // 5. Return Response
    return NextResponse.json<ApiResponse<typeof orders>>(
      {
        success: true,
        message: "Orders fetched successfully",
        statusCode: 200,
        data: orders, // Send the actual data
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error fetching user's orders:", error);
    
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        message: "Internal Server Error",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
};