import React from "react";
import Cookies from "universal-cookie";

import { verifyJwtToken } from "@/utilities/auth";
import { VerifiedToken } from "@/types/TokenProps";

const decodeClientJwt = (token: string): VerifiedToken => {
    try {
        const payloadBase64 = token.split(".")[1];
        if (!payloadBase64) return null;
        const decodedJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(decodedJson) as VerifiedToken;
    } catch {
        return null;
    }
};

const fromServer = async () => {
    const { cookies } = require("next/headers");
    const cookieList = await cookies();
    const token = cookieList.get("token")?.value ?? null;
    const verifiedToken = token ? await verifyJwtToken(token) : null;
    return verifiedToken;
};

export default function useAuth() {
    const [token, setToken] = React.useState<VerifiedToken>(null);
    const [isPending, setIsPending] = React.useState<boolean>(true);

    const getVerifiedToken = React.useCallback(async () => {
        setIsPending(true);
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            const data = await res.json();
            if (data.success && data.user) {
                setToken(data.user);
            } else {
                setToken(null);
            }
        } catch {
            setToken(null);
        } finally {
            setIsPending(false);
        }
    }, []);

    const refreshToken = React.useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            const data = await res.json();
            if (data.success && data.user) {
                setToken(data.user);
            } else {
                setToken(null);
            }
        } catch {
            setToken(null);
        }
    }, []);

    React.useEffect(() => {
        getVerifiedToken();
    }, [getVerifiedToken]);

    return { token, isPending, refreshToken };
}

useAuth.fromServer = fromServer;

// Custom hook for authorization which works with server (fromServer) and client side
