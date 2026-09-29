import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { verifyJwtToken } from "@/utilities/auth";
import { VerifiedToken } from "@/types/TokenProps";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ success: false, user: null }, { status: 401 });
        }

        const verifiedToken = (await verifyJwtToken(token, request.nextUrl.origin)) as unknown as VerifiedToken;

        if (!verifiedToken) {
            return NextResponse.json({ success: false, user: null }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            user: verifiedToken,
        });
    } catch (error) {
        return NextResponse.json({ success: false, user: null }, { status: 500 });
    }
}
