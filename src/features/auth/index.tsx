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

const app = new Hono();

app.get("/login", (c) => {
    return c.html(
        <Layout title="Login">
            <div class="flex items-center justify-center min-h-[80vh]">
                <Card title="Login to Dashboard" className="w-full max-w-md">
                    <form action="/login" method="post" class="space-y-4">
                        <Input type="email" name="email" label="Email Address" required placeholder="admin@example.com" />
                        <Input type="password" name="password" label="Password" required placeholder="••••••••" />
                        <Button type="submit" class="w-full" variant="primary">Sign In</Button>
                    </form>
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

        if (!user || !(await compare(password, user.password))) {
             return c.html(
                <Layout title="Login">
                    <div class="flex items-center justify-center min-h-[80vh]">
                        <Card title="Login to Dashboard" className="w-full max-w-md">
                             <div class="bg-red-100 text-red-700 p-3 rounded mb-4">Invalid credentials</div>
                            <form action="/login" method="post" class="space-y-4">
                                <Input type="email" name="email" label="Email Address" value={email} required />
                                <Input type="password" name="password" label="Password" required />
                                <Button type="submit" class="w-full" variant="primary">Sign In</Button>
                            </form>
                        </Card>
                    </div>
                </Layout>
             );
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

export const authRoutes = app;
