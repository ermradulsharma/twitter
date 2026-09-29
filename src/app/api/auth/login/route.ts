import { NextResponse, NextRequest } from "next/server";

import { prisma } from "@/prisma/client";
import { comparePasswords } from "@/utilities/bcrypt";
import { createUserToken, SECURE_COOKIE_OPTIONS } from "@/utilities/auth/jwt";
import { getLoginContext } from "@/utilities/auth/shared";

export async function POST(request: NextRequest) {
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

