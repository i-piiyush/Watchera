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

    console.log("hashed otp : ", otpHash, " otp: ", otp);
    // 9) Send OTP via Resend
    await resend.emails.send({
     from: "Chhabra Gifts <verification@auth.chhabragifts.in>",
      to: email,
      subject: "Your Verification Code - Chhabra Gifts",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2a2a2a;
            background-color: #fafafa;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
            border: 1px solid #f0f0f0;
        }
        
        .header {
            background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
            padding: 48px 40px 32px;
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .logo {
            font-family: 'Georgia', serif;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 0.2em;
            color: #2a2a2a;
            text-transform: uppercase;
            margin-bottom: 24px;
            text-decoration: none;
        }
        
        .accent-line {
            width: 60px;
            height: 2px;
            background-color: #2a2a2a;
            margin: 24px auto;
        }
        
        .content {
            padding: 48px 40px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 300;
            color: #5a5a5a;
            margin-bottom: 32px;
            line-height: 1.8;
            text-align: center;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%);
            border-radius: 12px;
            padding: 40px;
            margin: 40px 0;
            border: 1px solid #f0f0f0;
            text-align: center;
        }
        
        .otp-label {
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.1em;
            color: #8a8a8a;
            margin-bottom: 16px;
            text-transform: uppercase;
        }
        
        .otp-code {
            font-size: 48px;
            font-weight: 300;
            letter-spacing: 12px;
            color: #2a2a2a;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            border: 1px solid #e8e8e8;
            display: inline-block;
            min-width: 280px;
            transition: all 0.3s ease;
        }
        
        .expiry-note {
            font-size: 14px;
            color: #8a8a8a;
            margin-top: 24px;
            font-style: italic;
        }
        
        .instructions {
            font-size: 15px;
            color: #5a5a5a;
            line-height: 1.8;
            margin: 32px 0;
            text-align: center;
        }
        
        .security-note {
            background-color: #fafafa;
            border-radius: 8px;
            padding: 20px;
            margin: 32px 0;
            border: 1px solid #f0f0f0;
            font-size: 13px;
            color: #8a8a8a;
            line-height: 1.6;
        }
        
        .security-note strong {
            color: #5a5a5a;
            font-weight: 500;
        }
        
        .footer {
            padding: 32px 40px;
            text-align: center;
            background-color: #fafafa;
            border-top: 1px solid #f0f0f0;
            font-size: 12px;
            color: #8a8a8a;
        }
        
        .support-link {
            color: #5a5a5a;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
        }
        
        .support-link:hover {
            color: #2a2a2a;
        }
        
        .divider {
            width: 1px;
            height: 12px;
            background-color: #e0e0e0;
            display: inline-block;
            margin: 0 12px;
        }
        
        @media (max-width: 480px) {
            .header, .content, .footer {
                padding: 32px 24px;
            }
            
            .otp-code {
                font-size: 36px;
                letter-spacing: 8px;
                min-width: 240px;
                padding: 16px;
            }
            
            .logo {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">Chhabra Gifts</div>
            <div class="accent-line"></div>
            <h1 style="font-size: 28px; font-weight: 300; color: #2a2a2a; margin-bottom: 16px;">
                Verification Required
            </h1>
            <p style="font-size: 16px; color: #8a8a8a; font-weight: 300;">
                Complete your account verification
            </p>
        </div>
        
        <div class="content">
            <p class="greeting">
                Hello,<br>
                Thank you for choosing Chhabra Gifts. To complete your account verification, 
                please use the verification code below.
            </p>
            
            <div class="otp-container">
                <div class="otp-label">Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="expiry-note">This code expires in 5 minutes</div>
            </div>
            
            <p class="instructions">
                Enter this code in the verification field on our website or app 
                to verify your email address and complete the registration process.
            </p>
            
            <div class="security-note">
                <strong>Security Notice:</strong> This code is unique to your account. 
                Never share your verification code with anyone. Chhabra Gifts will never 
                ask for your password or verification code via email, phone, or text message.
            </div>
        </div>
        
        <div class="footer">
            <p style="margin-bottom: 16px;">
                <a href="https://chhabragifts.in" style="color: #5a5a5a; text-decoration: none; font-weight: 500;">
                    Visit Our Website
                </a>
                <span class="divider"></span>
                <a href="https://chhabragifts.in" style="color: #5a5a5a; text-decoration: none; font-weight: 500;">
                    Help Center
                </a>
                <span class="divider"></span>
               <a href="tel:8847654718" class="support-link">
    Contact Support
</a>
            </p>
            <p style="font-size: 11px; color: #b0b0b0; margin-top: 8px;">
                © ${new Date().getFullYear()} Chhabra Gifts. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
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
