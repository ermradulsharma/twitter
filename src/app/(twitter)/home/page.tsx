"use client";

import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Stack, Typography } from "@mui/material";

import Tweets from "@/components/tweet/Tweets";
import { getRelatedTweets } from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import NothingToShow from "@/components/misc/NothingToShow";
import NewTweet from "@/components/tweet/NewTweet";
import { AuthContext } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function HomePage() {
    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");

    const { isLoading, data } = useQuery({
        queryKey: ["tweets", "home"],
        queryFn: () => getRelatedTweets(),
    });

    if (isPending || isLoading) return <CircularLoading />;

    return (
        <main className="x-home-feed">
            {/* STICKY X HEADER WITH FOR YOU / FOLLOWING TABS */}
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
                <Stack direction="row" sx={{ width: "100%", height: 53 }}>
                    <Box
                        onClick={() => setActiveTab("forYou")}
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
                                fontWeight: activeTab === "forYou" ? 800 : 500,
                                fontSize: "0.95rem",
                                color: activeTab === "forYou" ? "var(--twitter-black)" : "var(--twitter-muted)",
                                position: "relative",
                                py: 1.5,
                            }}
                        >
                            For you
                            {activeTab === "forYou" && (
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

                    <Box
                        onClick={() => setActiveTab("following")}
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
                                fontWeight: activeTab === "following" ? 800 : 500,
                                fontSize: "0.95rem",
                                color: activeTab === "following" ? "var(--twitter-black)" : "var(--twitter-muted)",
                                position: "relative",
                                py: 1.5,
                            }}
                        >
                            Following
                            {activeTab === "following" && (
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
                </Stack>
            </Box>

            {token && <NewTweet token={token} />}
            {data && data.tweets.length === 0 && <NothingToShow />}
            <Tweets tweets={data?.tweets ?? []} />
        </main>
    );
}
