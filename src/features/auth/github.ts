import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { db } from "../../db";
import { auditLogs, users } from "../../db/schema";

export const githubAuth = {
    loginWithGithub: (c: Context) => {
        const client_id = process.env.GITHUB_CLIENT_ID;
        const redirect_uri = process.env.GITHUB_CALLBACK_URL;

        if (!client_id) {
            return c.text("GitHub Client ID not configured", 500);
        }

        const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=read:user user:email`;
        return c.redirect(url);
    },

    githubCallback: async (c: Context) => {
        const code = c.req.query("code");
        if (!code) {
            return c.text("Missing code parameter", 400);
        }

        const client_id = process.env.GITHUB_CLIENT_ID;
        const client_secret = process.env.GITHUB_CLIENT_SECRET;

        try {
            // 1. Exchange Code for Access Token
            const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ client_id, client_secret, code }),
            });

            const tokenData = await tokenResponse.json();
            // biome-ignore lint/suspicious/noExplicitAny: External API response
            if ((tokenData as any).error || !(tokenData as any).access_token) {
                return c.text("Failed to get access token from GitHub", 400);
            }

            // biome-ignore lint/suspicious/noExplicitAny: External API response
            const accessToken = (tokenData as any).access_token;

            // 2. Fetch User Profile
            const userResponse = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "User-Agent": "Bun-API-Manager",
                },
            });
            // biome-ignore lint/suspicious/noExplicitAny: External API response
            const userData = await userResponse.json() as any;

            // 3. Fetch User Email (Primary if private)
            let email = userData.email;
            if (!email) {
                const emailsResponse = await fetch("https://api.github.com/user/emails", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "User-Agent": "Bun-API-Manager",
                    },
                });
                // biome-ignore lint/suspicious/noExplicitAny: External API response
                const emails = await emailsResponse.json() as any[];
                // biome-ignore lint/suspicious/noExplicitAny: External API response
                const primaryEmail = emails.find((e: any) => e.primary && e.verified);
                if (primaryEmail) email = primaryEmail.email;
            }

            if (!email) {
                return c.text("GitHub account must have a verified email", 400);
            }

            const githubId = String(userData.id);
            const avatarUrl = userData.avatar_url || null;

            // 4. Check DB for User
            // Try by github_id first
            let user = await db.query.users.findFirst({
                where: eq(users.github_id, githubId),
            });

            // If not found by ID, try email (Link account)
            if (!user) {
                user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (user) {
                    // Update github_id and avatar for existing user
                    await db.update(users).set({ github_id: githubId, avatar: avatarUrl }).where(eq(users.id, user.id));
                } else {
                    // Create NEW User
                    let finalUsername = userData.login;
                    // Check for username collision
                    const existingUsername = await db.query.users.findFirst({
                        where: eq(users.username, finalUsername),
                    });

                    if (existingUsername) {
                         finalUsername = `${finalUsername}${Math.floor(Math.random() * 10000)}`;
                    }

                    const _insertResult = await db.insert(users).values({
                        email: email,
                        name: userData.name || userData.login,
                        username: finalUsername,
                        github_id: githubId,
                        avatar: avatarUrl,
                        role: "user", // Default role
                        status: "active",
                        password: "", // No password
                    });

                    // Fetch the newly created user
                    user = await db.query.users.findFirst({
                        where: eq(users.email, email),
                    });

                    if (user) {
                        // Log registration
                        await db.insert(auditLogs).values({
                            action: "USER_REGISTER_GITHUB",
                            actor_id: user.id,
                            target_id: user.id,
                            details: `Registered via GitHub: ${userData.login}`,
                            ip_address: c.req.header("cf-connecting-ip") || "127.0.0.1",
                        });
                    }
                }
            }

            if (!user || user.status !== "active") {
                return c.text("Account is inactive or creation failed", 403);
            }

            // 5. Generate Session (JWT)
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                name: user.name,
                username: user.username,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
            };

            // biome-ignore lint/style/noNonNullAssertion: Env var checked elsewhere or standard
            const jwt = await sign(payload, process.env.JWT_SECRET!);
            setCookie(c, "token", jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                path: "/",
                maxAge: 60 * 60 * 24,
            });

            return c.redirect("/dashboard");
        } catch (error) {
            console.error("GitHub Auth Error:", error);
            return c.text("Internal Server Error during GitHub Auth", 500);
        }
    },
};
