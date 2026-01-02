import { hash } from "bcryptjs";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { Layout } from "../../components/Layout";
import { Badge, Button, Card, Input, Table, Pagination } from "../../components/UI";
import { db } from "../../db";
import { apiKeys, auditLogs, users } from "../../db/schema";
import { IconKey, IconShieldLock, IconUsers } from "../../lib/icons";
import { auditLog } from "../../middleware";

// biome-ignore lint/suspicious/noExplicitAny: loose jwt payload
const app = new Hono<{ Variables: { user: typeof users.$inferSelect; jwtPayload: any } }>();

app.get("/", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.redirect("/dashboard");

    const [userCount] = await db.select({ value: count() }).from(users);
    const [keyCount] = await db.select({ value: count() }).from(apiKeys);

    // Recent Audit Logs
    const recentLogs = await db.query.auditLogs.findMany({
        orderBy: [desc(auditLogs.created_at)],
        limit: 5,
    });

    return c.html(
        <Layout title="Admin Dashboard" user={user}>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card title="Total Users" className="border-l-4 border-blue-500 dark:border-blue-400">
                    <div class="flex items-center justify-between">
                        <span class="text-3xl font-bold">{userCount.value}</span>
                        <IconUsers class="text-blue-500 w-8 h-8" />
                    </div>
                </Card>
                <Card title="Total API Keys" className="border-l-4 border-green-500 dark:border-green-400">
                    <div class="flex items-center justify-between">
                        <span class="text-3xl font-bold">{keyCount.value}</span>
                        <IconKey class="text-green-500 w-8 h-8" />
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Recent Activity">
                    <ul class="space-y-3">
                        {recentLogs.map((log, i) => (
                            <li key={log.id || i} class="border-b last:border-0 border-gray-100 dark:border-slate-700 pb-3 mb-3 last:mb-0 last:pb-0">
                                <span class="font-medium text-gray-800 dark:text-gray-200">{log.action}</span>
                                <p class="text-sm text-gray-500 dark:text-gray-400">{log.details}</p>
                                <span class="text-xs text-gray-400 dark:text-gray-500">
                                    {log.created_at?.toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card title="Quick Actions">
                    <div class="flex flex-col gap-2">
                        <a href="/admin/users" class="text-blue-600 dark:text-blue-400 hover:underline">
                            Manage Users &rarr;
                        </a>
                    </div>
                </Card>
            </div>
        </Layout>,
    );
});

app.get("/users", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.redirect("/dashboard");

    const page = Number(c.req.query("page") || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    const [totalUsers] = await db.select({ value: count() }).from(users);
    const totalPages = Math.ceil(totalUsers.value / limit);

    const allUsers = await db.query.users.findMany({
        orderBy: [desc(users.created_at)],
        limit,
        offset,
    });

    return c.html(
        <Layout title="User Management" user={user}>
            <Card
                title="All Users"
                action={
                    <a
                        href="/admin/users/create"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                        Create New User
                    </a>
                }
            >
                <Table headers={["Username", "Email", "Role", "Status", "Actions"]}>
                    {allUsers.map((u) => (
                        <tr key={u.id}>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.username}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{u.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 uppercase">{u.role}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <Badge color={u.status === "active" ? "green" : "red"}>{u.status}</Badge>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                <form action={`/admin/users/${u.id}/toggle`} method="post">
                                    <button
                                        type="submit"
                                        class={`text-xs px-2 py-1 rounded ${u.status === "active" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                                    >
                                        {u.status === "active" ? "Deactivate" : "Activate"}
                                    </button>
                                </form>
                                <form
                                    action={`/admin/users/${u.id}/reset`}
                                    method="post"
                                    onsubmit="return confirm('Reset password to default?');"
                                >
                                    <button
                                        type="submit"
                                        class="text-gray-500 hover:text-gray-700"
                                        title="Reset Password"
                                    >
                                        <IconShieldLock class="w-5 h-5" />
                                    </button>
                                </form>
                                <a
                                    href={`/admin/users/${u.id}/edit`}
                                    class="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                >
                                    Edit
                                </a>
                            </td>
                        </tr>
                    ))}
                </Table>
                <Pagination
                    currentPage={page}
                    totalPages={totalPages > 0 ? totalPages : 1}
                    baseUrl="/admin/users"
                />
            </Card>
        </Layout>,
    );
});

app.get("/users/create", (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.redirect("/dashboard");

    return c.html(
        <Layout title="Create User" user={user}>
            <div class="max-w-xl mx-auto">
                <div class="mb-4">
                    <a href="/admin/users" class="text-blue-600 hover:underline">
                        &larr; Back to Users
                    </a>
                </div>
                <Card title="Create New User">
                    <form action="/admin/users/create" method="post" class="space-y-4">
                        <Input name="email" label="Email" type="email" required placeholder="user@example.com" />
                        <Input name="password" label="Password" type="password" required minLength={6} />
                        <Input name="name" label="Full Name" placeholder="John Doe" />
                        <Input name="username" label="Username" placeholder="johndoe" />

                        <div class="mb-4">
                            {/* biome-ignore lint/a11y/noLabelWithoutControl: select is next sibling */}
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                            <select
                                name="role"
                                class="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div class="pt-4 flex justify-end gap-2">
                            <a href="/admin/users" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">
                                Cancel
                            </a>
                            <Button type="submit" variant="primary">
                                Create User
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>,
    );
});

app.post("/users/create", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.text("Unauthorized", 403);

    const body = await c.req.parseBody();
    const email = body.email as string;
    const password = body.password as string;
    const name = body.name as string;
    const username = body.username as string;
    const role = body.role as "admin" | "user";

    // Basic Validation
    if (!email || !password || password.length < 6) {
        return c.text("Invalid input", 400); // Should ideally re-render form with error
    }

    // Check existing email
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
        return c.text("User with this email already exists", 400);
    }

    // Check existing username and append random number if needed
    let finalUsername = username;
    const existingUsername = await db.query.users.findFirst({ where: eq(users.username, finalUsername) });
    if (existingUsername) {
        finalUsername = `${finalUsername}${Math.floor(Math.random() * 10000)}`;
    }

    const hashed = await hash(password, 10);

    const result = await db.insert(users).values({
        email,
        password: hashed,
        name,
        username: finalUsername,
        role,
        status: "active",
    });

    await auditLog("USER_CREATE_ADMIN", user.id, Number(result[0].insertId), `Admin created user ${email}`);

    return c.redirect("/admin/users");
});

app.post("/users/:id/toggle", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.text("Unauthorized", 403);

    const id = parseInt(c.req.param("id"), 10);
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, id) });

    if (!targetUser) return c.text("User not found", 404);

    const newStatus = targetUser.status === "active" ? "inactive" : "active";

    await db.update(users).set({ status: newStatus }).where(eq(users.id, id));

    await auditLog(
        newStatus === "inactive" ? "USER_DEACTIVATED" : "USER_ACTIVATED",
        user.id,
        id,
        `User ${targetUser.email} status changed to ${newStatus}`,
    );

    return c.redirect("/admin/users");
});

app.post("/users/:id/reset", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.text("Unauthorized", 403);

    const id = parseInt(c.req.param("id"), 10);
    // Generate temporary password (simplified to 'password123' for demo or random string)
    const tempPass = Math.random().toString(36).slice(-8);
    const hashed = await hash(tempPass, 10);

    await db.update(users).set({ password: hashed }).where(eq(users.id, id));

    await auditLog("PASSWORD_RESET", user.id, id, `Password reset for user ID ${id}`);

    // Ideally show this to admin in a flash message or modal.
    // For simplicity in this stack, we'll render a simple success page.
    return c.html(
        <Layout title="Password Reset" user={user}>
            <Card title="Password Reset Successful">
                <div class="p-4 bg-green-50 border border-green-200 rounded text-green-700">
                    <p>Password for User ID {id} has been reset.</p>
                    <p class="font-bold text-lg mt-2">New Password: {tempPass}</p>
                    <p class="text-sm mt-2 text-gray-500">
                        Please copy this password immediately. It will not be shown again.
                    </p>
                </div>
                <div class="mt-4">
                    <a href="/admin/users" class="text-blue-600 hover:underline">
                        &larr; Back to Users
                    </a>
                </div>
            </Card>
        </Layout>,
    );
});

app.get("/users/:id/edit", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.redirect("/dashboard");
    const id = parseInt(c.req.param("id"), 10);
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!targetUser) return c.text("User not found", 404);

    return c.html(
        <Layout title={`Edit User: ${targetUser.email}`} user={user}>
            <div class="max-w-xl mx-auto">
                <div class="mb-4">
                    <a href="/admin/users" class="text-blue-600 hover:underline">
                        &larr; Back to Users
                    </a>
                </div>
                <Card title="Edit User Details">
                    <form action={`/admin/users/${id}/edit`} method="post" class="space-y-4">
                        <Input name="email" label="Email" value={targetUser.email} type="email" required />
                        <Input name="name" label="Full Name" value={targetUser.name || ""} />
                        <Input name="username" label="Username" value={targetUser.username || ""} />

                        <div>
                            <div class="block text-sm font-medium text-gray-700 mb-1">Role</div>
                            <select
                                name="role"
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="user" selected={targetUser.role === "user"}>
                                    User
                                </option>
                                <option value="admin" selected={targetUser.role === "admin"}>
                                    Admin
                                </option>
                            </select>
                        </div>

                        <div class="pt-4 flex justify-end gap-2">
                            <a href="/admin/users" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">
                                Cancel
                            </a>
                            <Button type="submit" variant="primary">
                                Save Admin Changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>,
    );
});

app.post("/users/:id/edit", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") return c.text("Unauthorized", 403);
    const id = parseInt(c.req.param("id"), 10);
    const body = await c.req.parseBody();

    // Simple validation could be added
    await db
        .update(users)
        .set({
            email: body.email as string,
            name: body.name as string,
            username: body.username as string,
            role: body.role as "admin" | "user",
        })
        .where(eq(users.id, id));

    await auditLog("USER_EDIT_ADMIN", user.id, id, `Admin edited user ${id}`);

    return c.redirect("/admin/users");
});

export const adminRoutes = app;
