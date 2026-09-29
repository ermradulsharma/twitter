import { NotificationContent, NotificationTypes } from "@/types/NotificationProps";

const HOST_URL = process.env.NEXT_PUBLIC_HOST_URL || "";

const parseJsonResponse = async (response: Response, throwIfUnsuccessful = false) => {
    const text = await response.text();
    let json: any;
    try {
        json = JSON.parse(text);
    } catch {
        json = {
            success: false,
            message: `Server returned invalid response (${response.status})`,
        };
    }
    if (throwIfUnsuccessful && (!response.ok || !json.success)) {
        throw new Error(json.message ? json.message : `Something went wrong (${response.status}).`);
    }
    return json;
};

export const getAllTweets = async (page = "1") => {
    const response = await fetch(`${HOST_URL}/api/tweets/all?page=${page}`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const getRelatedTweets = async () => {
    const response = await fetch(`${HOST_URL}/api/tweets/related`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const getUserTweets = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const getUserLikes = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}/likes`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const getUserMedia = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}/media`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const getUserReplies = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${username}/replies`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const getUserTweet = async (tweetId: string, tweetAuthor: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const createTweet = async (tweet: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: tweet,
    });
    return parseJsonResponse(response, true);
};

export const logIn = async (identifierPayload: string) => {
    const response = await fetch(`${HOST_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: identifierPayload,
    });
    return parseJsonResponse(response);
};

export const verifyLoginOtp = async (username: string, otp: string) => {
    const response = await fetch(`${HOST_URL}/api/auth/login/verify-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, otp }),
    });
    return parseJsonResponse(response);
};

export const logInAsTest = async () => {
    const testAccount = {
        username: "test",
        password: "123456789",
    };
    return await logIn(JSON.stringify(testAccount));
};

export const logout = async () => {
    await fetch(`${HOST_URL}/api/auth/logout`, {
        next: {
            revalidate: 0,
        },
    });
};

export const createUser = async (newUser: string) => {
    const response = await fetch(`${HOST_URL}/api/users/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: newUser,
    });
    return parseJsonResponse(response);
};

export const getUser = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/users/${username}`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const getLoginHistory = async () => {
    const response = await fetch(`${HOST_URL}/api/login-history`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const createSubscriptionOrder = async (plan: "BRONZE" | "SILVER" | "GOLD") => {
    const response = await fetch(`${HOST_URL}/api/subscription/create-order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
    });
    return parseJsonResponse(response, true);
};

export const activateSubscription = async (
    plan: "BRONZE" | "SILVER" | "GOLD",
    payment: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }
) => {
    const response = await fetch(`${HOST_URL}/api/subscription/activate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            plan,
            razorpayPaymentId: payment.razorpayPaymentId,
            razorpayOrderId: payment.razorpayOrderId,
            razorpaySignature: payment.razorpaySignature,
        }),
    });
    return parseJsonResponse(response, true);
};

export const editUser = async (updatedUser: string, username: string) => {
    const response = await fetch(`${HOST_URL}/api/users/${username}/edit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: updatedUser,
    });
    return parseJsonResponse(response);
};

export const requestLanguageOtp = async (language: string) => {
    const response = await fetch("/api/language/request-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ language }),
    });
    return parseJsonResponse(response);
};

export const verifyLanguageOtp = async (language: string, otp: string) => {
    const response = await fetch(`${HOST_URL}/api/language/verify-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ language, otp }),
    });
    return parseJsonResponse(response);
};

export const requestAudioOtp = async () => {
    const response = await fetch(`${HOST_URL}/api/tweets/audio/request-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    return parseJsonResponse(response);
};

export const verifyAudioOtp = async (otp: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/audio/verify-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
    });
    return parseJsonResponse(response);
};

export const forgotPassword = async (
    payload: {
        action: "request" | "verify" | "reset";
        identifier: string;
        otp?: string;
        newPassword?: string;
        resetToken?: string;
        userId?: string;
        resend?: boolean;
    }
) => {
    const response = await fetch(`${HOST_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    return parseJsonResponse(response);
};

export const updateTweetLikes = async (tweetId: string, tweetAuthor: string, tokenOwnerId: string, isLiked: boolean) => {
    const route = isLiked ? "unlike" : "like";
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: tokenOwnerId,
    });
    return parseJsonResponse(response, true);
};

export const updateRetweets = async (tweetId: string, tweetAuthor: string, tokenOwnerId: string, isRetweeted: boolean) => {
    const route = isRetweeted ? "unretweet" : "retweet";
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: tokenOwnerId,
    });
    return parseJsonResponse(response, true);
};

export const updateUserFollows = async (followedUsername: string, tokenOwnerId: string, isFollowed: boolean) => {
    const route = isFollowed ? "unfollow" : "follow";
    const response = await fetch(`${HOST_URL}/api/users/${followedUsername}/${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: tokenOwnerId,
    });
    return parseJsonResponse(response, true);
};

export const deleteTweet = async (tweetId: string, tweetAuthor: string, tokenOwnerId: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/delete`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "x-token-owner-id": tokenOwnerId,
        },
    });
    return parseJsonResponse(response, true);
};

export const createReply = async (reply: string, tweetAuthor: string, tweetId: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/reply`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: reply,
    });
    return parseJsonResponse(response, true);
};

export const getReplies = async (tweetAuthor: string, tweetId: string) => {
    const response = await fetch(`${HOST_URL}/api/tweets/${tweetAuthor}/${tweetId}/reply`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const search = async (text: string) => {
    const response = await fetch(`${HOST_URL}/api/search?q=${text}`);
    return parseJsonResponse(response);
};

export const getRandomThreeUsers = async () => {
    const response = await fetch(`${HOST_URL}/api/users/random`);
    return parseJsonResponse(response, true);
};

export const createMessage = async (message: string) => {
    const response = await fetch(`${HOST_URL}/api/messages/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: message,
    });
    return parseJsonResponse(response, true);
};

export const getUserMessages = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/messages/${username}`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const checkUserExists = async (username: string) => {
    const response = await fetch(`${HOST_URL}/api/users/exists?q=${username}`);
    return parseJsonResponse(response);
};

export const deleteConversation = async (participants: string[], tokenOwnerId: string) => {
    const response = await fetch(`${HOST_URL}/api/messages/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ participants, tokenOwnerId }),
    });
    return parseJsonResponse(response, true);
};

export const getNotifications = async () => {
    const response = await fetch(`${HOST_URL}/api/notifications`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};

export const createNotification = async (
    recipient: string,
    type: NotificationTypes,
    secret: string,
    notificationContent: NotificationContent = null
) => {
    const response = await fetch(`${HOST_URL}/api/notifications/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientId: recipient, type, secret, notificationContent }),
    });
    return parseJsonResponse(response, true);
};

export const markNotificationsRead = async () => {
    const response = await fetch(`${HOST_URL}/api/notifications/read`, {
        next: {
            revalidate: 0,
        },
    });
    return parseJsonResponse(response, true);
};
