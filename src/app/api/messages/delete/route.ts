import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest) {
    const { participants }: { participants: string[] } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    if (!Array.isArray(participants) || participants.length !== 2 || !participants[0] || !participants[1]) {
        return NextResponse.json({ success: false, message: "Invalid participants specified." }, { status: 400 });
    }

    const [userA, userB] = participants;

    if (verifiedToken.username !== userA && verifiedToken.username !== userB) {
        return NextResponse.json({ success: false, message: "You are not authorized to delete this conversation." }, { status: 403 });
    }

    try {
        await prisma.message.deleteMany({
            where: {
                OR: [
                    {
                        sender: { username: userA },
                        recipient: { username: userB },
                    },
                    {
                        sender: { username: userB },
                        recipient: { username: userA },
                    },
                ],
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to delete conversation.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}


