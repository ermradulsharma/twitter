"use client";

import { use, useContext } from "react";

import { AuthContext } from "@/context/AuthContext";
import CircularLoading from "@/components/misc/CircularLoading";
import EditProfile from "@/components/user/EditProfile";
import BackToArrow from "@/components/misc/BackToArrow";

export default function EditPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const { token, isPending, refreshToken } = useContext(AuthContext);

    if (isPending) return <CircularLoading />;

    if (!token) throw new Error("You must be logged in to view this page");
    if (username !== token.username) throw new Error("You are not authorized to view this page");

    return (
        <main className="x-edit-profile-container">
            <EditProfile profile={token} refreshToken={refreshToken} />
        </main>
    );
}
