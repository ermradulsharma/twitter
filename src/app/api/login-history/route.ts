import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { VerifiedToken } from "@/types/TokenProps";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as VerifiedToken) : null;

        if (!verifiedToken) {
            return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
        }

        const loginHistory = await prisma.loginHistory.findMany({
            where: {
                userId: verifiedToken.id,
            },
            orderBy: {
                loginTime: "desc",
            },
            select: {
                browser: true,
                operatingSystem: true,
                deviceType: true,
                ipAddress: true,
                loginTime: true,
            },
        });

        return NextResponse.json({ success: true, loginHistory });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch login history.";
        return NextResponse.json({ success: false, message });
    }
}
