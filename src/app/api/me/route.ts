import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { AppUser } from "@/types/user";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse<null>>({
        message: "Unauthorized",
        statusCode: 401,
        success: false,
      });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!snap.exists) {
      return NextResponse.json<ApiResponse<null>>({
        message: "No user found",
        statusCode: 404,
        success: false,
      });
    }

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
    });
  }
};
