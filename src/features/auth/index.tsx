import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema } from "../../lib/zod-schema";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import { Layout } from "../../components/Layout";
import { Card, Input, Button } from "../../components/UI";
import { githubAuth } from "./github";

const app = new Hono();

app.get("/login", (c) => {
    const error = c.req.query("error");
    return c.html(
        <Layout title="Login">
            <div class="flex items-center justify-center min-h-[80vh]">
                <Card title="Login to Dashboard" className="w-full max-w-md">
                    {error && (
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}
                    <form action="/login" method="post" class="space-y-4">
                        <Input type="email" name="email" label="Email Address" required placeholder="admin@example.com" />
                        <Input type="password" name="password" label="Password" required placeholder="••••••••" />
                        <Button type="submit" class="w-full" variant="primary">Sign In</Button>
                    </form>
                    
                    <div class="mt-6">
                        <div class="relative">
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-gray-300"></div>
                            </div>
                            <div class="relative flex justify-center text-sm">
                                <span class="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div class="mt-6">
                            <a href="/auth/github" class="w-full flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                                </svg>
                                Sign in with GitHub
                            </a>
                        </div>
                    </div>
                </Card>
            </div>
        </Layout>
    );
});

app.post("/login", zValidator("form", loginSchema), async (c) => {
    const { email, password } = c.req.valid("form");

    // DB Lookup
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user || !user.password || !(await compare(password, user.password))) {
             return c.redirect("/login?error=Invalid credentials");
        }
        
        if (user.status !== 'active') {
             return c.text("Account is inactive", 403);
        }

        // Create Session/Token
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
        };
        const token = await sign(payload, process.env.JWT_SECRET!);
        
        setCookie(c, "token", token, {
            path: "/",
            secure: false, // Dev mode
            httpOnly: true,
            maxAge: 60 * 60 * 24,
        });

        return c.redirect(user.role === 'admin' ? '/admin' : '/dashboard');

    } catch (e) {
        console.error(e);
        return c.text("Database Error", 500);
    }
});

app.post("/logout", (c) => {
    deleteCookie(c, "token");
    return c.redirect("/login");
});

// GitHub OAuth Routes
app.get("/auth/github", githubAuth.loginWithGithub);
app.get("/auth/github/callback", githubAuth.githubCallback);

export const authRoutes = app;
