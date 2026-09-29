import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seeding...");

    const hashedPassword = await bcrypt.hash("Password123!", 10);

    const demoUser = await prisma.user.upsert({
        where: { username: "demouser" },
        update: {},
        create: {
            username: "demouser",
            name: "Demo User",
            email: "demo@twitterx.com",
            password: hashedPassword,
            description: "Official demo user account for TwitterX.",
            subscriptionPlan: "GOLD",
            isPremium: true,
        },
    });

    const testUser = await prisma.user.upsert({
        where: { username: "testuser" },
        update: {},
        create: {
            username: "testuser",
            name: "Test User",
            email: "test@twitterx.com",
            password: hashedPassword,
            description: "Testing features on TwitterX.",
            subscriptionPlan: "FREE",
            isPremium: false,
        },
    });

    console.log(`Created users: ${demoUser.username}, ${testUser.username}`);

    const sampleTweet = await prisma.tweet.create({
        data: {
            text: "Hello TwitterX! 🚀 Excited to share this awesome platform built with Next.js 14 and Prisma.",
            authorId: demoUser.id,
        },
    });

    console.log(`Created sample tweet ID: ${sampleTweet.id}`);
    console.log("Seeding completed successfully.");
}

main()
    .catch((e) => {
        console.error("Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
