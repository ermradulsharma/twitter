import { NextResponse, NextRequest } from "next/server";

import { prisma } from "@/prisma/client";
import { comparePasswords } from "@/utilities/bcrypt";
import { createUserToken } from "@/utilities/auth/jwt";
import { saveLoginOtp } from "@/utilities/auth/login-otp";
import { sendEmail } from "@/utilities/email/sendEmail";
import { getLoginContext } from "@/utilities/auth/shared";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const identifier = body.identifier ?? body.username;
    const password = body.password;

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ username: identifier }, { email: identifier }],
            },
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "Username or password is not correct.",
            });
        }

        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({
                success: false,
                message: "Username or password is not correct.",
            });
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
            name: "token",
            value: token,
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
        });

        return response;

    } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json({
        success: false,
        message: "Login failed.",
    });
}
}
