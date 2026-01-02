import { Hono } from "hono";
import { db } from "../../db";
import { users, apiKeys, auditLogs } from "../../db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Layout } from "../../components/Layout";
import { Card, Table, Badge, Button, Input } from "../../components/UI";
import { IconUsers, IconKey, IconShieldLock } from "../../lib/icons";
import { hash } from "bcryptjs";
import { auditLog } from "../../middleware";

const app = new Hono();

app.get("/", async (c) => {
    const user = c.get("jwtPayload");
    if (user.role !== 'admin') return c.redirect('/dashboard');

    const [userCount] = await db.select({ value: count() }).from(users);
    const [keyCount] = await db.select({ value: count() }).from(apiKeys);
    
    // Recent Audit Logs
    const recentLogs = await db.query.auditLogs.findMany({
        orderBy: [desc(auditLogs.created_at)],
        limit: 5
    });

    return c.html(
        <Layout title="Admin Dashboard" user={user}>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card title="Total Users" className="border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <span class="text-3xl font-bold">{userCount.value}</span>
                        <IconUsers class="text-blue-500 w-8 h-8" />
                    </div>
                </Card>
                <Card title="Total API Keys" className="border-l-4 border-green-500">
                    <div class="flex items-center justify-between">
                        <span class="text-3xl font-bold">{keyCount.value}</span>
                        <IconKey class="text-green-500 w-8 h-8" />
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Recent Activity">
                    <ul class="space-y-3">
                        {recentLogs.map(log => (
                            <li class="border-b pb-2 last:border-0">
                                <span class="font-medium text-gray-800">{log.action}</span>
                                <p class="text-sm text-gray-500">{log.details}</p>
                                <span class="text-xs text-gray-400">{log.created_at?.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                 </Card>
                 <Card title="Quick Actions">
                    <div class="flex flex-col gap-2">
                         <a href="/admin/users" class="text-blue-600 hover:underline">Manage Users &rarr;</a>
                    </div>
                 </Card>
            </div>
        </Layout>
    );
});

app.get("/users", async (c) => {
    const user = c.get("jwtPayload");
    if (user.role !== 'admin') return c.redirect('/dashboard');

    const allUsers = await db.query.users.findMany({
        orderBy: [desc(users.created_at)]
    });

    return c.html(
        <Layout title="User Management" user={user}>
            <Card title="All Users">
                <Table headers={["ID", "Email", "Role", "Status", "Actions"]}>
                    {allUsers.map(u => (
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{u.id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{u.role}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <Badge color={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                <form action={`/admin/users/${u.id}/toggle`} method="post">
                                     <button type="submit" class={`text-xs px-2 py-1 rounded ${u.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                                     </button>
                                </form>
                                <form action={`/admin/users/${u.id}/reset`} method="post" onsubmit="return confirm('Reset password to default?');">
                                     <button type="submit" class="text-gray-500 hover:text-gray-700" title="Reset Password">
                                        <IconShieldLock class="w-5 h-5" />
                                     </button>
                                </form>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
        </Layout>
    );
});

app.post("/users/:id/toggle", async (c) => {
     const user = c.get("jwtPayload");
     if (user.role !== 'admin') return c.text("Unauthorized", 403);
     
     const id = parseInt(c.req.param("id"));
     const targetUser = await db.query.users.findFirst({ where: eq(users.id, id)});
     
     if (!targetUser) return c.text("User not found", 404);

     const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
     
     await db.update(users).set({ status: newStatus }).where(eq(users.id, id));
     
     await auditLog(
        newStatus === 'inactive' ? "USER_DEACTIVATED" : "USER_ACTIVATED",
        user.id,
        id,
        `User ${targetUser.email} status changed to ${newStatus}`
     );

     return c.redirect("/admin/users");
});

app.post("/users/:id/reset", async (c) => {
     const user = c.get("jwtPayload");
     if (user.role !== 'admin') return c.text("Unauthorized", 403);
     
     const id = parseInt(c.req.param("id"));
     // Generate temporary password (simplified to 'password123' for demo or random string)
     const tempPass = Math.random().toString(36).slice(-8);
     const hashed = await hash(tempPass, 10);

     await db.update(users).set({ password: hashed }).where(eq(users.id, id));

      await auditLog(
        "PASSWORD_RESET",
        user.id,
        id,
        `Password reset for user ID ${id}`
     );
    
     // Ideally show this to admin in a flash message or modal. 
     // For simplicity in this stack, we'll render a simple success page.
     return c.html(
         <Layout title="Password Reset" user={user}>
             <Card title="Password Reset Successful">
                 <div class="p-4 bg-green-50 border border-green-200 rounded text-green-700">
                     <p>Password for User ID {id} has been reset.</p>
                     <p class="font-bold text-lg mt-2">New Password: {tempPass}</p>
                     <p class="text-sm mt-2 text-gray-500">Please copy this password immediately. It will not be shown again.</p>
                 </div>
                 <div class="mt-4">
                     <a href="/admin/users" class="text-blue-600 hover:underline">&larr; Back to Users</a>
                 </div>
             </Card>
         </Layout>
     );
});

export const adminRoutes = app;
