import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";
import { deleteFile } from "@/utilities/storage";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ username: string; tweetId: string }> }
) {
    const { tweetId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    try {
        const tweet = await prisma.tweet.findUnique({
            where: { id: tweetId },
            select: {
                authorId: true,
                photoUrl: true,
                audioUrl: true,
            },
        });

        if (!tweet) {
            return NextResponse.json({ success: false, message: "Tweet not found." });
        }

        if (tweet.authorId !== verifiedToken.id) {
            return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
        }

        await prisma.tweet.delete({
            where: { id: tweetId },
        });

        if (tweet.photoUrl) {
            await deleteFile(tweet.photoUrl);
        }
        if (tweet.audioUrl) {
            await deleteFile(tweet.audioUrl);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
