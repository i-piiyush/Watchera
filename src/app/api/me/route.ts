import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { AppUser } from "@/types/user";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>(
        {
          message: "Unauthorized",
          statusCode: 401,
          success: false,
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    
    // 1️⃣ Try to get the user document
    const ref = adminDb.collection("users").doc(decoded.uid);
    const snap = await ref.get();

    // 2️⃣ SELF-HEALING: If doc is missing (Race Condition), create it now!
    if (!snap.exists) {
      const avatar = decoded.picture || "";
      
      const userData: AppUser = {
        uid: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? "",
        avatar: avatar,
        emailVerified: decoded.email_verified ?? false,
        role: "user",
        phoneVerified: false,
        createdAt: Date.now(),
      };

      // Create the missing document immediately
      await ref.set(userData);

      console.log(`[Self-Healing] Created missing user doc for ${decoded.email}`);

      return NextResponse.json<ApiResponse<AppUser>>({
        message: "User synced (self-healed)",
        statusCode: 200,
        success: true,
        data: userData,
      });
    }

    // 3️⃣ Normal success case
    const userData = snap.data() as AppUser;

    return NextResponse.json<ApiResponse<AppUser>>({
      message: "User found successfully",
      statusCode: 200,
      success: true,
      data: userData,
    });

  } catch (error) {
    console.log("error getting user: ", error);

    return NextResponse.json<ApiResponse<null>>({
      message: "Server error",
      statusCode: 500,
      success: false,
    }, { status: 500 });
  }
};