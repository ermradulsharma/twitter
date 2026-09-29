import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

export async function getAuthenticatedUser(request: NextRequest): Promise<UserProps | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return null;
        const payload = await verifyJwtToken(token, request.nextUrl.origin);
        return payload ? (payload as unknown as UserProps) : null;
    } catch {
        return null;
    }
}
