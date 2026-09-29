"use client";

import { useQuery } from "@tanstack/react-query";

import Tweets from "@/components/tweet/Tweets";
import { getUserReplies } from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import NotFound from "@/app/not-found";
import NothingToShow from "@/components/misc/NothingToShow";

import { use } from "react";

export default function RepliesPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const { isLoading, data } = useQuery({
        queryKey: ["tweets", username, "replies"],
        queryFn: () => getUserReplies(username),
    });

    if (!isLoading && !data.tweets) return NotFound();

    if (data && data.tweets.length === 0) return <NothingToShow />;

    return <>{isLoading ? <CircularLoading /> : <Tweets tweets={data.tweets} />}</>;
}
