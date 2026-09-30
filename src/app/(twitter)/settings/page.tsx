"use client";

import { useContext, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Alert,
    Box,
    Collapse,
    Dialog,
    Grid,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    Stack,
    Switch,
    TextField,
    Snackbar,
    Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
    FaArrowLeft,
    FaChevronDown,
    FaChevronRight,
    FaDesktop,
    FaLocationDot,
    FaMobileScreenButton,
    FaTabletScreenButton,
    FaCheck,
    FaShieldHalved,
    FaGlobe,
    FaPalette,
    FaCrown,
} from "react-icons/fa6";
import { MdSearch } from "react-icons/md";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "@/app/providers";
import { AuthContext } from "@/context/AuthContext";
import LanguageSelector from "@/components/misc/LanguageSelector";
import CircularLoading from "@/components/misc/CircularLoading";
import { formatDate, formatDateExtended } from "@/utilities/date";
import { activateSubscription, createSubscriptionOrder, getLoginHistory } from "@/utilities/fetch";
import { LoginHistoryProps } from "@/types/LoginHistoryProps";
import { SubscriptionPlan } from "@/types/UserProps";

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
        };
    }
}

type SettingsSection = "theme" | "language" | "subscription" | "loginHistory";

function getSessionDeviceIcon(deviceType: string) {
    const value = deviceType.toLowerCase();
    if (value.includes("mobile")) return FaMobileScreenButton;
    if (value.includes("tablet")) return FaTabletScreenButton;
    return FaDesktop;
}

function LoginHistorySessionRow({ entry, isCurrent }: { entry: LoginHistoryProps; isCurrent: boolean }) {
    const [open, setOpen] = useState(false);
    const DeviceIcon = getSessionDeviceIcon(entry.deviceType);

    return (
        <Box sx={{ borderBottom: "1px solid var(--border-color)" }}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    border: 0,
                    background: "transparent",
                    color: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                }}
            >
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: "999px",
                            backgroundColor: "var(--hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--twitter-black)",
                        }}
                    >
                        <DeviceIcon size={18} />
                    </Box>
                    {isCurrent && (
                        <span
                            style={{
                                position: "absolute",
                                right: 0,
                                bottom: 0,
                                width: 11,
                                height: 11,
                                borderRadius: "999px",
                                backgroundColor: "#00ba7c",
                                border: "2px solid var(--background-primary)",
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--twitter-black)" }}>
                            {entry.browser}
                        </Typography>
                        <Typography sx={{ fontSize: "0.85rem", color: "var(--twitter-muted)" }}>•</Typography>
                        <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--twitter-black)" }}>
                            {entry.operatingSystem}
                        </Typography>
                        <Chip
                            size="small"
                            label={isCurrent ? "Current session" : "Active device"}
                            sx={{
                                height: 22,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                backgroundColor: isCurrent ? "rgba(29, 155, 240, 0.12)" : "var(--hover)",
                                color: isCurrent ? "#1d9bf0" : "var(--twitter-muted)",
                                borderRadius: 999,
                                border: isCurrent ? "1px solid rgba(29, 155, 240, 0.3)" : "none",
                            }}
                        />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginTop: "2px", fontSize: "0.8125rem", color: "var(--twitter-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FaLocationDot size={11} />
                            <span>{entry.deviceType}</span>
                        </span>
                        <span>•</span>
                        <span>{entry.ipAddress}</span>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "var(--twitter-muted)" }}>{formatDate(entry.loginTime)}</Typography>
                    <FaChevronDown
                        size={13}
                        style={{
                            color: "var(--twitter-muted)",
                            transform: open ? "rotate(180deg)" : "none",
                            transition: "transform 180ms ease",
                        }}
                    />
                </Box>
            </button>

            <Collapse in={open} timeout={200} unmountOnExit>
                <Box sx={{ px: 2, pb: 2, pl: 7 }}>
                    <Box sx={{ borderTop: "1px solid var(--border-color)", pt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: "0.82rem" }}>
                            <Typography sx={{ color: "var(--twitter-muted)" }}>Signed in time</Typography>
                            <Typography sx={{ fontWeight: 600, color: "var(--twitter-black)", textAlign: "right" }}>{formatDateExtended(entry.loginTime)}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: "0.82rem" }}>
                            <Typography sx={{ color: "var(--twitter-muted)" }}>IP Address</Typography>
                            <Typography sx={{ fontWeight: 600, color: "var(--twitter-black)", textAlign: "right" }}>{entry.ipAddress}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: "0.82rem" }}>
                            <Typography sx={{ color: "var(--twitter-muted)" }}>Last active</Typography>
                            <Typography sx={{ fontWeight: 600, color: "var(--twitter-black)", textAlign: "right" }}>{formatDateExtended(entry.loginTime)}</Typography>
                        </Box>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}

export default function SettingsPage() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { token, refreshToken } = useContext(AuthContext);
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [paymentToastOpen, setPaymentToastOpen] = useState(false);
    const [activatedSubscription, setActivatedSubscription] = useState<{
        plan: SubscriptionPlan;
        email: string;
    } | null>(null);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [accentColor, setAccentColor] = useState("#1d9bf0");

    const { isLoading, data } = useQuery({
        queryKey: ["login-history"],
        queryFn: getLoginHistory,
        enabled: !!token,
    });

    const [activeSection, setActiveSection] = useState<SettingsSection | null>("theme");
    const [searchQuery, setSearchQuery] = useState("");

    const loginHistory: LoginHistoryProps[] = data?.loginHistory ?? [];
    const subscriptionPlans = [
        {
            key: "FREE" as const,
            name: t("settings.free"),
            price: `\u20B90${t("settings.month")}`,
            tweets: t("settings.subscriptionCardOneTweet"),
            features: ["Post up to 280 characters", "Basic feed access", "Standard support"],
        },
        {
            key: "BRONZE" as const,
            name: t("settings.bronze"),
            price: `\u20B9100${t("settings.month")}`,
            tweets: t("settings.subscriptionCardThreeTweets"),
            features: ["Edit posts", "Bookmark folders", "Small reply boost"],
        },
        {
            key: "SILVER" as const,
            name: t("settings.silver"),
            price: `\u20B9300${t("settings.month")}`,
            tweets: t("settings.subscriptionCardFiveTweets"),
            features: ["Verified Checkmark Badge", "Half ads in For You", "Creator Revenue Sharing eligibility", "Prioritized rankings"],
        },
        {
            key: "GOLD" as const,
            name: t("settings.gold"),
            price: `\u20B91000${t("settings.month")}`,
            tweets: t("settings.subscriptionCardUnlimitedTweets"),
            features: ["Verified Gold Checkmark", "No ads in For You & Following", "Maximum reply boost", "Write articles & long posts", "X Pro access"],
        },
    ];

    const loadRazorpayScript = () => {
        return new Promise<boolean>((resolve) => {
            if (window.Razorpay) return resolve(true);

            const existingScript = document.querySelector<HTMLScriptElement>("script[src='https://checkout.razorpay.com/v1/checkout.js']");
            if (existingScript) {
                existingScript.addEventListener("load", () => resolve(true));
                existingScript.addEventListener("error", () => resolve(false));
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleChoosePlan = async (plan: SubscriptionPlan) => {
        if (!token) return;

        if (plan === "FREE") {
            setPaymentMessage("Free plan does not require payment.");
            setPaymentToastOpen(true);
            setSelectedPlan("FREE");
            return;
        }

        if (token.subscriptionPlan === plan) {
            setPaymentMessage(t("settings.alreadyOnPlan", { plan }));
            setPaymentToastOpen(true);
            setSelectedPlan(plan);
            return;
        }

        setIsCheckoutLoading(true);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setPaymentMessage("Unable to load Razorpay checkout.");
                setPaymentToastOpen(true);
                setSelectedPlan(plan);
                return;
            }

            const response = await createSubscriptionOrder(plan);
            const planName = subscriptionPlans.find((item) => item.key === plan)?.name ?? plan;

            const isDevMock = response.order?.id?.startsWith("order_dev_") || response.keyId?.includes("placeholder");

            const options = {
                key: response.keyId,
                amount: response.order.amount,
                currency: response.order.currency,
                name: "X Subscription",
                description: `${planName} subscription`,
                order_id: response.order.id,
                handler: (razorpayResponse: Record<string, string>) => {
                    void (async () => {
                        await activateSubscription(plan, {
                            razorpayPaymentId: razorpayResponse.razorpay_payment_id ?? `pay_dev_${Date.now()}`,
                            razorpayOrderId: razorpayResponse.razorpay_order_id ?? response.order.id,
                            razorpaySignature: razorpayResponse.razorpay_signature ?? "sig_dev_mock",
                        });

                        await refreshToken();
                        setSelectedPlan(plan);
                        setActivatedSubscription({
                            plan,
                            email: token.email ?? "",
                        });
                        setPaymentMessage(`Subscription activated successfully for ${planName} plan.`);
                        setPaymentToastOpen(true);
                    })().catch((error: unknown) => {
                        setActivatedSubscription(null);
                        setPaymentMessage(error instanceof Error ? error.message : "Something went wrong.");
                        setPaymentToastOpen(true);
                    });
                },
                prefill: {
                    name: token.name ?? token.username,
                    email: token.email ?? "",
                    contact: token.phone ?? "",
                },
                notes: {
                    username: token.username,
                    plan,
                },
                theme: {
                    color: "#1d9bf0",
                },
            };

            setSelectedPlan(plan);

            if (isDevMock) {
                console.log("[Dev Mode] Auto-activating mock subscription order:", response.order.id);
                options.handler({
                    razorpay_payment_id: `pay_dev_${Date.now()}`,
                    razorpay_order_id: response.order.id,
                    razorpay_signature: "sig_dev_mock",
                });
                return;
            }

            const Razorpay = window.Razorpay;
            if (!Razorpay) {
                throw new Error("Razorpay checkout is unavailable.");
            }
            const razorpay = new Razorpay(options);
            razorpay.open();
        } catch (error) {
            setSelectedPlan(plan);
            setActivatedSubscription(null);
            setPaymentMessage(
                error instanceof Error && error.message === "PAYMENT_WINDOW_RESTRICTED"
                    ? t("settings.paymentWindowRestricted")
                    : error instanceof Error
                      ? error.message
                      : "Something went wrong."
            );
            setPaymentToastOpen(true);
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    const currentPlanName =
        subscriptionPlans.find((p) => p.key === token?.subscriptionPlan)?.name ?? t("settings.free");

    type Row = {
        key: SettingsSection;
        title: string;
        subtitle: string;
        icon: React.ComponentType<{ size?: number }>;
        category: string;
        visible: boolean;
    };

    const rows: Row[] = [
        {
            key: "theme",
            title: t("settings.colorTheme"),
            subtitle: "Manage theme, color accents, and display background intensity",
            icon: FaPalette,
            category: "Accessibility, display, and languages",
            visible: true,
        },
        {
            key: "language",
            title: t("settings.language"),
            subtitle: t("settings.languageDescription"),
            icon: FaGlobe,
            category: "Accessibility, display, and languages",
            visible: true,
        },
        {
            key: "subscription",
            title: t("settings.premium"),
            subtitle: `Manage subscription perks · Current plan: ${currentPlanName}`,
            icon: FaCrown,
            category: "X Premium",
            visible: !!token,
        },
        {
            key: "loginHistory",
            title: t("settings.loginHistory"),
            subtitle: t("settings.loginHistorySubtitle"),
            icon: FaShieldHalved,
            category: "Security and account access",
            visible: !!token,
        },
    ];

    const filteredRows = rows.filter(
        (row) => row.visible && (row.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) || row.subtitle.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    );

    const sectionTitles: Record<SettingsSection, string> = {
        theme: t("settings.colorTheme"),
        language: t("settings.language"),
        subscription: t("settings.premium"),
        loginHistory: t("settings.loginHistory"),
    };

    const renderRow = (row: Row) => {
        const Icon = row.icon;
        const isSelected = activeSection === row.key;
        return (
            <ListItemButton
                key={row.key}
                selected={isSelected}
                onClick={() => setActiveSection(row.key)}
                sx={{
                    px: 2.5,
                    py: 1.75,
                    borderRadius: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    borderRight: isSelected ? "3px solid #1d9bf0" : "3px solid transparent",
                    backgroundColor: isSelected ? "var(--hover)" : "transparent",
                    "&:hover": {
                        backgroundColor: "var(--hover)",
                    },
                    transition: "background-color 0.15s ease-in-out",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, minWidth: 0 }}>
                    <Box sx={{ pt: 0.25, color: isSelected ? "#1d9bf0" : "var(--twitter-muted)", flexShrink: 0 }}>
                        <Icon size={18} />
                    </Box>
                    <ListItemText
                        primary={row.title}
                        secondary={row.subtitle}
                        slotProps={{
                            primary: { style: { fontWeight: isSelected ? 800 : 700, fontSize: "0.95rem", color: "var(--twitter-black)" } },
                            secondary: { style: { fontSize: "0.82rem", color: "var(--twitter-muted)", marginTop: "2px" } },
                        }}
                    />
                </Box>
                <FaChevronRight style={{ flexShrink: 0, color: "var(--twitter-muted)", fontSize: "0.8rem" }} />
            </ListItemButton>
        );
    };

    const renderThemePanel = () => (
        <Stack spacing={3} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Box>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--twitter-black)", mb: 0.5 }}>
                    Display & Appearance
                </Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "var(--twitter-muted)" }}>
                    {t("settings.themeDescription")}
                </Typography>
            </Box>

            {/* Background Theme Mode Selection */}
            <Box>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--twitter-black)", mb: 1.5 }}>
                    Background Mode
                </Typography>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6, sm: 6 }}>
                        <Box
                            onClick={() => theme === "dark" && toggleTheme()}
                            sx={{
                                border: theme === "light" ? "2px solid #1d9bf0" : "1px solid var(--border-color)",
                                borderRadius: "16px",
                                p: 2,
                                cursor: "pointer",
                                backgroundColor: "#ffffff",
                                color: "#0f1419",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                transition: "all 0.15s ease",
                                "&:hover": { borderColor: "#1d9bf0" },
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ width: 18, height: 18, borderRadius: 999, border: theme === "light" ? "6px solid #1d9bf0" : "2px solid #71767b" }} />
                                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Default Light</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6 }}>
                        <Box
                            onClick={() => theme === "light" && toggleTheme()}
                            sx={{
                                border: theme === "dark" ? "2px solid #1d9bf0" : "1px solid var(--border-color)",
                                borderRadius: "16px",
                                p: 2,
                                cursor: "pointer",
                                backgroundColor: "#000000",
                                color: "#e7e9ea",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                transition: "all 0.15s ease",
                                "&:hover": { borderColor: "#1d9bf0" },
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box sx={{ width: 18, height: 18, borderRadius: 999, border: theme === "dark" ? "6px solid #1d9bf0" : "2px solid #71767b" }} />
                                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Lights out (Dark)</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Accent Color Selection */}
            <Box>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--twitter-black)", mb: 1.5 }}>
                    Color Accent
                </Typography>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        p: 2,
                        backgroundColor: "var(--hover)",
                    }}
                >
                    {[
                        { color: "#1d9bf0", name: "Blue" },
                        { color: "#ffd400", name: "Yellow" },
                        { color: "#f91880", name: "Pink" },
                        { color: "#7856ff", name: "Purple" },
                        { color: "#ff7a00", name: "Orange" },
                        { color: "#00ba7c", name: "Green" },
                    ].map((item) => (
                        <Box
                            key={item.color}
                            onClick={() => setAccentColor(item.color)}
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                backgroundColor: item.color,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                transform: accentColor === item.color ? "scale(1.15)" : "scale(1)",
                                boxShadow: accentColor === item.color ? `0 0 12px ${item.color}` : "none",
                                transition: "transform 0.15s ease",
                            }}
                        >
                            {accentColor === item.color && <FaCheck size={14} />}
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Dark Mode Switch Row */}
            <Stack
                direction="row"
                sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    px: 2.5,
                    py: 2,
                }}
            >
                <Stack>
                    <Typography sx={{ fontWeight: 700, color: "var(--twitter-black)" }}>{t("settings.darkMode")}</Typography>
                    <Typography variant="body2" sx={{ color: "var(--twitter-muted)" }}>
                        {theme === "dark" ? t("settings.lightsOut") : t("settings.defaultTheme")}
                    </Typography>
                </Stack>
                <Switch
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    sx={{
                        width: 54,
                        height: 32,
                        p: 0,
                        "& .MuiSwitch-switchBase": {
                            p: "5px",
                            "&.Mui-checked": {
                                transform: "translateX(22px)",
                                color: "#fff",
                                "& + .MuiSwitch-track": {
                                    backgroundColor: "#1d9bf0",
                                    opacity: 1,
                                },
                            },
                        },
                        "& .MuiSwitch-thumb": {
                            width: 22,
                            height: 22,
                            boxShadow: "none",
                        },
                        "& .MuiSwitch-track": {
                            borderRadius: 16,
                            backgroundColor: "#71767b",
                            opacity: 1,
                            transition: "background-color 0.2s ease-in-out",
                        },
                    }}
                />
            </Stack>
        </Stack>
    );

    const renderLanguagePanel = () => (
        <Stack spacing={3} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Box>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--twitter-black)", mb: 0.5 }}>
                    {t("settings.language")}
                </Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "var(--twitter-muted)" }}>
                    {t("settings.languageDescription")}
                </Typography>
            </Box>

            <Box
                sx={{
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    px: 2.5,
                    py: 2.5,
                }}
            >
                {token && (
                    <LanguageSelector currentLanguage={token.preferredLanguage ?? "en"} refreshToken={refreshToken} />
                )}
            </Box>
        </Stack>
    );

    const renderSubscriptionPanel = () => (
        <Stack spacing={3} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Box>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--twitter-black)", mb: 0.5 }}>
                    X Premium Tiers
                </Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "var(--twitter-muted)" }}>
                    {t("settings.subscriptionCardDescription")}
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {subscriptionPlans.map((plan) => {
                    const isCurrentPlan = token?.subscriptionPlan === plan.key;
                    const isGold = plan.key === "GOLD";
                    const isSilver = plan.key === "SILVER";
                    const isBronze = plan.key === "BRONZE";

                    return (
                        <Grid size={{ xs: 12, sm: 6 }} key={plan.key}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: "100%",
                                    borderRadius: "20px",
                                    border: isCurrentPlan
                                        ? "2px solid #1d9bf0"
                                        : isGold
                                        ? "1px solid rgba(255, 215, 0, 0.4)"
                                        : "1px solid var(--border-color)",
                                    boxShadow: isGold
                                        ? "0 8px 30px rgba(255, 215, 0, 0.1)"
                                        : isCurrentPlan
                                        ? "0 8px 30px rgba(29, 155, 240, 0.12)"
                                        : "none",
                                    backgroundColor: "var(--background-primary)",
                                    position: "relative",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    transition: "transform 150ms ease, box-shadow 150ms ease",
                                    "&:hover": {
                                        transform: "translateY(-3px)",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                        <Typography
                                            sx={{
                                                fontSize: "1.1rem",
                                                fontWeight: 800,
                                                color: isGold ? "#ffd400" : isSilver ? "#1d9bf0" : "var(--twitter-black)",
                                            }}
                                        >
                                            {plan.name}
                                        </Typography>
                                        {isCurrentPlan && (
                                            <Chip
                                                size="small"
                                                label="Active Plan"
                                                sx={{
                                                    backgroundColor: "#1d9bf0",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    borderRadius: 999,
                                                    fontSize: "0.72rem",
                                                    height: 22,
                                                }}
                                            />
                                        )}
                                    </Stack>

                                    <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--twitter-black)", mb: 0.5 }}>
                                        {plan.price}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.85rem", color: "var(--twitter-muted)", mb: 2 }}>
                                        {plan.tweets}
                                    </Typography>

                                    <Stack spacing={1} sx={{ borderTop: "1px solid var(--border-color)", pt: 1.5 }}>
                                        {plan.features.map((feat) => (
                                            <Box key={feat} sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.82rem" }}>
                                                <FaCheck size={12} color="#1d9bf0" style={{ flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: "0.82rem", color: "var(--twitter-black)" }}>{feat}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>

                                <CardActions sx={{ p: 2.5, pt: 0 }}>
                                    <Button
                                        variant={isCurrentPlan ? "outlined" : "contained"}
                                        fullWidth
                                        onClick={() => handleChoosePlan(plan.key)}
                                        disabled={isCheckoutLoading && selectedPlan === plan.key}
                                        sx={{
                                            borderRadius: 999,
                                            fontWeight: 800,
                                            fontSize: "0.9rem",
                                            textTransform: "none",
                                            py: 1,
                                            backgroundColor: isCurrentPlan
                                                ? "transparent"
                                                : isGold
                                                ? "linear-gradient(135deg, #ffd400 0%, #f1c75d 100%)"
                                                : "#1d9bf0",
                                            color: isCurrentPlan ? "var(--twitter-black)" : isGold ? "#000" : "#fff",
                                            borderColor: isCurrentPlan ? "var(--border-color)" : "transparent",
                                            "&:hover": {
                                                backgroundColor: isCurrentPlan
                                                    ? "var(--hover)"
                                                    : isGold
                                                    ? "#e6be00"
                                                    : "#1a8cd8",
                                            },
                                        }}
                                    >
                                        {isCurrentPlan ? "Current Plan" : t("settings.choosePlan")}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {paymentMessage && (
                <Typography variant="body2" sx={{ color: "var(--twitter-muted)", fontWeight: 500 }}>
                    {paymentMessage}
                </Typography>
            )}
        </Stack>
    );

    const renderLoginHistoryPanel = () => {
        const currentSession = loginHistory[0];
        const otherSessions = loginHistory.slice(1);

        return (
            <Stack spacing={3} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
                <Box>
                    <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--twitter-black)", mb: 0.5 }}>
                        {t("settings.loginActivity")}
                    </Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "var(--twitter-muted)" }}>
                        {t("settings.loginActivityDescription")}
                    </Typography>
                </Box>

                {isLoading ? (
                    <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
                        <CircularLoading />
                    </Box>
                ) : loginHistory.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
                        No login history available.
                    </Typography>
                ) : (
                    <Stack spacing={3}>
                        {currentSession && (
                            <Box>
                                <Typography sx={{ mb: 1, fontSize: "0.8125rem", fontWeight: 800, color: "var(--twitter-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    {t("settings.currentSession")}
                                </Typography>
                                <Box sx={{ border: "1px solid var(--border-color)", borderRadius: "16px", overflow: "hidden" }}>
                                    <LoginHistorySessionRow entry={currentSession} isCurrent />
                                </Box>
                            </Box>
                        )}

                        {otherSessions.length > 0 && (
                            <Box>
                                <Typography sx={{ mb: 1, fontSize: "0.8125rem", fontWeight: 800, color: "var(--twitter-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    {t("settings.otherSessions")} ({otherSessions.length})
                                </Typography>
                                <Box sx={{ border: "1px solid var(--border-color)", borderRadius: "16px", overflow: "hidden" }}>
                                    {otherSessions.map((entry, index) => (
                                        <LoginHistorySessionRow key={`${entry.loginTime}-${index + 1}`} entry={entry} isCurrent={false} />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Typography sx={{ fontSize: "0.8125rem", color: "var(--twitter-muted)" }}>
                            Sessions automatically expire after 30 days of inactivity.
                        </Typography>
                    </Stack>
                )}
            </Stack>
        );
    };

    const renderActivePanel = () => {
        switch (activeSection) {
            case "theme":
                return renderThemePanel();
            case "language":
                return renderLanguagePanel();
            case "subscription":
                return renderSubscriptionPanel();
            case "loginHistory":
                return renderLoginHistoryPanel();
            default:
                return (
                    <Stack sx={{ alignItems: "center", justifyContent: "center", height: "100%", px: 3, py: 12 }}>
                        <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                            {t("settings.selectSettingHint")}
                        </Typography>
                    </Stack>
                );
        }
    };

    return (
        <main className="x-settings-shell" style={{ minHeight: "100vh", backgroundColor: "var(--background-primary)" }}>
            <style>{`
                .layout:has(.x-settings-shell) {
                    grid-template-columns: 280px minmax(500px, 1fr) minmax(290px, 350px);
                }
            `}</style>

            <Stack direction="row" sx={{ minHeight: "100vh", width: "100%" }}>
                {/* LEFT NAVIGATION COLUMN */}
                <Stack
                    sx={{
                        width: { xs: "100%", md: 360 },
                        flexShrink: 0,
                        borderRight: "1px solid var(--border-color)",
                        display: { xs: activeSection ? "none" : "flex", md: "flex" },
                    }}
                >
                    <Box sx={{ p: 2, pb: 1, borderBottom: "1px solid var(--border-color)" }}>
                        <Typography component="h1" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--twitter-black)", mb: 1.5 }}>
                            {t("settings.title")}
                        </Typography>

                        <TextField
                            placeholder={t("settings.searchSettings")}
                            size="small"
                            fullWidth
                            value={searchQuery}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
                    </Box>

                    <List sx={{ py: 0 }}>
                        <ListSubheader sx={{ fontWeight: 800, fontSize: "0.8125rem", color: "var(--twitter-muted)", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 2.5, backgroundColor: "transparent" }}>
                            Accessibility, Display, and Languages
                        </ListSubheader>
                        {filteredRows.filter((r) => r.key === "theme" || r.key === "language").map(renderRow)}

                        {filteredRows.some((r) => r.key === "subscription") && (
                            <>
                                <ListSubheader sx={{ fontWeight: 800, fontSize: "0.8125rem", color: "var(--twitter-muted)", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 2.5, backgroundColor: "transparent", mt: 1 }}>
                                    X Premium
                                </ListSubheader>
                                {filteredRows.filter((r) => r.key === "subscription").map(renderRow)}
                            </>
                        )}

                        {filteredRows.some((r) => r.key === "loginHistory") && (
                            <>
                                <ListSubheader sx={{ fontWeight: 800, fontSize: "0.8125rem", color: "var(--twitter-muted)", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 2.5, backgroundColor: "transparent", mt: 1 }}>
                                    Security & Account Access
                                </ListSubheader>
                                {filteredRows.filter((r) => r.key === "loginHistory").map(renderRow)}
                            </>
                        )}
                    </List>
                </Stack>

                {/* RIGHT DETAIL PANEL */}
                <Stack
                    sx={{
                        flex: 1,
                        width: "100%",
                        display: { xs: activeSection ? "flex" : "none", md: "flex" },
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: "1px solid var(--border-color)",
                            display: { xs: "flex", md: "none" },
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        <Button
                            onClick={() => setActiveSection(null)}
                            sx={{ minWidth: 0, p: 1, borderRadius: 999, color: "var(--twitter-black)" }}
                        >
                            <FaArrowLeft />
                        </Button>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--twitter-black)" }}>
                            {activeSection ? sectionTitles[activeSection] : ""}
                        </Typography>
                    </Box>

                    {renderActivePanel()}
                </Stack>
            </Stack>

            {/* ACTIVATION MODAL */}
            <Dialog
                open={!!activatedSubscription}
                onClose={() => setActivatedSubscription(null)}
                fullWidth
                maxWidth="xs"
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: "24px",
                            overflow: "hidden",
                            color: "var(--twitter-black)",
                            background: "var(--background-primary)",
                            border: "1px solid var(--border-color)",
                            boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
                        },
                    },
                }}
            >
                <Box sx={{ px: 3, py: 3.5 }}>
                    <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center" }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: "999px",
                                display: "grid",
                                placeItems: "center",
                                background: "#00ba7c",
                                boxShadow: "0 10px 25px rgba(0, 186, 124, 0.3)",
                            }}
                        >
                            <FaCheck size={28} color="#fff" />
                        </Box>

                        <Stack spacing={0.5}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: "var(--twitter-black)" }}>
                                Subscription Activated!
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--twitter-muted)" }}>
                                Your X Premium subscription is now live.
                            </Typography>
                        </Stack>

                        <Stack spacing={1} sx={{ width: "100%", borderRadius: "16px", p: 2, backgroundColor: "var(--hover)" }}>
                            <Typography variant="caption" sx={{ color: "var(--twitter-muted)", fontWeight: 700 }}>
                                PREMIUM PLAN
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1d9bf0" }}>
                                {activatedSubscription?.plan}
                            </Typography>
                        </Stack>

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => setActivatedSubscription(null)}
                            sx={{
                                borderRadius: 999,
                                fontWeight: 800,
                                py: 1.25,
                                textTransform: "none",
                                backgroundColor: "#1d9bf0",
                                "&:hover": { backgroundColor: "#1a8cd8" },
                            }}
                        >
                            Done
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            <Snackbar
                open={paymentToastOpen && Boolean(paymentMessage)}
                autoHideDuration={4000}
                onClose={() => setPaymentToastOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setPaymentToastOpen(false)}
                    severity="info"
                    variant="filled"
                    sx={{ borderRadius: 999, alignItems: "center", backgroundColor: "#1d9bf0" }}
                >
                    {paymentMessage}
                </Alert>
            </Snackbar>
        </main>
    );
}
