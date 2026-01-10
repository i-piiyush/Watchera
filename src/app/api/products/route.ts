import { adminDb } from "@/firebase/admin";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);

  const limit = Number(searchParams.get("limit") ?? 20);
  const cursor = searchParams.get("cursor");

  let query = adminDb
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (cursor) {
    const cursorDoc = await adminDb.collection("products").doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.get();
  const products = snap.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  }));

  const lastDoc = snap.docs[snap.docs.length - 1];

  return NextResponse.json({
    success: true,
    data: products,
    message: "product fetched successfully",
    statusCode: 200,
    nextCursor: lastDoc ? lastDoc.id : null,
  },{status:200});
};
