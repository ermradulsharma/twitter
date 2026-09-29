import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { comparePasswords, hashPassword } from "@/utilities/bcrypt";
import { sendEmail } from "@/utilities/email/sendEmail";
import {
    consumeForgotPasswordToken,
    getForgotPasswordPending,
    saveForgotPasswordOtp,
    verifyForgotPasswordOtp,
} from "@/utilities/auth/forgot-password-otp";

const normalizeIdentifier = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isSameCalendarDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

import crypto from "crypto";

const makePassword = (length = 14) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
    const randomBytes = crypto.randomBytes(length);
    let password = "";

    for (let index = 0; index < length; index += 1) {
        password += chars.charAt(randomBytes[index] % chars.length);
    }

    return password;
};

import { checkRateLimit } from "@/utilities/security/rateLimit";

export async function POST(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const realIp = request.headers.get("x-real-ip") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || realIp || "localhost";

    const rateLimit = checkRateLimit(`forgot_${ip}`, 5, 60 * 1000);
    if (!rateLimit.success) {
        return NextResponse.json(
            { success: false, message: "Too many password reset requests. Please try again after 1 minute." },
            { status: 429 }
        );
    }

    const body = await request.json();
    const action = normalizeIdentifier(body.action);
    const identifier = normalizeIdentifier(body.identifier);
    const otp = normalizeIdentifier(body.otp);
    const newPassword = normalizeIdentifier(body.newPassword);
    const resetToken = normalizeIdentifier(body.resetToken);
    const resend = Boolean(body.resend);

    if (!identifier) {
        return NextResponse.json({ success: false, message: "Email or phone is required." }, { status: 400 });
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { phone: identifier }],
            },
        });

        if (action === "request") {
            // Neutral response if user doesn't exist to prevent User Enumeration Attack
            if (!user) {
                return NextResponse.json({
                    success: true,
                    requiresOtp: true,
                    message: "If an account exists with this credential, a verification code has been sent.",
                });
            }

            const isDevelopment = process.env.NODE_ENV === "development";
            const deliveryMethod = identifier.includes("@") ? "email" : "phone";
            const demoOtp = isDevelopment && deliveryMethod === "phone" ? "123456" : undefined;

            if (!resend) {
                if (user.lastPasswordResetAt && isSameCalendarDay(user.lastPasswordResetAt, new Date())) {
                    return NextResponse.json({ success: false, message: "You can use this option only one time per day." });
                }
            }

            if (!user.email && !user.phone) {
                return NextResponse.json({ success: false, message: "No registered email or phone was found for this account." });
            }

            const { otp: resetOtp, expiresAt } = saveForgotPasswordOtp(identifier, user.id, { otp: demoOtp });

            const destination = deliveryMethod === "phone" ? user.phone : user.email;
            if (!destination) {
                return NextResponse.json({ success: false, message: "No registered destination was found for this account." });
            }

            if (deliveryMethod === "email") {
                await sendEmail({
                    to: destination,
                    subject: "Twitter Clone - Password Reset OTP",
                    html: `
                        <h2>Twitter Clone</h2>
                        <h3>Password Reset Verification</h3>
                        <p>Your 6-digit OTP is:</p>
                        <h1>${resetOtp}</h1>
                        <p>This OTP expires according to the existing verification flow.</p>
                    `,
                });
            }

            return NextResponse.json({
                success: true,
                requiresOtp: true,
                deliveryMethod,
                destination,
                simulatedOtp: isDevelopment ? resetOtp : undefined,
                message:
                    deliveryMethod === "phone"
                        ? "A verification code has been sent to your registered phone number."
                        : "A verification code has been sent to your registered email.",
                expiresAt,
            });
        }

        if (action === "verify") {
            if (!otp || !/^\d{6}$/.test(otp)) {
                return NextResponse.json({ success: false, message: "Enter the 6-digit OTP." });
            }

            const verification = verifyForgotPasswordOtp(identifier, otp);
            if (!verification.success || !verification.pending) {
                return NextResponse.json(verification);
            }

            return NextResponse.json({
                success: true,
                resetToken: verification.pending.resetToken,
                userId: verification.pending.userId,
            });
        }

        if (action === "reset") {
            const pending = getForgotPasswordPending(identifier);

            if (!resetToken) {
                return NextResponse.json({ success: false, message: "Reset session is invalid." });
            }
            if (!newPassword) {
                return NextResponse.json({ success: false, message: "New password is required." });
            }
            if (!pending) {
                return NextResponse.json({ success: false, message: "Reset session is invalid." });
            }

            const tokenCheck = consumeForgotPasswordToken(identifier, resetToken);
            if (!tokenCheck.success) {
                return NextResponse.json(tokenCheck);
            }

            const hashedPassword = await hashPassword(newPassword);

            await prisma.user.update({
                where: {
                    id: pending.userId,
                },
                data: {
                    password: hashedPassword,
                    lastPasswordResetAt: new Date(),
                },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "Invalid request." });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        return NextResponse.json({ success: false, message });
    }
}
