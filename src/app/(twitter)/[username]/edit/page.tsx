"use client";

import { use, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

import { AuthContext } from "@/context/AuthContext";
import CircularLoading from "@/components/misc/CircularLoading";
import EditProfile from "@/components/user/EditProfile";
import { getUser } from "@/utilities/fetch";
import NotFound from "@/app/not-found";

export default function EditPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const { token, isPending, refreshToken } = useContext(AuthContext);

    const { isLoading, isFetched, data } = useQuery({
        queryKey: ["users", username],
        queryFn: () => getUser(username),
    });

    if (isPending || isLoading) return <CircularLoading />;

    if (!token) throw new Error("You must be logged in to view this page");
    if (username !== token.username) throw new Error("You are not authorized to view this page");
    if (isFetched && !data?.user) return NotFound();

    const profileData = data?.user || token;

    return (
        <main className="x-edit-profile-container">
            <EditProfile profile={profileData} refreshToken={refreshToken} />
        </main>
    );
}
