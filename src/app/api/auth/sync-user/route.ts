import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { NextResponse } from "next/server";
import { AppUser } from "@/types/user";
import { syncUserSchema } from "@/app/schemas/authSchema";


export const POST = async (req: Request) => {
  try {
    // 1️⃣ Parse & validate request body
    const body: unknown = await req.json();

    const parsed = syncUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Invalid request body",
          statusCode: 400,
        },
        { status: 400 }
      );
    }
    const { idToken } = parsed.data;

    // 2️⃣ Verify Firebase ID token (throws if invalid/expired)
    const decoded = await adminAuth.verifyIdToken(idToken);
    const avatar = decoded.picture ? decoded.picture : ""

    // 3️⃣ Reference user document (UID = doc ID)
    const ref = adminDb.collection("users").doc(decoded.uid);
    const snap = await ref.get()

    // 4️⃣ Build strongly-typed app user object
    const userData: AppUser = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? "",
      avatar:avatar,
      emailVerified:false,
      role: "user",
      phoneVerified: false,
      createdAt: Date.now(),
    };


    if(!snap.exists){
      await ref.set(userData);
       return NextResponse.json<ApiResponse<null>>(
      {
        success: true,
        message: "User synced successfully",
        statusCode: 200,
      },
      { status: 200 }
    );
    }
    
    

    // 6️⃣ Success response (HTTP status = source of truth)
    return NextResponse.json<ApiResponse<null>>(
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
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        message: "Invalid or expired token",
        statusCode: 401,
      },
      { status: 401 }
    );
  }
};
