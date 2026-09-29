import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createUserToken, SECURE_COOKIE_OPTIONS } from "@/utilities/auth/jwt";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const body = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken = token ? ((await verifyJwtToken(token, request.nextUrl.origin)) as unknown as UserProps) : null;

    if (!verifiedToken || verifiedToken.username !== username) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." }, { status: 401 });
    }

    // Whitelist only editable profile fields to prevent Mass Assignment attack
    const { name, description, location, website, photoUrl, headerUrl } = body;
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (headerUrl !== undefined) updateData.headerUrl = headerUrl;

    try {
        const user = await prisma.user.update({
            where: {
                username: username,
            },
            data: updateData,
        });

        const newToken = await createUserToken(user);

        const response = NextResponse.json({
            success: true,
        });
        response.cookies.set({
            ...SECURE_COOKIE_OPTIONS,
            value: newToken,
        });

        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to edit user.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}