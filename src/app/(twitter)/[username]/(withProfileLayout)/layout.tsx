"use client";

import { useQuery } from "@tanstack/react-query";

import NotFound from "@/app/not-found";
import Profile from "@/components/user/Profile";
import CircularLoading from "@/components/misc/CircularLoading";
import { getUser } from "@/utilities/fetch";

import { use } from "react";

export default function ProfileLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ username: string }>;
}) {
    const { username } = use(params);
    const { isLoading, isFetched, data } = useQuery({
        queryKey: ["users", username],
        queryFn: () => getUser(username),
    });

    if (isLoading) return <CircularLoading />;

    if (isFetched && !data.user) return NotFound();

    return (
        <div className="profile-layout">
            {isFetched && <Profile profile={data.user} />}
            {children}
        </div>
    );
}
