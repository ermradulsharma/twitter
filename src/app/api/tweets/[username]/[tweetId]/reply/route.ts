import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createNotificationDb } from "@/utilities/notifications";
import { UserProps } from "@/types/UserProps";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tweetId: string; username: string }> }
) {
    const { tweetId } = await params;
    try {
        const tweets = await prisma.tweet.findMany({
            where: {
                isReply: true,
                repliedToId: tweetId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        description: true,
                        isPremium: true,
                        photoUrl: true,
                    },
                },
                likedBy: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        description: true,
                        isPremium: true,
                        photoUrl: true,
                        followers: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                photoUrl: true,
                            },
                        },
                    },
                },
                repliedTo: {
                    select: {
                        id: true,
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                isPremium: true,
                                description: true,
                            },
                        },
                    },
                },
                replies: {
                    select: {
                        authorId: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json({ success: true, tweets });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tweetId: string; username: string }> }
) {
    const { tweetId, username } = await params;
    const { authorId, text, photoUrl } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.id !== authorId)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    try {
        const recipientUser = await prisma.user.findUnique({
            where: {
                username,
            },
            select: {
                id: true,
            },
        });

        if (!recipientUser) {
            return NextResponse.json({ success: false, message: "Recipient does not exist." });
        }

        await prisma.tweet.create({
            data: {
                isReply: true,
                text,
                photoUrl,
                author: {
                    connect: {
                        id: authorId,
                    },
                },
                repliedTo: {
                    connect: {
                        id: tweetId,
                    },
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
                content: {
                    id: tweetId,
                },
            };

            await createNotificationDb(recipientUser.id, "reply", notificationContent);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
