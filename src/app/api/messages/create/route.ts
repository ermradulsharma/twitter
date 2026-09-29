import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createNotificationDb } from "@/utilities/notifications";
import { shouldCreateNotification } from "@/utilities/misc/shouldCreateNotification";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest) {
    const { recipient, text, photoUrl } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    const sender = verifiedToken.username;

    if (!recipient?.trim()) {
        return NextResponse.json({ success: false, message: "Recipient username is required." }, { status: 400 });
    }

    if (!text?.trim() && !photoUrl) {
        return NextResponse.json({ success: false, message: "Message content cannot be empty." }, { status: 400 });
    }

    try {
        const isRecipient = await prisma.user.findUnique({
            where: { username: recipient },
            select: { id: true },
        });

        if (!isRecipient) {
            return NextResponse.json({ success: false, message: "Recipient does not exist." }, { status: 404 });
        }

        await prisma.message.create({
            data: {
                text: text?.trim() || "",
                photoUrl,
                sender: {
                    connect: { username: sender },
                },
                recipient: {
                    connect: { username: recipient },
                },
            },
        });

        if (recipient !== sender && (await shouldCreateNotification(sender, recipient))) {
            const notificationContent = {
                sender: {
                    username: verifiedToken.username,
                    name: verifiedToken.name,
                    photoUrl: verifiedToken.photoUrl,
                },
                content: null,
            };

            await createNotificationDb(isRecipient.id, "message", notificationContent);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to send message.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}


