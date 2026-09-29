import crypto from "crypto";

type PendingLoginOtp = {
    otp: string;
    userId: string;
    expiresAt: number;
    browser: string;
    operatingSystem: string;
    deviceType: string;
    ipAddress: string;
    attempts: number;
};

const OTP_TTL_MS = 5 * 60 * 1000;

const globalForLoginOtp = globalThis as typeof globalThis & {
    loginOtpStore?: Map<string, PendingLoginOtp>;
};

const loginOtpStore = globalForLoginOtp.loginOtpStore ?? new Map<string, PendingLoginOtp>();
globalForLoginOtp.loginOtpStore = loginOtpStore;

export const generateLoginOtp = () => crypto.randomInt(100000, 1000000).toString();

export const saveLoginOtp = (payload: {
    userId: string;
    browser: string;
    operatingSystem: string;
    deviceType: string;
    ipAddress: string;
}) => {
    const otp = generateLoginOtp();
    loginOtpStore.set(payload.userId, {
        otp,
        userId: payload.userId,
        expiresAt: Date.now() + OTP_TTL_MS,
        browser: payload.browser,
        operatingSystem: payload.operatingSystem,
        deviceType: payload.deviceType,
        ipAddress: payload.ipAddress,
        attempts: 0,
    });

    return { otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
};

export const verifyLoginOtp = (userId: string, otp: string) => {
    const pending = loginOtpStore.get(userId);
    if (!pending) return { success: false, message: "No pending verification was found." };
    if (pending.expiresAt < Date.now()) {
        loginOtpStore.delete(userId);
        return { success: false, message: "The OTP has expired. Please request a new one." };
    }
    if (pending.attempts >= 5) {
        loginOtpStore.delete(userId);
        return { success: false, message: "Maximum verification attempts exceeded. Please request a new OTP." };
    }
    if (pending.otp !== otp) {
        pending.attempts += 1;
        if (pending.attempts >= 5) {
            loginOtpStore.delete(userId);
            return { success: false, message: "Maximum verification attempts exceeded. Please request a new OTP." };
        }
        return { success: false, message: `Incorrect OTP. ${5 - pending.attempts} attempts remaining.` };
    }

    loginOtpStore.delete(userId);
    return { success: true as const, pending };
};

export type VerifiedLoginOtp = {
    userId: string;
    browser: string;
    operatingSystem: string;
    deviceType: string;
    ipAddress: string;
};
