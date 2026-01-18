import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import bcrypt from "bcryptjs";

export const POST = async (req: Request) => {
  try {
    // 1) Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    // 2) Read OTP
    const body = await req.json();
    const otp = String(body.otp || "").trim();

    if (!otp || otp.length !== 6) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    // 3) Fetch OTP session
    const otpRef = adminDb.collection("otp").doc(decoded.uid);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "OTP not requested" },
        { status: 400 }
      );
    }

    const otpData = otpSnap.data()!;
    const now = Date.now();

    // 4) Expiry check
    if (now > otpData.expiresAt) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "OTP expired" },
        { status: 400 }
      );
    }

    // 5) Attempts check
    const attemptsLeft = otpData.attemptsLeft ?? 0;
    if (attemptsLeft <= 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          statusCode: 429,
          message: "Too many wrong attempts",
        },
        { status: 429 }
      );
    }

    // 6) Hash compare
    const otpHash = await bcrypt.compare(otp,otpData.otpHash)

    if (!otpHash) {
      await otpRef.update({
        attemptsLeft: attemptsLeft - 1,
        updatedAt: now,
      });

      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // 7) Mark user verified
    const userRef = adminDb.collection("users").doc(decoded.uid);
    await userRef.set(
      {
        emailVerified: true,
        email: otpData.email,
        updatedAt: now,
      },
      { merge: true }
    );

    // 8) Delete OTP session (one-time use)
    await otpRef.delete();

    return NextResponse.json<ApiResponse<null>>(
      { success: true, statusCode: 200, message: "Email verified" },
      { status: 200 }
    );
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, statusCode: 500, message: "Server error" },
      { status: 500 }
    );
  }
};
