import { zValidator } from "@hono/zod-validator";
import { compare, hash } from "bcryptjs";
import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { Layout } from "../../components/Layout";
import { Badge, Button, Card, Input, Table, Pagination } from "../../components/UI";
import { db } from "../../db";
import { apiKeys, auditLogs, users } from "../../db/schema";
import { IconKey } from "../../lib/icons";
import { createApiKeySchema } from "../../lib/zod-schema";
import { redirectWithToast } from "../../lib/toast";
import { authMiddleware, hashKey } from "../../middleware"; // We need hashKey helper

// biome-ignore lint/suspicious/noExplicitAny: loose jwt payload
const app = new Hono<{ Variables: { user: typeof users.$inferSelect; jwtPayload: any } }>();
app.use("*", authMiddleware);

app.get("/dashboard", async (c) => {
    const user = c.get("user");
    const [keyCount] = await db.select({ value: count() }).from(apiKeys).where(eq(apiKeys.user_id, user.id));

    // If admin, fetch additional stats
    let adminStats = null;
    if (user.role === "admin") {
        const [totalUsers] = await db.select({ value: count() }).from(users);
        const [totalKeys] = await db.select({ value: count() }).from(apiKeys);
        const recentLogs = await db.query.auditLogs.findMany({
            orderBy: [desc(auditLogs.created_at)],
            limit: 5,
        });
        adminStats = { totalUsers: totalUsers.value, totalKeys: totalKeys.value, recentLogs };
    }

    return c.html(
        <Layout title={user.role === "admin" ? "Admin Dashboard" : "User Dashboard"} user={user}>
            <div class="max-w-7xl mx-auto">
                {/* Admin Section */}
                {adminStats && (
                    <div class="mb-8">
                        <h3 class="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Admin Overview</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Card title="Total Users" className="border-l-4 border-blue-500 dark:border-blue-400">
                                <div class="flex items-center justify-between">
                                    <span class="text-3xl font-bold">{adminStats.totalUsers}</span>
                                    <IconKey class="text-blue-500 dark:text-blue-400 w-8 h-8" />
                                </div>
                                <div class="mt-4">
                                    <a
                                        href="/admin/users"
                                        class="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                    >
                                        Manage Users &rarr;
                                    </a>
                                </div>
                            </Card>
                            <Card title="Total API Keys" className="border-l-4 border-green-500 dark:border-green-400">
                                <div class="flex items-center justify-between">
                                    <span class="text-3xl font-bold">{adminStats.totalKeys}</span>
                                    <IconKey class="text-green-500 dark:text-green-400 w-8 h-8" />
                                </div>
                            </Card>
                            <Card title="System Status" className="border-l-4 border-purple-500 dark:border-purple-400">
                                <div class="flex items-center gap-2">
                                    <Badge color="green">Operational</Badge>
                                </div>
                                <p class="text-sm text-gray-500 mt-2">All systems running normally</p>
                            </Card>
                        </div>

                        <Card title="Recent Activity">
                            <ul class="space-y-3">
                                {/* biome-ignore lint/suspicious/noExplicitAny: loose type */}
                                {adminStats.recentLogs.map((log: any, i: number) => (
                                    <li key={log.id || i} class="border-b last:border-0 border-gray-100 dark:border-slate-700 pb-3 mb-3 last:mb-0 last:pb-0">
                                        <span class="font-medium text-gray-800 dark:text-gray-200">{log.action}</span>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">{log.details}</p>
                                        <span class="text-xs text-gray-400 dark:text-gray-500">
                                            {log.created_at?.toLocaleString()}
                                        </span>
                                    </li>
                                )) }
                            </ul>
                        </Card>
                    </div>
                )}

                {/* User Section */}
                <div>
                    <h3 class="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">My Account</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="My API Keys">
                            <div class="flex items-center justify-between">
                                <span class="text-3xl font-bold">{keyCount.value}</span>
                                <IconKey class="text-blue-500 dark:text-blue-400 w-8 h-8" />
                            </div>
                            <div class="mt-4">
                                <a href="/keys" class="text-blue-600 dark:text-blue-400 hover:underline">
                                    Manage Keys &rarr;
                                </a>
                            </div>
                        </Card>
                        <Card title="Account Status">
                            <div class="flex items-center gap-2">
                                Status: <Badge color="green">Active</Badge>
                            </div>
                            <p class="text-sm text-gray-500 mt-2">Your account is fully operational.</p>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>,
    );
});

app.get("/keys", async (c) => {
    const user = c.get("user");
    const page = Number(c.req.query("page") || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    const [totalKeys] = await db
        .select({ value: count() })
        .from(apiKeys)
        .where(eq(apiKeys.user_id, user.id));

    const totalPages = Math.ceil(totalKeys.value / limit);

    const myKeys = await db.query.apiKeys.findMany({
        where: eq(apiKeys.user_id, user.id),
        orderBy: [desc(apiKeys.created_at)],
        limit,
        offset,
    });

    return c.html(
        <Layout title="My API Keys" user={user}>
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold">API Keys</h1>
                <a href="/keys/create" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Generate New Key
                </a>
            </div>

            <Card>
                <Table headers={["Name", "Prefix", "Created", "Expires", "Hits", "Status", "Actions"]}>
                    {myKeys.map((k) => (
                        <tr key={k.id}>
                            <td class="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{k.name}</td>
                            <td class="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">{k.key_prefix}...</td>
                            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{k.created_at?.toLocaleDateString()}</td>
                            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {k.expires_at ? k.expires_at.toLocaleDateString() : "Never"}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{k.total_hits}</td>
                            <td class="px-6 py-4">
                                <Badge color={k.status === "active" ? "green" : "gray"}>{k.status}</Badge>
                            </td>
                            <td class="px-6 py-4 flex gap-2">
                                <a
                                    href={`/keys/${k.id}`}
                                    class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                    View
                                </a>

                                {k.status === "active" && (
                                    <form
                                        action={`/keys/${k.id}/revoke`}
                                        method="post"
                                        onsubmit="return confirm('Revoke this key? It cannot be reactivated.');"
                                    >
                                        <button
                                            type="submit"
                                            class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                        >
                                            Revoke
                                        </button>
                                    </form>
                                )}

                                {user.role === "admin" && (
                                    <form
                                        action={`/keys/${k.id}/delete`}
                                        method="post"
                                        onsubmit="return confirm('Permanently delete this key? History will handle appropriately.');"
                                    >
                                        <button
                                            type="submit"
                                            class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Remove
                                        </button>
                                    </form>
                                )}
                            </td>
                        </tr>
                    ))}
                </Table>
                <Pagination
                    currentPage={page}
                    totalPages={totalPages > 0 ? totalPages : 1}
                    baseUrl="/keys"
                />
            </Card>
        </Layout>,
    );
});

app.get("/keys/create", (c) => {
    const user = c.get("user");
    return c.html(
        <Layout title="Generate API Key" user={user}>
            <Card title="New API Key" className="max-w-lg mx-auto">
                <form action="/keys/create" method="post">
                    <Input name="name" label="Key Name (e.g. Mobile App)" required placeholder="Production App" />
                    <Input type="number" name="expires_in_days" label="Expires In (Days)" value="30" required />
                    <div class="flex justify-end gap-2 mt-4">
                        <a href="/keys" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">
                            Cancel
                        </a>
                        <Button type="submit" variant="primary">
                            Generate
                        </Button>
                    </div>
                </form>
            </Card>
        </Layout>,
    );
});

app.post("/keys/create", zValidator("form", createApiKeySchema), async (c) => {
    const user = c.get("user");
    const { name, expires_in_days } = c.req.valid("form");

    // Generate secure key
    const rawKey =
        "sk_" +
        crypto.randomUUID().replace(/-/g, "") +
        crypto.getRandomValues(new Uint8Array(10)).reduce((p, n) => p + n.toString(16).padStart(2, "0"), "");
    const hashed = await hashKey(rawKey); // Use shared helper

    await db.insert(apiKeys).values({
        user_id: user.id,
        name,
        key_hash: hashed,
        key_prefix: rawKey.substring(0, 10),
        status: "active",
        expires_at: new Date(Date.now() + expires_in_days * 86400000),
    });

    return c.html(
        <Layout title="Key Generated" user={user}>
            <Card title="API Key Generated Successfully" className="max-w-2xl mx-auto border-green-500 border-t-4">
                <div class="p-4 bg-yellow-50 text-yellow-800 rounded mb-4">
                    <strong>Important:</strong> Copy this key now. You will not be able to see it again!
                </div>
                <div class="bg-gray-800 text-white p-4 rounded font-mono text-lg break-all select-all">{rawKey}</div>
                <div class="mt-6 text-center">
                    <a href="/keys" class="text-blue-600 hover:underline">
                        I have copied it, go to list
                    </a>
                </div>
            </Card>
        </Layout>,
    );
});

app.post("/keys/:id/revoke", async (c) => {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"), 10);

    await db
        .update(apiKeys)
        .set({ status: "revoked" })
        .where(and(eq(apiKeys.id, id), eq(apiKeys.user_id, user.id)));

    return redirectWithToast(c, "/dashboard", "success", "API key revoked successfully");
});

app.post("/keys/:id/delete", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.text("Unauthorized: Only Admins can delete keys", 403);

    const id = parseInt(c.req.param("id"), 10);

    // Allow admins to delete ANY key? Or just their own?
    // Usually "Admins can delete keys" implies power over others, but here we are in "User Features".
    // However, if I am the admin viewing my keys, I can delete them.
    // If the prompt implies Admins can delete ANY key, we should remove the user_id check.
    // BUT, this specific route is under /keys (User Dashboard). So let's keep it safe:
    // Admin can delete their own keys here.
    // WAIT: If the request is "Only Admin can delete key", it likely means for the specific key being viewed.
    // If I am an admin, I should be able to delete THIS key.

    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.user_id, user.id)));

    return redirectWithToast(c, "/dashboard", "success", "API key deleted successfully");
});

app.get("/keys/:id", async (c) => {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"), 10);

    const key = await db.query.apiKeys.findFirst({
        where: and(eq(apiKeys.id, id), eq(apiKeys.user_id, user.id)),
    });

    if (!key) return c.text("Key not found", 404);

    return c.html(
        <Layout title={`Key: ${key.name}`} user={user}>
            <div class="max-w-2xl mx-auto">
                <div class="mb-4">
                    <a href="/keys" class="text-blue-600 hover:underline">
                        &larr; Back to Keys
                    </a>
                </div>
                <Card title="API Key Details">
                    <div class="space-y-4">
                        <div>
                            <div class="block text-sm font-medium text-gray-500">Name</div>
                            <p class="text-lg font-medium">{key.name}</p>
                        </div>
                        <div>
                            <div class="block text-sm font-medium text-gray-500">Prefix</div>
                            <p class="font-mono text-gray-800 bg-gray-100 inline-block px-2 rounded">
                                {key.key_prefix}...
                            </p>
                        </div>
                        <div>
                            <div class="block text-sm font-medium text-gray-500">Status</div>
                            <Badge color={key.status === "active" ? "green" : "gray"}>{key.status}</Badge>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <div class="block text-sm font-medium text-gray-500">Created At</div>
                                <p>{key.created_at?.toLocaleString()}</p>
                            </div>
                            <div>
                                <div class="block text-sm font-medium text-gray-500">Last Used</div>
                                <p>{key.last_used_at?.toLocaleString() || "Never"}</p>
                            </div>
                            <div>
                                <div class="block text-sm font-medium text-gray-500">Total Hits</div>
                                <p class="font-bold">{key.total_hits}</p>
                            </div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded text-blue-800 text-sm">
                            <strong>Note:</strong> The full API key secret is not stored and cannot be retrieved. If you
                            lost it, please generate a new key.
                        </div>
                    </div>
                    <div class="mt-6 flex gap-3 border-t pt-4">
                        {key.status === "active" && (
                            <form
                                action={`/keys/${key.id}/revoke`}
                                method="post"
                                onsubmit="return confirm('Revoke this key?');"
                            >
                                <Button type="submit" variant="warning">
                                    Revoke Key
                                </Button>
                            </form>
                        )}
                        {user.role === "admin" && (
                            <form
                                action={`/keys/${key.id}/delete`}
                                method="post"
                                onsubmit="return confirm('Permanently delete this key?');"
                            >
                                <Button type="submit" variant="danger">
                                    Delete Key
                                </Button>
                            </form>
                        )}
                    </div>
                </Card>
            </div>
        </Layout>,
    );
});

app.get("/profile", async (c) => {
    try {
        const user = c.get("user");

        if (!user) return c.redirect("/logout");

        return c.html(
            <Layout title="My Profile" user={user}>
                <div class="max-w-2xl mx-auto">
                    <Card title="Profile Details">
                        <div class="flex items-center gap-6 mb-6">
                            <img 
                                src={user.avatar || "/static/avatar.png"}
                                alt="User Avatar"
                                class="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-slate-700"
                            />
                            <div>
                                <h3 class="text-2xl font-bold">{user.name || user.email}</h3>
                                <p class="text-gray-500">{user.email}</p>
                                <Badge color={user.role === "admin" ? "blue" : "gray"}>{user.role}</Badge>
                            </div>
                            <div class="ml-auto flex flex-col items-end gap-2">
                                <a
                                    href="/profile/edit"
                                    class="px-4 py-2 rounded-lg font-medium transition duration-200 shadow-sm transform active:scale-95 bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 shadow-primary-500/30"
                                >
                                    Edit Profile
                                </a>
                                <a
                                    href="/profile/password"
                                    class="px-4 py-2 rounded-lg font-medium transition duration-200 shadow-sm transform active:scale-95 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    Change Password
                                </a>
                                {user.github_id && (
                                    <form action="/profile/avatar/refresh" method="post">
                                        <button
                                            type="submit"
                                            class="px-4 py-2 rounded-lg font-medium transition duration-200 shadow-sm transform active:scale-95 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                        >
                                            Update Avatar from GitHub
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                            <div>
                                <div class="block text-sm font-medium text-gray-500">Username</div>
                                <p class="font-mono">{user.username || "-"}</p>
                            </div>
                            <div>
                                <div class="block text-sm font-medium text-gray-500">Full Name</div>
                                <p>{user.name || "-"}</p>
                            </div>
                            {/* User ID removed */}
                            <div>
                                <div class="block text-sm font-medium text-gray-500">Account Status</div>
                                <Badge color={user.status === "active" ? "green" : "red"}>{user.status}</Badge>
                            </div>
                        </div>
                    </Card>
                </div>
            </Layout>,
        );
    } catch (e) {
        console.error("Profile Error:", e);
        return c.text("Error loading profile", 500);
    }
});

app.get("/profile/edit", async (c) => {
    const user = c.get("user");

    if (!user) return c.redirect("/logout");

    return c.html(
        <Layout title="Edit Profile" user={user}>
            <div class="max-w-xl mx-auto">
                <Card title="Edit Your Profile">
                    <form action="/profile/edit" method="post" class="space-y-4">
                        <Input name="name" label="Full Name" value={user.name || ""} placeholder="John Doe" />
                        <Input name="username" label="Username" value={user.username || ""} placeholder="johndoe" />

                        <div class="pt-4 flex justify-end gap-2">
                            <a href="/profile" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">
                                Cancel
                            </a>
                            <Button type="submit" variant="primary">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>,
    );
});

app.post("/profile/edit", async (c) => {
    const user = c.get("user");
    const body = await c.req.parseBody();
    const name = body.name as string;
    const username = body.username as string;

    // Optional: Username uniqueness check could be added here

    try {
        await db.update(users).set({ name, username }).where(eq(users.id, user.id));
        return redirectWithToast(c, "/profile", "success", "Profile updated successfully");
    } catch (error) {
        console.error("Profile update error:", error);
        return redirectWithToast(c, "/profile/edit", "error", "Failed to update profile");
    }
});

app.get("/profile/password", async (c) => {
    const user = c.get("user");

    if (!user) return c.redirect("/logout");

    return c.html(
        <Layout title="Change Password" user={user}>
            <div class="max-w-xl mx-auto">
                <Card title="Change Password">
                    <form action="/profile/password" method="post" class="space-y-4">
                        {user.role !== "admin" && (
                            <Input type="password" name="old_password" label="Current Password" required />
                        )}

                        <Input type="password" name="new_password" label="New Password" required minLength={6} />
                        <Input
                            type="password"
                            name="confirm_password"
                            label="Confirm New Password"
                            required
                            minLength={6}
                        />

                        <div class="pt-4 flex justify-end gap-2">
                            <a href="/profile" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">
                                Cancel
                            </a>
                            <Button type="submit" variant="primary">
                                Update Password
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>,
    );
});

app.post("/profile/password", async (c) => {
    const user = c.get("user");

    if (!user) return c.redirect("/logout");

    const body = await c.req.parseBody();
    const oldPassword = body.old_password as string;
    const newPassword = body.new_password as string;
    const confirmPassword = body.confirm_password as string;

    if (newPassword !== confirmPassword) {
        return redirectWithToast(c, "/profile/password", "error", "New passwords do not match");
    }

    // Validation logic
    if (user.role !== "admin") {
        if (!oldPassword) return redirectWithToast(c, "/profile/password", "error", "Current password is required");

        const valid = user.password && (await compare(oldPassword, user.password));
        if (!valid) {
            return redirectWithToast(c, "/profile/password", "error", "Incorrect current password");
        }
    }

    const hashed = await hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, user.id));

    return redirectWithToast(c, "/profile", "success", "Password updated successfully");
});

app.post("/profile/avatar/refresh", async (c) => {
    const user = c.get("user");

    if (!user) return c.redirect("/logout");
    
    // Only GitHub users can refresh avatar
    if (!user.github_id) {
        return redirectWithToast(c, "/profile", "error", "This feature is only available for GitHub users");
    }

    try {
        // Fetch latest GitHub user data
        // We need to use the GitHub ID to get public profile (no auth token needed for public data)
        const response = await fetch(`https://api.github.com/user/${user.github_id}`, {
            headers: {
                "User-Agent": "Bun-API-Manager",
            },
        });

        if (!response.ok) {
            return redirectWithToast(c, "/profile", "error", "Failed to fetch GitHub profile");
        }

        // biome-ignore lint/suspicious/noExplicitAny: External API response
        const githubData = await response.json() as any;
        const newAvatarUrl = githubData.avatar_url || null;

        // Update avatar in database
        await db.update(users).set({ avatar: newAvatarUrl }).where(eq(users.id, user.id));

        // Update JWT with new avatar
        const newPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            avatar: newAvatarUrl,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
        };

        // biome-ignore lint/style/noNonNullAssertion: Enforced by env check
        const token = await sign(newPayload, process.env.JWT_SECRET!);

        setCookie(c, "token", token, {
            path: "/",
            secure: false, // Dev mode
            httpOnly: true,
            maxAge: 60 * 60 * 24,
        });

        return redirectWithToast(c, "/profile", "success", "Avatar refreshed from GitHub");
    } catch (error) {
        console.error("Avatar refresh error:", error);
        return redirectWithToast(c, "/profile", "error", "Failed to update avatar");
    }
});

export const userRoutes = app;
// Need to import count from drizzle-orm but forgot earlier.
// Wait, I did verify imports. 'count' is available in drizzle-orm.
