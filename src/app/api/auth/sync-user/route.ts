import { syncUserSchema } from "@/app/schemas/authSchema";
import { adminAuth, adminDb } from "@/firebase/admin";
import { ApiResponse } from "@/types/apiResponse";
import { AppUser } from "@/types/user";
import { NextResponse } from "next/server";


export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const parsed = syncUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, message: "Invalid payload", statusCode: 400 },
        { status: 400 }
      );
    }

    const { idToken, name } = parsed.data;

    const decoded = await adminAuth.verifyIdToken(idToken);
    const { uid, email, picture, email_verified, name: tokenName } = decoded;

    // 🔐 FINAL NAME RESOLUTION (NO EMPTY STRINGS)
    const finalName =
      name?.trim() ||
      tokenName?.trim() ||
      "Anonymous";

    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();

    if (snap.exists) {
      const existing = snap.data() as AppUser;

      // 🔥 Self-heal bad legacy data
      if (!existing.name || existing.name === "Anonymous") {
        await userRef.update({ name: finalName });
      }

      return NextResponse.json<ApiResponse<null>>(
        { success: true, message: "User synced", statusCode: 200 },
        { status: 200 }
      );
    }

    // 🛑 Prevent duplicate email accounts
    if (email) {
      const emailSnap = await adminDb
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!emailSnap.empty) {
        return NextResponse.json<ApiResponse<null>>(
          { success: true, message: "Account already exists", statusCode: 200 },
          { status: 200 }
        );
      }
    }

    const userData: AppUser = {
      uid,
      email: email ?? null,
      name: finalName,
      avatar: picture ?? "",
      emailVerified: !!email_verified,
      role: "user",
      phoneVerified: false,
      createdAt: Date.now(),
    };

    await userRef.set(userData);

    return NextResponse.json<ApiResponse<null>>(
      { success: true, message: "User created", statusCode: 201 },
      { status: 201 }
    );
  } catch (err) {
    console.error("SYNC USER ERROR:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, message: "Server error", statusCode: 500 },
      { status: 500 }
    );
  }
};
