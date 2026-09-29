import { prisma } from "@/prisma/client";
import { NotificationContent, NotificationTypes } from "@/types/NotificationProps";

export const createNotificationDb = async (
    recipientId: string,
    type: NotificationTypes,
    notificationContent: NotificationContent = null
) => {
    try {
        await prisma.notification.create({
            data: {
                user: {
                    connect: { id: recipientId },
                },
                type,
                content: JSON.stringify(notificationContent),
            },
        });
    } catch (error) {
        console.error("Failed to create notification directly in DB:", error);
    }
};
