import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.username !== username)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    {
                        sender: {
                            username: username,
                        },
                    },
                    {
                        recipient: {
                            username: username,
                        },
                    },
                ],
            },
            include: {
                sender: {
                    select: {
                        name: true,
                        username: true,
                        photoUrl: true,
                        isPremium: true,
                    },
                },
                recipient: {
                    select: {
                        name: true,
                        username: true,
                        photoUrl: true,
                        isPremium: true,
                    },
                },
            },
            orderBy: [
                {
                    createdAt: "asc",
                },
            ],
        });

        type MessageItem = (typeof messages)[number];

        interface ConversationItem {
            participants: string[];
            messages: MessageItem[];
        }

        const conversations: Record<string, ConversationItem> = {};

        messages.forEach((message: MessageItem) => {
            const sender = message.sender.username;
            const recipient = message.recipient.username;
            const conversationKey = [sender, recipient].sort().join("-");

            if (!Object.prototype.hasOwnProperty.call(conversations, conversationKey)) {
                conversations[conversationKey] = {
                    participants: [sender, recipient],
                    messages: [],
                };
            }

            conversations[conversationKey].messages.push(message);
        });

        const formattedConversations = Object.values(conversations);

        formattedConversations.sort((a, b) => {
            const lastMessageA = a.messages[a.messages.length - 1];
            const lastMessageB = b.messages[b.messages.length - 1];

            if (!lastMessageA || !lastMessageB) return 0;

            const timeA = new Date(lastMessageA.createdAt).getTime();
            const timeB = new Date(lastMessageB.createdAt).getTime();

            return timeB - timeA;
        });

        return NextResponse.json({ success: true, formattedConversations });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
