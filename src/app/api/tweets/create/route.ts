import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

const PLAN_LIMITS = {
    FREE: 100,
    BRONZE: 500,
    SILVER: 2000,
    GOLD: Infinity,
} as const;

const PLAN_LIMIT_MESSAGES = {
    FREE: "Free plan allows up to 100 tweets per month.",
    BRONZE: "Bronze plan allows up to 500 tweets per month.",
    SILVER: "Silver plan allows up to 2,000 tweets per month.",
} as const;

export async function POST(request: NextRequest) {
    const { text, photoUrl, audioUrl } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    const authorId = verifiedToken.id;

    if (!text?.trim() && !photoUrl && !audioUrl) {
        return NextResponse.json({ success: false, message: "Tweet text can't be empty" }, { status: 400 });
    }

    try {
        const isSameCalendarMonth = (date1: Date, date2: Date) =>
            date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();

        const user = await prisma.user.findUnique({
            where: { id: authorId },
            select: {
                subscriptionPlan: true,
                subscriptionExpiry: true,
                monthlyTweetCount: true,
                lastTweetResetAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }

        const subscriptionExpired = Boolean(user.subscriptionExpiry && new Date(user.subscriptionExpiry).getTime() <= Date.now());
        const activePlan = (subscriptionExpired ? "FREE" : user.subscriptionPlan) as keyof typeof PLAN_LIMITS;
        const planLimit = PLAN_LIMITS[activePlan];

        const lastReset = user.lastTweetResetAt ? new Date(user.lastTweetResetAt) : new Date(0);
        const isNewMonth = !isSameCalendarMonth(lastReset, new Date());
        const currentTweetCount = isNewMonth ? 0 : user.monthlyTweetCount;

        if (currentTweetCount >= planLimit) {
            const message = activePlan === "GOLD" ? null : PLAN_LIMIT_MESSAGES[activePlan as keyof typeof PLAN_LIMIT_MESSAGES];
            if (message) {
                return NextResponse.json({ success: false, message }, { status: 403 });
            }
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.tweet.create({
                data: {
                    text,
                    photoUrl,
                    audioUrl,
                    author: {
                        connect: { id: authorId },
                    },
                },
            });

            await tx.user.update({
                where: { id: authorId },
                data: isNewMonth
                    ? { monthlyTweetCount: 1, lastTweetResetAt: new Date() }
                    : { monthlyTweetCount: { increment: 1 } },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

