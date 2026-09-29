import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { NotificationProps } from "@/types/NotificationProps";

export async function POST(request: NextRequest) {
    const { recipientId, recipient, type, secret, notificationContent }: NotificationProps & { recipientId?: string } = await request.json();

    if (secret !== process.env.CREATION_SECRET_KEY) {
        return NextResponse.json({ success: false, message: "Invalid secret." }, { status: 401 });
    }

    const resolvedRecipientId = recipientId;
    const resolvedRecipientUsername = recipient;

    if (!resolvedRecipientId && !resolvedRecipientUsername) {
        return NextResponse.json({ success: false, message: "Recipient is required." }, { status: 400 });
    }

    try {
        await prisma.notification.create({
            data: {
                user: {
                    connect: resolvedRecipientId ? { id: resolvedRecipientId } : { username: resolvedRecipientUsername as string },
                },
                type: type,
                content: JSON.stringify(notificationContent),
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create notification.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
