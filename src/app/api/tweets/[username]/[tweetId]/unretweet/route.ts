import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ username: string; tweetId: string }> }
) {
    const { tweetId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    try {
        const originalTweet = await prisma.tweet.findFirst({
            where: { id: tweetId },
            include: { retweets: true },
        });

        await prisma.tweet.update({
            where: { id: tweetId },
            data: {
                retweetedBy: {
                    disconnect: { id: verifiedToken.id },
                },
            },
        });

        const retweetId = originalTweet?.retweets.find((retweet: any) => retweet.authorId === verifiedToken.id)?.id;

        if (retweetId) {
            await prisma.tweet.delete({
                where: { id: retweetId },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to unretweet.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

