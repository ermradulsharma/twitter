"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Box, Stack, Typography, TextField, InputAdornment } from "@mui/material";
import { MdSearch } from "react-icons/md";
import { FaSliders } from "react-icons/fa6";

import { getAllTweets } from "@/utilities/fetch";
import NewTweet from "@/components/tweet/NewTweet";
import Tweets from "@/components/tweet/Tweets";
import { AuthContext } from "@/context/AuthContext";
import CircularLoading from "@/components/misc/CircularLoading";

export default function ExplorePage() {
    const { token, isPending } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState<"forYou" | "trending" | "news" | "sports" | "entertainment">("forYou");
    const [searchQuery, setSearchQuery] = useState("");

    const { data, fetchNextPage, isLoading, hasNextPage } = useInfiniteQuery({
        queryKey: ["tweets"],
        queryFn: async ({ pageParam = 1 }) => getAllTweets(String(pageParam)),
        initialPageParam: 1,
        getNextPageParam: (lastResponse) => {
            if (!lastResponse || lastResponse.nextPage > lastResponse.lastPage) return undefined;
            return lastResponse.nextPage;
        },
    });

    const tweetsResponse = useMemo(
        () =>
            data?.pages.reduce(
                (prev, page) => {
                    return {
                        nextPage: page.nextPage,
                        tweets: [...prev.tweets, ...(page?.tweets || [])],
                    };
                },
                { nextPage: 1, tweets: [] as any[] }
            ),
        [data]
    );

    if (isPending) return <CircularLoading />;

    const tabs = [
        { id: "forYou" as const, label: "For you" },
        { id: "trending" as const, label: "Trending" },
        { id: "news" as const, label: "News" },
        { id: "sports" as const, label: "Sports" },
        { id: "entertainment" as const, label: "Entertainment" },
    ];

    return (
        <main className="x-explore-page">
            {/* STICKY X EXPLORE HEADER WITH SEARCH BAR AND TABS */}
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
                <Box sx={{ px: 2, pt: 1.5, pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                    <TextField
                        placeholder="Search X"
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 999,
                                backgroundColor: "var(--hover)",
                                "& fieldset": { borderColor: "transparent" },
                                "&:hover fieldset": { borderColor: "transparent" },
                                "&.Mui-focused fieldset": { borderColor: "#1d9bf0" },
                            },
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <MdSearch style={{ color: "var(--twitter-muted)", fontSize: "1.2rem" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 999,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--twitter-black)",
                            "&:hover": { backgroundColor: "var(--hover)" },
                            flexShrink: 0,
                        }}
                    >
                        <FaSliders size={16} />
                    </Box>
                </Box>

                <Stack direction="row" sx={{ width: "100%", overflowX: "auto", "&::-webkit-scrollbar": { display: "none" }, msOverflowStyle: "none", scrollbarWidth: "none" }}>
                    {tabs.map((tab) => (
                        <Box
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            sx={{
                                flex: 1,
                                minWidth: 90,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                position: "relative",
                                px: 1.5,
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
                                    whiteSpace: "nowrap",
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

            {token && <NewTweet token={token} />}
            {isLoading ? (
                <CircularLoading />
            ) : (
                <InfiniteScroll
                    dataLength={tweetsResponse ? tweetsResponse.tweets.length : 0}
                    next={() => fetchNextPage()}
                    hasMore={!!hasNextPage}
                    loader={<CircularLoading />}
                >
                    <Tweets tweets={tweetsResponse && tweetsResponse.tweets} />
                </InfiniteScroll>
            )}
        </main>
    );
}
