import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { createMiddleware } from "hono/factory";
import { authRoutes } from "./features/auth";
import { adminRoutes } from "./features/admin";
import { userRoutes } from "./features/user";
import { Layout } from "./components/Layout";
import { authMiddleware, apiKeyMiddleware, loggerMiddleware } from "./middleware";
import { getCookie } from "hono/cookie";

const app = new Hono<{ Variables: { user_id: number; jwtPayload: any } }>();

app.use("*", loggerMiddleware);

// Serve static files (Tailwind CSS)
app.use("/static/*", serveStatic({ root: "./src" }));

// API Service Route (Mocking the actual service that uses the keys)
app.use("/api/v1/*", apiKeyMiddleware);
app.get("/api/v1/resource", (c) => {
    return c.json({ message: "Access Granted", user_id: c.get("user_id") });
});

app.get("/api/v1/validate", (c) => {
    // If this handler is reached, it means apiKeyMiddleware has already successfully validated the key.
    return c.json({ 
        valid: true, 
        user_id: c.get("user_id"),
        timestamp: new Date().toISOString()
    });
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
