"use client";

import { useContext } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { FaEllipsisH } from "react-icons/fa";

import { AuthContext } from "@/context/AuthContext";
import Search from "../misc/Search";
import WhoToFollow from "../misc/WhoToFollow";
import Legal from "../misc/Legal";

const TRENDS_DATA = [
    { category: "Technology · Trending", title: "Artificial Intelligence", posts: "142.5K posts" },
    { category: "Gaming · Trending", title: "GTA VI", posts: "89.2K posts" },
    { category: "Entertainment · Trending", title: "#Oscars2026", posts: "54.1K posts" },
    { category: "Sports · Trending", title: "Champions League", posts: "32.8K posts" },
    { category: "Business · Trending", title: "Silicon Valley", posts: "19.4K posts" },
];

export default function RightSidebar() {
    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();

    return (
        <aside className="right-sidebar" style={{ alignSelf: "flex-start" }}>
            <div
                className="fixed"
                style={{
                    position: "sticky",
                    top: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                }}
            >
                <Search />

                {/* PREMIUM CARD */}
                {(!token || !token.isPremium) && (
                    <Box
                        sx={{
                            backgroundColor: "var(--twitter-white)",
                            borderRadius: "1rem",
                            p: 2,
                            border: "1px solid var(--border-color)",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--twitter-black)", mb: 0.5 }}>
                            Subscribe to Premium
                        </Typography>
                        <Typography variant="body2" sx={{ color: "var(--twitter-muted)", fontSize: "0.88rem", mb: 1.5, lineHeight: 1.35 }}>
                            Subscribe to unlock new features and if eligible, receive a share of ads revenue.
                        </Typography>
                        <Button
                            component={Link}
                            href="/settings"
                            variant="contained"
                            disableElevation
                            sx={{
                                backgroundColor: "#1d9bf0",
                                color: "#fff",
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: "0.9rem",
                                px: 2.5,
                                py: 0.8,
                                "&:hover": { backgroundColor: "#1a8cd8" },
                            }}
                        >
                            Subscribe
                        </Button>
                    </Box>
                )}

                {/* WHAT'S HAPPENING (TRENDS) CARD */}
                <Box
                    sx={{
                        backgroundColor: "var(--twitter-white)",
                        borderRadius: "1rem",
                        p: 2,
                        border: "1px solid var(--border-color)",
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--twitter-black)", mb: 1.5 }}>
                        What’s happening
                    </Typography>

                    <Stack spacing={1.5}>
                        {TRENDS_DATA.map((trend) => (
                            <Box key={trend.title} sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", "&:hover .trend-title": { color: "#1d9bf0" } }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: "var(--twitter-muted)", fontSize: "0.78rem" }}>
                                        {trend.category}
                                    </Typography>
                                    <Typography className="trend-title" variant="subtitle2" sx={{ fontWeight: 700, color: "var(--twitter-black)", fontSize: "0.93rem", transition: "color 0.15s" }}>
                                        {trend.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "var(--twitter-muted)", fontSize: "0.78rem" }}>
                                        {trend.posts}
                                    </Typography>
                                </Box>
                                <IconButton size="small" sx={{ color: "var(--twitter-muted)" }}>
                                    <FaEllipsisH size={12} />
                                </IconButton>
                            </Box>
                        ))}
                    </Stack>

                    <Typography
                        component={Link}
                        href="/explore"
                        sx={{
                            display: "block",
                            mt: 2,
                            color: "#1d9bf0",
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                        }}
                    >
                        Show more
                    </Typography>
                </Box>

                {/* WHO TO FOLLOW */}
                {token && <WhoToFollow />}

                {/* LOG IN / SIGN UP PROMPT FOR GUESTS */}
                {!isPending && !token && (
                    <Box
                        sx={{
                            backgroundColor: "var(--twitter-white)",
                            borderRadius: "1rem",
                            p: 2,
                            border: "1px solid var(--border-color)",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--twitter-black)", fontSize: "1.1rem" }}>
                            Don’t miss what’s happening
                        </Typography>
                        <Typography variant="body2" sx={{ color: "var(--twitter-muted)", fontSize: "0.85rem", my: 1 }}>
                            People on X are the first to know.
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                            <Button component={Link} href="/" variant="outlined" fullWidth sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}>
                                Log in
                            </Button>
                            <Button component={Link} href="/" variant="contained" fullWidth sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, backgroundColor: "var(--twitter-black)", color: "var(--background-primary)" }}>
                                Sign up
                            </Button>
                        </Stack>
                    </Box>
                )}

                <Legal />
            </div>
        </aside>
    );
}
