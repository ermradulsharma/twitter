"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography, IconButton } from "@mui/material";
import { RiSettings3Line } from "react-icons/ri";

import { AuthContext } from "@/context/AuthContext";
import { getNotifications, markNotificationsRead } from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import NothingToShow from "@/components/misc/NothingToShow";
import { NotificationProps } from "@/types/NotificationProps";
import Notification from "@/components/misc/Notification";

export default function NotificationsPage() {
    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<"all" | "verified" | "mentions">("all");

    const queryClient = useQueryClient();

    const { isLoading, data, isFetched } = useQuery({
        queryKey: ["notifications", token?.id],
        queryFn: getNotifications,
        enabled: !!token,
    });

    const mutation = useMutation({
        mutationFn: markNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: (error) => console.log(error),
    });

    const handleNotificationsRead = () => {
        mutation.mutate();
    };

    useEffect(() => {
        if (isFetched && data?.notifications?.filter((notification: NotificationProps) => !notification.isRead).length > 0) {
            const countdownForMarkAsRead = setTimeout(() => {
                handleNotificationsRead();
            }, 1000);

            return () => {
                clearTimeout(countdownForMarkAsRead);
            };
        }
    }, [isFetched, data]);

    const notifications = data?.notifications ?? [];
    const unreadCount = useMemo(
        () => notifications.filter((notification: NotificationProps) => !notification.isRead).length,
        [notifications]
    );

    if (isPending || !token || isLoading) return <CircularLoading />;

    const tabs = [
        { id: "all" as const, label: "All" },
        { id: "verified" as const, label: "Verified" },
        { id: "mentions" as const, label: "Mentions" },
    ];

    const filteredNotifications = notifications.filter((n: NotificationProps) => {
        if (activeTab === "verified") return Boolean(n.user?.isPremium);
        if (activeTab === "mentions") return n.type === "reply";
        return true;
    });

    return (
        <main className="x-notifications-page">
            {/* STICKY X NOTIFICATIONS HEADER WITH TABS */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backgroundColor: "var(--header-bg)",
                    backdropFilter: "blur(12px)",
                    borderBottom: "1px solid var(--border-color)",
                }}
            >
                <Box sx={{ px: 2, pt: 1.5, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--twitter-black)" }}>
                        Notifications
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {unreadCount > 0 && (
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d9bf0", bg: "rgba(29,155,240,0.1)", px: 1.2, py: 0.3, borderRadius: 999 }}>
                                {unreadCount} new
                            </Typography>
                        )}
                        <IconButton size="small" sx={{ color: "var(--twitter-black)" }}>
                            <RiSettings3Line size={20} />
                        </IconButton>
                    </Box>
                </Box>

                <Stack direction="row" sx={{ width: "100%" }}>
                    {tabs.map((tab) => (
                        <Box
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            sx={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                position: "relative",
                                "&:hover": { backgroundColor: "var(--hover)" },
                                transition: "background-color 0.15s ease",
                            }}
                        >
                            <Typography
                                component="div"
                                sx={{
                                    fontWeight: activeTab === tab.id ? 800 : 500,
                                    fontSize: "0.95rem",
                                    color: activeTab === tab.id ? "var(--twitter-black)" : "var(--twitter-muted)",
                                    position: "relative",
                                    py: 1.5,
                                }}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: 4,
                                            backgroundColor: "#1d9bf0",
                                            borderRadius: "999px",
                                        }}
                                    />
                                )}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Box>

            {isFetched && filteredNotifications.length === 0 ? (
                <NothingToShow />
            ) : (
                <div className="notifications-wrapper">
                    {filteredNotifications.map((notification: NotificationProps) => (
                        <Notification key={notification.id} notification={notification} token={token} />
                    ))}
                </div>
            )}
        </main>
    );
}
