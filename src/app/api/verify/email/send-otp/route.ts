import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import bcrypt from "bcryptjs";


const resend = new Resend(process.env.RESEND_API_KEY);
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 min
const MAX_SENDS = 2;

export const POST = async (req: Request) => {
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

    // 2) Read email from body
    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "Valid email required" },
        { status: 400 },
      );
    }

    // 3) Check user exists
    const userRef = adminDb.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 404, message: "User not found" },
        { status: 404 },
      );
    }

    // 4) If already verified -> block
    if (userSnap.data()?.emailVerified) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, statusCode: 400, message: "Email already verified" },
        { status: 400 },
      );
    }

    const otpRef = adminDb.collection("otp").doc(decoded.uid);
    const otpSnap = await otpRef.get();

    const existing = otpSnap.exists ? otpSnap.data() : null;
    const sendCount = existing?.sendCount ?? 0;

    if (sendCount >= MAX_SENDS) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          statusCode: 429,
          message: "OTP limit reached (2 max). Try later.",
        },
        { status: 429 },
      );
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const otpHash = await bcrypt.hash(otp, 10);
    const now = Date.now();
    await otpRef.set(
      {
        email,
        otpHash,
        sendCount: sendCount + 1,
        attemptsLeft: 5,
        expiresAt: now + OTP_EXPIRY_MS,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      },
      { merge: true },
    );

    console.log("hashed otp : ",otpHash," otp: ",otp)
    // 9) Send OTP via Resend
    await resend.emails.send({
      from: "Watchera <onboarding@resend.dev>", // later replace with your domain
      to: email,
      subject: "Your Watchera verification code",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Your OTP</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:6px">${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json<ApiResponse<null>>(
      { success: true, statusCode: 200, message: "OTP sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log("error while sending email: ", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, statusCode: 500, message: "Server error" },
      { status: 500 },
    );
  }
};
