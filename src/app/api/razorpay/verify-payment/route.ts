import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      checkoutId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = body;

    // 1. CRYPTO VERIFICATION (Standard Node.js)
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "Fraud attempt" },
        { status: 400 },
      );
    }

    // 2. Fetch Checkout Data
    const checkoutRef = adminDb.collection("checkouts").doc(checkoutId);
    const checkoutSnap = await checkoutRef.get();
    const data = checkoutSnap.data();

    if (!data) throw new Error("Checkout data missing");

    // 3. Create Final Order Object
    const orderId = `ord_${Date.now()}_${checkoutId.substring(0, 5)}`;

    const userSnap = await adminDb.collection("users").doc(data.uid).get();
    const userData = userSnap.data();
    // Determine status based on COD vs Online
    // If COD: Status is "Placed", Payment is "Partial"
    // If Online: Status is "Placed", Payment is "Full"
    const paymentStatus = data.paymentMode === "cod" ? "PARTIAL_PAID" : "PAID";

    const orderData = {
      ...data,
      orderId,
      user: {
        phone: userData?.phone || data.phone || "N/A", // From DB or Form
        phoneVerified: userData?.phoneVerified || false,
        avatar: userData?.avatar || "",
      },
      status: "PLACED",
      paymentStatus: paymentStatus,
      paymentDetails: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amountPaid: data.pricing.payNow,
        remainingAmount: data.pricing.total - data.pricing.payNow, // Useful for COD collection later
      },
      createdAt: new Date(),
    };

    // 4. Batch Write (Atomic)
    const batch = adminDb.batch();

    // Save to Orders
    const orderRef = adminDb.collection("orders").doc(orderId);
    batch.set(orderRef, orderData);

    // Delete Cart
    const cartRef = adminDb.collection("carts").doc(data.uid);
    batch.delete(cartRef);

    // Mark Checkout as converted (Optional cleanup)
    batch.update(checkoutRef, { status: "CONVERTED" });

    for (const item of data.items) {
      const productRef = adminDb.collection("products").doc(item.productId);
      const productSnap = await productRef.get();

      if (productSnap.exists) {
        const productData = productSnap.data();
        const variants = productData?.variants || [];

        // Array ke andar sahi color dhoondh kar stock minus karo
        const updatedVariants = variants.map((v: any) => {
          if (v.color === item.variantColor) {
            // Logic: Current Stock - Bought Qty (Lekin 0 se neeche nahi jana chahiye)
            const newStock = Math.max(0, v.stock - item.quantity);
            return { ...v, stock: newStock };
          }
          return v;
        });

        // Batch mein update add karo
        batch.update(productRef, { variants: updatedVariants });
      }
    }

    await batch.commit();

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Verification Error", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
