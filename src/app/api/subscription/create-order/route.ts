import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { verifyJwtToken } from "@/utilities/auth";
import { VerifiedToken } from "@/types/TokenProps";

const PLAN_AMOUNTS = {
    BRONZE: 100,
    SILVER: 300,
    GOLD: 1000,
} as const;

type SubscriptionPlan = keyof typeof PLAN_AMOUNTS;

const makeReceipt = (userId: string, plan: SubscriptionPlan) => {
    const timestamp = Date.now().toString(36);
    const shortUserId = userId.replace(/-/g, "").slice(0, 8);
    return `sub_${plan}_${shortUserId}_${timestamp}`.slice(0, 40);
};

export async function POST(request: NextRequest) {
    const { plan } = await request.json();

    if (!plan || !(plan in PLAN_AMOUNTS)) {
        return NextResponse.json({ success: false, message: "Invalid subscription plan." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as VerifiedToken) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const isPlaceholderKey = !keyId || !keySecret || keyId.startsWith("your-") || keySecret.startsWith("your-");

    const amount = PLAN_AMOUNTS[plan as SubscriptionPlan];

    if (isPlaceholderKey && process.env.NODE_ENV === "development") {
        console.warn("[Razorpay Dev Mode] Using local mock order because Razorpay credentials are placeholder.");
        return NextResponse.json({
            success: true,
            keyId: "rzp_test_dev_placeholder",
            order: {
                id: `order_dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                amount: amount * 100,
                currency: "INR",
            },
            plan,
            amount: amount * 100,
        });
    }

    try {
        const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: amount * 100,
                currency: "INR",
                receipt: makeReceipt(verifiedToken.id, plan as SubscriptionPlan),
                notes: {
                    userId: verifiedToken.id,
                    username: verifiedToken.username,
                    plan,
                },
            }),
        });

        const order = await orderResponse.json();

        if (!orderResponse.ok) {
            const message = order?.error?.description || order?.error?.message || "Unable to create Razorpay order.";
            if (process.env.NODE_ENV === "development") {
                console.warn("[Razorpay Dev Mode] Razorpay API rejected request:", message, "- falling back to dev mock order.");
                return NextResponse.json({
                    success: true,
                    keyId: keyId || "rzp_test_dev_placeholder",
                    order: {
                        id: `order_dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        amount: amount * 100,
                        currency: "INR",
                    },
                    plan,
                    amount: amount * 100,
                });
            }
            return NextResponse.json({ success: false, message: `Razorpay Error: ${message}` }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            keyId,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            plan,
            amount: amount * 100,
        });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, message: "Failed to create order." }, { status: 500 });
    }
}
