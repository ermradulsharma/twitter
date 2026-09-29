import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createNotificationDb } from "@/utilities/notifications";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    try {
        const recipientUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!recipientUser) {
            return NextResponse.json({ success: false, message: "Recipient does not exist." }, { status: 404 });
        }

        await prisma.user.update({
            where: { username },
            data: {
                followers: {
                    connect: { id: verifiedToken.id },
                },
            },
        });

        const notificationContent = {
            sender: {
                username: verifiedToken.username,
                name: verifiedToken.name,
                photoUrl: verifiedToken.photoUrl,
            },
            content: null,
        };

        await createNotificationDb(recipientUser.id, "follow", notificationContent);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to follow user.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

