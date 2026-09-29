import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";

export async function GET(request: NextRequest) {
    let page = request.nextUrl.searchParams.get("page");
    const limit = "10";

    if (!page) {
        page = "1";
    }

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    let nextPage = parsedPage + 1;

    try {
        const tweets = await prisma.tweet.findMany({
            where: {
                isReply: false,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        isPremium: true,
                        photoUrl: true,
                        description: true,
                    },
                },
                likedBy: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        isPremium: true,
                        photoUrl: true,
                        description: true,
                    },
                },
                retweetedBy: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        isPremium: true,
                        photoUrl: true,
                        description: true,
                    },
                },
                retweetOf: {
                    select: {
                        id: true,
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                isPremium: true,
                                photoUrl: true,
                                description: true,
                            },
                        },
                        authorId: true,
                        createdAt: true,
                        likedBy: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                isPremium: true,
                                photoUrl: true,
                                description: true,
                            },
                        },
                        retweetedBy: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                isPremium: true,
                                photoUrl: true,
                                description: true,
                            },
                        },
                        photoUrl: true,
                        audioUrl: true,
                        text: true,
                        isReply: true,
                        repliedTo: {
                            select: {
                                id: true,
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        isPremium: true,
                                        photoUrl: true,
                                        description: true,
                                    },
                                },
                            },
                        },
                        replies: {
                            select: {
                                authorId: true,
                            },
                        },
                    },
                },
                replies: {
                    select: {
                        id: true,
                    },
                },
                repliedTo: {
                    select: {
                        id: true,
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                isPremium: true,
                                photoUrl: true,
                                description: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                {
                    createdAt: "desc",
                },
            ],
            skip: (parsedPage - 1) * parsedLimit,
            take: parsedLimit,
        });

        const totalTweets = await prisma.tweet.count({ where: { isReply: false } });
        const lastPage = Math.ceil(totalTweets / parsedLimit);

        return NextResponse.json({ success: true, tweets, nextPage, lastPage });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch tweets.";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
