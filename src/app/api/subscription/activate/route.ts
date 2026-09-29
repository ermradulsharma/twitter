import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createUserToken, SECURE_COOKIE_OPTIONS } from "@/utilities/auth/jwt";
import { sendEmail } from "@/utilities/email/sendEmail";
import { generateInvoice } from "@/utilities/invoice/generateInvoice";
import { VerifiedToken } from "@/types/TokenProps";

const ACTIVE_PLANS = ["BRONZE", "SILVER", "GOLD"] as const;

type ActivePlan = (typeof ACTIVE_PLANS)[number];

export async function POST(request: NextRequest) {
    const { plan, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await request.json();

    if (!plan || !ACTIVE_PLANS.includes(plan)) {
        return NextResponse.json({ success: false, message: "Invalid subscription plan." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as VerifiedToken) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    // Razorpay HMAC SHA256 Signature Verification (Mandatory for paid subscriptions)
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpaySecret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
            {
                success: false,
                message: "Missing payment verification parameters or secret key.",
            },
            { status: 400 }
        );
    }

    const generatedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (generatedSignature !== razorpaySignature) {
        return NextResponse.json(
            {
                success: false,
                message: "Invalid payment signature verification failed.",
            },
            { status: 400 }
        );
    }

    try {
        // Prevent payment replay attack
        const existingPayment = await (prisma as any).payment.findUnique({
            where: { razorpayPaymentId: String(razorpayPaymentId) },
        });

        if (existingPayment) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This payment transaction has already been processed.",
                },
                { status: 400 }
            );
        }

        const activePlan = plan as ActivePlan;
        const paymentId = String(razorpayPaymentId || "");
        const orderId = String(razorpayOrderId || "");
        const amountByPlan: Record<ActivePlan, number> = {
            BRONZE: 100,
            SILVER: 300,
            GOLD: 1000,
        };

        const updatedUser = await prisma.$transaction(async (tx: any) => {
            await tx.payment.create({
                data: {
                    razorpayPaymentId: paymentId,
                    razorpayOrderId: orderId,
                    userId: verifiedToken.id,
                    plan: activePlan,
                    amount: amountByPlan[activePlan],
                },
            });

            return await tx.user.update({
                where: { id: verifiedToken.id },
                data: {
                    subscriptionPlan: activePlan,
                    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    monthlyTweetCount: 0,
                },
            });
        });

        const purchaseDate = new Date();
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
            ...SECURE_COOKIE_OPTIONS,
            value: newToken,
        });

        return response;
    } catch (error) {
        console.error("SUBSCRIPTION ACTIVATE ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}