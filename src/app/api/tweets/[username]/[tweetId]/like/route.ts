import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createNotification } from "@/utilities/fetch";
import { UserProps } from "@/types/UserProps";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tweetId: string; username: string }> }
) {
    const { tweetId, username } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    const secret = process.env.CREATION_SECRET_KEY;
    if (!secret) {
        return NextResponse.json({ success: false, message: "Secret key not found." }, { status: 500 });
    }

    try {
        const recipientUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!recipientUser) {
            return NextResponse.json({ success: false, message: "Recipient does not exist." }, { status: 404 });
        }

        await prisma.tweet.update({
            where: { id: tweetId },
            data: {
                likedBy: {
                    connect: { id: verifiedToken.id },
                },
            },
        });

        if (username !== verifiedToken.username) {
            const notificationContent = {
                sender: {
                    username: verifiedToken.username,
                    name: verifiedToken.name,
                    photoUrl: verifiedToken.photoUrl,
                },
                content: { id: tweetId },
            };

            await createNotification(recipientUser.id, "like", secret, notificationContent);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to like tweet.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

