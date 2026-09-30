"use client";

import { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { AuthContext } from "@/context/AuthContext";
import CircularLoading from "@/components/misc/CircularLoading";
import NothingToShow from "@/components/misc/NothingToShow";

export default function BookmarksPage() {
    const { token, isPending } = useContext(AuthContext);

    if (isPending) return <CircularLoading />;

    return (
        <main className="x-bookmarks-page">
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backgroundColor: "var(--header-bg)",
                    backdropFilter: "blur(12px)",
                    borderBottom: "1px solid var(--border-color)",
                    px: 2,
                    py: 1.5,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--twitter-black)" }}>
                    Bookmarks
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--twitter-muted)" }}>
                    @{token?.username ?? "user"}
                </Typography>
            </Box>

            <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "var(--twitter-black)" }}>
                    Save posts for later
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--twitter-muted)", maxWidth: 400, mx: "auto" }}>
                    Don’t let the good ones fly away! Bookmark posts to easily find them again in the future.
                </Typography>
            </Box>

            <NothingToShow />
        </main>
    );
}
