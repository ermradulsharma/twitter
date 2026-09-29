import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createUserToken, SECURE_COOKIE_OPTIONS } from "@/utilities/auth/jwt";
import { verifyLoginOtp } from "@/utilities/auth/login-otp";
import { getClientIpAddress } from "@/utilities/auth/shared";

export async function POST(request: NextRequest) {
    const { username, otp } = await request.json();

    if (!username) {
        return NextResponse.json({ success: false, message: "Username is required." }, { status: 400 });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
        return NextResponse.json({ success: false, message: "Enter the 6-digit OTP." }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }

        const verification = verifyLoginOtp(user.id, otp);
        if (!verification.success || !verification.pending) {
            return NextResponse.json(verification, { status: 400 });
        }

        const pendingLogin = verification.pending;
        const ipAddress = getClientIpAddress(
            request.headers.get("x-forwarded-for") || "",
            request.headers.get("x-real-ip") || "",
            (request as any).ip
        );

        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                browser: pendingLogin.browser,
                operatingSystem: pendingLogin.operatingSystem,
                deviceType: pendingLogin.deviceType,
                ipAddress,
                loginTime: new Date(),
            },
        });

        const token = await createUserToken(user);
        const response = NextResponse.json({ success: true });
        response.cookies.set({
            ...SECURE_COOKIE_OPTIONS,
            value: token,
        });

        return response;
    } catch (error: unknown) {
        return NextResponse.json({ success: false, message: "OTP verification failed." }, { status: 500 });
    }
}

