import { eq, sql } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { db } from "./db";
import { apiKeys, auditLogs, users } from "./db/schema";

export const loggerMiddleware = createMiddleware(async (c, next) => {
    const start = Date.now();
    await next();
    const end = Date.now();
    const time = end - start;
    console.log(`[${c.req.method}] ${c.req.url} - ${c.res.status} (${time}ms)`);
});

export const authMiddleware = createMiddleware(async (c, next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "") || getCookie(c, "token"); // Support cookie for UI

    if (!token) {
        // If no token, check if it's a browser request, maybe redirect
        if (c.req.header("accept")?.includes("text/html")) {
            return c.redirect("/login");
        }
        return c.json({ error: "Unauthorized" }, 401);
    }

    try {
        // biome-ignore lint/style/noNonNullAssertion: Enforced by env check
        const payload = await verify(token, process.env.JWT_SECRET!);
        c.set("jwtPayload", payload);
        await next();
    } catch (_e) {
        if (c.req.header("accept")?.includes("text/html")) {
            return c.redirect("/login");
        }
        return c.json({ error: "Invalid Token" }, 401);
    }
});

// Helper to hash key (simple sha256)
export async function hashKey(key: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Shared validation logic
export async function validateApiKeyString(apiKey: string) {
    const hashed = await hashKey(apiKey);

    // Check key existence and status
    const keyRecord = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.key_hash, hashed),
    });

    if (!keyRecord) {
        return { valid: false, error: "Invalid API Key" };
    }

    // Check if expired
    if (keyRecord.expires_at && new Date() > keyRecord.expires_at) {
        return { valid: false, error: "API Key Expired" };
    }

    // Check if key is active
    if (keyRecord.status !== "active") {
        return { valid: false, error: "API Key Revoked" };
    }

    // CRITICAL: Check User Status
    const user = await db.query.users.findFirst({
        where: eq(users.id, keyRecord.user_id),
        columns: { id: true, status: true, role: true },
    });

    if (!user || user.status !== "active") {
        return { valid: false, error: "User Inactive - API Access Denied" };
    }

    // Update last used and hit count (Side effect)
    await db
        .update(apiKeys)
        .set({
            last_used_at: new Date(),
            total_hits: sql`${apiKeys.total_hits} + 1`,
        })
        .where(eq(apiKeys.id, keyRecord.id));

    return { valid: true, user_id: keyRecord.user_id, role: user.role, key_record: keyRecord };
}

export const apiKeyMiddleware = createMiddleware(async (c, next) => {
    const apiKey = c.req.header("X-API-KEY");

    if (!apiKey) {
        return c.json({ error: "Missing API Key" }, 401);
    }

    const result = await validateApiKeyString(apiKey);

    if (!result.valid) {
        return c.json({ error: result.error }, 401);
    }

    // Log access
    console.log(`API Access: KeyID=${result.key_record?.id} UserID=${result.user_id}`);

    c.set("user_id", result.user_id);
    await next();
});

export const auditLog = async (action: string, actorId: number, targetId: number | null, details: string) => {
    await db.insert(auditLogs).values({
        action,
        actor_id: actorId,
        target_id: targetId,
        details,
        ip_address: "127.0.0.1", // Simplified
    });
};
