import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { NextResponse } from "next/server";
import { AppUser } from "@/types/user";

export const POST = async (req: Request) => {
  try {
    // 1️⃣ Parse & validate request body
    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("idToken" in body) ||
      typeof (body as any).idToken !== "string"
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Invalid or missing idToken",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const { idToken } = body as { idToken: string };

    // 2️⃣ Verify Firebase ID token (throws if invalid/expired)
    const decoded = await adminAuth.verifyIdToken(idToken);

    // 3️⃣ Reference user document (UID = doc ID)
    const ref = adminDb.collection("users").doc(decoded.uid);

    // 4️⃣ Build strongly-typed app user object
    const userData: AppUser = {
      uid: decoded.uid,
      email: decoded.email ?? null, // email can be null (edge case)
      name: decoded.name ?? "",
      role: "user",                // never trust client for role
      phoneVerified: false,         // default until OTP flow
      createdAt: Date.now(),        // ⚠️ ideally set only once (see note below)
    };

    // 5️⃣ Idempotent write (safe on repeated logins)
    await ref.set(userData, { merge: true });

    // 6️⃣ Success response (HTTP status = source of truth)
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "User synced successfully",
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while syncing user:", error);

    // 7️⃣ Auth errors vs server errors (basic separation)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Invalid or expired token",
        statusCode: 401,
      },
      { status: 401 }
    );
  }
};
