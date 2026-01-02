console.log("Starting server...");

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { getCookie } from "hono/cookie";
import { rateLimiter } from "hono-rate-limiter";
import { db } from "./db";
import { users } from "./db/schema";
import { adminRoutes } from "./features/admin";
import { authRoutes } from "./features/auth";
import { userRoutes } from "./features/user";
import { apiKeyMiddleware, authMiddleware, loggerMiddleware, validateApiKeyString } from "./middleware";

const app = new Hono<{ Variables: { user_id: number; jwtPayload: unknown } }>();

app.use("*", loggerMiddleware);

// Global Rate Limiter: 100 requests per minute
app.use(
    "*",
    rateLimiter({
        windowMs: 60 * 1000, // 1 minute
        limit: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
        keyGenerator: (c) => c.req.header("x-forwarded-for") || "unknown", // Identify by IP
    })
);

// Serve static files (Tailwind CSS)
app.use("/static/*", serveStatic({ root: "./src" }));

// Health Check (For Docker/K8s)
app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

// Specific Route for Validation (Must BEFORE generic middleware)
app.get("/api/v1/validate", async (c) => {
    const apiKey = c.req.header("X-API-KEY");

    if (!apiKey) {
        return c.json({ valid: false, error: "Missing API Key" });
    }

    const result = await validateApiKeyString(apiKey);

    if (!result.valid) {
        return c.json({ valid: false, error: result.error });
    }

    return c.json({
        valid: true,
        user_id: result.user_id,
        role: result.role,
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/v1/users/:id", async (c) => {
    const apiKey = c.req.header("X-API-KEY");
    if (!apiKey) return c.json({ error: "Missing API Key" }, 401);

    const auth = await validateApiKeyString(apiKey);
    if (!auth.valid) return c.json({ error: auth.error }, 401);

    const targetId = parseInt(c.req.param("id"), 10);

    const isAdmin = auth.role === "admin";
    const isSelf = auth.user_id === targetId;

    if (!isAdmin && !isSelf) {
        return c.json({ error: "Unauthorized: Access denied to this user ID" }, 403);
    }

    const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetId),
        columns: {
            id: true,
            email: true,
            name: true,
            username: true,
            status: true,
            role: true,
        },
    });

    if (!targetUser) return c.json({ error: "User not found" }, 404);

    return c.json({
        success: true,
        data: targetUser,
    });
});
// Returning placeholder to ensure file is safe while I add imports.
// Actually, I should just Add Imports FIRST.
// But I am already committed to this tool call.
// I will implement the logic assuming imports exist, and then immediately add imports.

// API Service Route (Mocking the actual service that uses the keys)
// This will still use standard middleware which returns 401 on error
app.use("/api/v1/*", apiKeyMiddleware);
app.get("/api/v1/resource", (c) => {
    return c.json({ message: "Access Granted", user_id: c.get("user_id") });
});

// Public Routes
app.route("/", authRoutes);

// Protected Routes
app.use("/admin/*", authMiddleware);
app.route("/admin", adminRoutes);

app.use("/dashboard/*", authMiddleware); // User dashboard base
app.use("/keys/*", authMiddleware); // API Key management
app.use("/profile*", authMiddleware); // Profile management
app.route("/", userRoutes); // User routes mounted at root for convenience or scoped

// Root Redirect
app.get("/", (c) => {
    const token = getCookie(c, "token");
    if (token) return c.redirect("/dashboard");
    return c.redirect("/login");
});

export default {
    port: parseInt(process.env.PORT || "8080", 10),
    hostname: process.env.HOST || "localhost",
    fetch: app.fetch,
};
