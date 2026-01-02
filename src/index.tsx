import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { createMiddleware } from "hono/factory";
import { authRoutes } from "./features/auth";
import { adminRoutes } from "./features/admin";
import { userRoutes } from "./features/user";
import { Layout } from "./components/Layout";
import { authMiddleware, apiKeyMiddleware, loggerMiddleware, validateApiKeyString } from "./middleware";
import { getCookie } from "hono/cookie";

const app = new Hono<{ Variables: { user_id: number; jwtPayload: any } }>();

app.use("*", loggerMiddleware);

// Serve static files (Tailwind CSS)
app.use("/static/*", serveStatic({ root: "./src" }));

// Health Check (For Docker/K8s)
app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

// Helper for special Validation Endpoint (Bypasses standard middleware to return always json)

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
        timestamp: new Date().toISOString()
    });
});

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
    port: parseInt(process.env.PORT || "8080"), 
    hostname: process.env.HOST || "localhost",
    fetch: app.fetch 
};
