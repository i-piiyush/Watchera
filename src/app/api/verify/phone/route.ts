import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";

export const PATCH = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const phone = String(body.phone || "").replace(/\D/g, "");

    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "Invalid phone number" },
        { status: 400 },
      );
    }

    await adminDb.collection("users").doc(decoded.uid).set(
      {
        phone,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    return NextResponse.json<ApiResponse<null>>(
      { success: true, statusCode: 200, message: "Phone saved" },
      { status: 200 },
    );
  } catch (error) {
    console.error("SAVE PHONE ERROR:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, statusCode: 500, message: "Server error" },
      { status: 500 },
    );
  }
};
