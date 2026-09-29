import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createUserToken } from "@/utilities/auth/jwt";
import { sendEmail } from "@/utilities/email/sendEmail";
import { generateInvoice } from "@/utilities/invoice/generateInvoice";
import { VerifiedToken } from "@/types/TokenProps";

const ACTIVE_PLANS = ["BRONZE", "SILVER", "GOLD"] as const;

type ActivePlan = (typeof ACTIVE_PLANS)[number];

const getCurrentIstMinutes = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date());

    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
    return hour * 60 + minute;
};

export async function POST(request: NextRequest) {
    const { plan, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await request.json();

    if (!plan || !ACTIVE_PLANS.includes(plan)) {
        return NextResponse.json({ success: false, message: "Invalid subscription plan." });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as VerifiedToken) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
    }

    // Razorpay HMAC SHA256 Signature Verification (Mandatory for paid subscriptions)
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpaySecret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json({
            success: false,
            message: "Missing payment verification parameters or secret key.",
        });
    }

    const generatedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (generatedSignature !== razorpaySignature) {
        return NextResponse.json({
            success: false,
            message: "Invalid payment signature verification failed.",
        });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: verifiedToken.id },
            data: {
                subscriptionPlan: plan as ActivePlan,
                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                monthlyTweetCount: 0,
            },
        });

        const activePlan = plan as ActivePlan;
        const paymentId = String(razorpayPaymentId || "");
        const orderId = String(razorpayOrderId || "");
        const purchaseDate = new Date();
        const amountByPlan: Record<ActivePlan, number> = {
            BRONZE: 100,
            SILVER: 300,
            GOLD: 1000,
        };
        const invoiceBuffer = generateInvoice({
            userName: updatedUser.name,
            email: updatedUser.email ?? verifiedToken.email ?? "",
            plan: activePlan,
            amount: amountByPlan[activePlan],
            purchaseDate,
            paymentId,
            orderId,
        });
        const invoiceFileName = `invoice-${paymentId.replace(/[^a-zA-Z0-9_-]/g, "_") || "unknown"}.pdf`;

        const invoiceEmail = updatedUser.email ?? verifiedToken.email ?? "";
        if (!invoiceEmail) {
            console.error("SUBSCRIPTION INVOICE EMAIL ERROR:", new Error("No registered email was found for this account."));
        } else {
            try {
                const emailResult = await sendEmail({
                    to: invoiceEmail,
                    subject: "TwitterX Subscription Invoice",
                    html: `
                        <h2>TwitterX Subscription Invoice</h2>
                        <p>Your subscription invoice is attached to this email.</p>
                    `,
                    attachments: [
                        {
                            filename: invoiceFileName,
                            content: invoiceBuffer,
                            contentType: "application/pdf",
                        },
                    ],
                });

                console.log("SUBSCRIPTION INVOICE EMAIL SENT:", {
                    to: invoiceEmail,
                    messageId: emailResult.messageId,
                    response: emailResult.response,
                });
            } catch (emailError) {
                console.error("SUBSCRIPTION INVOICE EMAIL ERROR:", emailError);
            }
        }

        const newToken = await createUserToken(updatedUser);
        const response = NextResponse.json({
            success: true,
        });
        response.cookies.set({
            name: "token",
            value: newToken,
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("SUBSCRIPTION ACTIVATE ERROR:", error);

        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
