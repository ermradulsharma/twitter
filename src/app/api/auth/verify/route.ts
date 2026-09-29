import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { getJwtSecretKey } from "@/utilities/auth";

export async function POST(request: NextRequest) {
    try {
        const token = await request.json();
        if (typeof token !== "string" || !token.trim()) {
            return NextResponse.json({ valid: false, message: "Token is required." }, { status: 400 });
        }

        const { payload } = await jwtVerify(token, getJwtSecretKey());
        return NextResponse.json({ valid: true, payload });
    } catch (error) {
        return NextResponse.json({ valid: false, message: "Invalid or expired token." }, { status: 401 });
    }
}

