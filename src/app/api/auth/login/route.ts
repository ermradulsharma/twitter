import { NextResponse, NextRequest } from "next/server";

import { prisma } from "@/prisma/client";
import { comparePasswords } from "@/utilities/bcrypt";
import { createUserToken, SECURE_COOKIE_OPTIONS } from "@/utilities/auth/jwt";
import { getLoginContext } from "@/utilities/auth/shared";
import { checkRateLimit } from "@/utilities/security/rateLimit";

export async function POST(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const realIp = request.headers.get("x-real-ip") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || realIp || "localhost";

    const rateLimit = checkRateLimit(`login_${ip}`, 10, 60 * 1000);
    if (!rateLimit.success) {
        return NextResponse.json(
            { success: false, message: "Too many login attempts. Please try again after 1 minute." },
            { status: 429 }
        );
    }

    const body = await request.json();
    const identifier = body.identifier ?? body.username;
    const password = body.password;

    if (!identifier || !password) {
        return NextResponse.json({
            success: false,
            message: "Username/email and password are required.",
        }, { status: 400 });
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ username: identifier }, { email: identifier }],
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Username or password is not correct.",
                },
                { status: 401 }
            );
        }

        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Username or password is not correct.",
                },
                { status: 401 }
            );
        }

        const { browser, operatingSystem, deviceType, ipAddress } = getLoginContext(
            request.headers.get("user-agent") || "",
            request.headers.get("x-forwarded-for") || "",
            request.headers.get("x-real-ip") || "",
            (request as any).ip
        );

        const token = await createUserToken(user);

        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                browser,
                operatingSystem,
                deviceType,
                ipAddress,
                loginTime: new Date(),
            },
        });

        const response = NextResponse.json({
            success: true,
        });

        response.cookies.set({
            ...SECURE_COOKIE_OPTIONS,
            value: token,
        });

        return response;

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Login failed.",
            },
            { status: 500 }
        );
    }
}

