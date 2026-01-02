import { Hono } from "hono";
import { db } from "../../db";
import { apiKeys, users } from "../../db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { Layout } from "../../components/Layout";
import { Card, Table, Badge, Button, Input } from "../../components/UI";
import { IconKey } from "../../lib/icons";
import { createApiKeySchema } from "../../lib/zod-schema";
import { zValidator } from "@hono/zod-validator";
import { hashKey, authMiddleware } from "../../middleware"; // We need hashKey helper
import { hash, compare } from "bcryptjs";

const app = new Hono();
app.use("*", authMiddleware);

app.get("/dashboard", async (c) => {
    const user = c.get("jwtPayload");
    const [keyCount] = await db.select({ value: count() }).from(apiKeys).where(eq(apiKeys.user_id, user.id));

    return c.html(
        <Layout title="User Dashboard" user={user}>
            <div class="max-w-4xl mx-auto">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card title="My API Keys">
                        <div class="flex items-center justify-between">
                            <span class="text-3xl font-bold">{keyCount.value}</span>
                            <IconKey class="text-blue-500 w-8 h-8" />
                        </div>
                        <div class="mt-4">
                            <a href="/keys" class="text-blue-600 hover:underline">Manage Keys &rarr;</a>
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
        </Layout>
    );
});

app.get("/keys", async (c) => {
    const user = c.get("jwtPayload");
    const myKeys = await db.query.apiKeys.findMany({
        where: eq(apiKeys.user_id, user.id),
        orderBy: [desc(apiKeys.created_at)]
    });

    return c.html(
        <Layout title="My API Keys" user={user}>
             <div class="flex justify-between items-center mb-6">
                 <h1 class="text-2xl font-bold">API Keys</h1>
                 <a href="/keys/create" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Generate New Key</a>
             </div>

             <Card>
                 <Table headers={["Name", "Prefix", "Created", "Expires", "Hits", "Status", "Actions"]}>
                     {myKeys.map(k => (
                         <tr>
                             <td class="px-6 py-4 font-medium">{k.name}</td>
                             <td class="px-6 py-4 font-mono text-xs">{k.key_prefix}...</td>
                             <td class="px-6 py-4 text-sm text-gray-500">{k.created_at?.toLocaleDateString()}</td>
                             <td class="px-6 py-4 text-sm text-gray-500">
                                {k.expires_at ? k.expires_at.toLocaleDateString() : 'Never'}
                             </td>
                             <td class="px-6 py-4 text-sm text-gray-500">{k.total_hits}</td>
                             <td class="px-6 py-4">
                                 <Badge color={k.status === 'active' ? 'green' : 'gray'}>{k.status}</Badge>
                             </td>
                             <td class="px-6 py-4 flex gap-2">
                                  <a href={`/keys/${k.id}`} class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View</a>
                                  
                                  {k.status === 'active' && (
                                     <form action={`/keys/${k.id}/revoke`} method="post" onsubmit="return confirm('Revoke this key? It cannot be reactivated.');">
                                         <button type="submit" class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">Revoke</button>
                                     </form>
                                  )}

                                  {user.role === 'admin' && (
                                      <form action={`/keys/${k.id}/delete`} method="post" onsubmit="return confirm('Permanently delete this key? History will handle appropriately.');">
                                          <button type="submit" class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">Remove</button>
                                      </form>
                                  )}
                             </td>
                         </tr>
                     ))}
                 </Table>
             </Card>
        </Layout>
    );
});

app.get("/keys/create", (c) => {
     const user = c.get("jwtPayload");
     return c.html(
         <Layout title="Generate API Key" user={user}>
             <Card title="New API Key" className="max-w-lg mx-auto">
                 <form action="/keys/create" method="post">
                     <Input name="name" label="Key Name (e.g. Mobile App)" required placeholder="Production App" />
                     <Input type="number" name="expires_in_days" label="Expires In (Days)" value="30" required />
                     <div class="flex justify-end gap-2 mt-4">
                         <a href="/keys" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</a>
                         <Button type="submit" variant="primary">Generate</Button>
                     </div>
                 </form>
             </Card>
         </Layout>
     );
});

app.post("/keys/create", zValidator("form", createApiKeySchema), async (c) => {
    const user = c.get("jwtPayload");
    const { name, expires_in_days } = c.req.valid("form");
    
    // Generate secure key
    const rawKey = "sk_" + crypto.randomUUID().replace(/-/g, "") + crypto.getRandomValues(new Uint8Array(10)).reduce((p,n)=>p+n.toString(16).padStart(2,'0'),'');
    const hashed = await hashKey(rawKey); // Use shared helper
    
    await db.insert(apiKeys).values({
        user_id: user.id,
        name,
        key_hash: hashed,
        key_prefix: rawKey.substring(0, 10),
        status: 'active',
        expires_at: new Date(Date.now() + expires_in_days * 86400000)
    });

    return c.html(
        <Layout title="Key Generated" user={user}>
            <Card title="API Key Generated Successfully" className="max-w-2xl mx-auto border-green-500 border-t-4">
                <div class="p-4 bg-yellow-50 text-yellow-800 rounded mb-4">
                    <strong>Important:</strong> Copy this key now. You will not be able to see it again!
                </div>
                <div class="bg-gray-800 text-white p-4 rounded font-mono text-lg break-all select-all">
                    {rawKey}
                </div>
                <div class="mt-6 text-center">
                    <a href="/keys" class="text-blue-600 hover:underline">I have copied it, go to list</a>
                </div>
            </Card>
        </Layout>
    );
});

app.post("/keys/:id/revoke", async (c) => {
    const user = c.get("jwtPayload");
    const id = parseInt(c.req.param("id"));

    await db.update(apiKeys)
        .set({ status: 'revoked' })
        .where(and(eq(apiKeys.id, id), eq(apiKeys.user_id, user.id)));

    return c.redirect("/keys");
});

app.post("/keys/:id/delete", async (c) => {
    const user = c.get("jwtPayload");
    if (user.role !== 'admin') return c.text("Unauthorized: Only Admins can delete keys", 403);

    const id = parseInt(c.req.param("id"));

    // Allow admins to delete ANY key? Or just their own? 
    // Usually "Admins can delete keys" implies power over others, but here we are in "User Features".
    // However, if I am the admin viewing my keys, I can delete them. 
    // If the prompt implies Admins can delete ANY key, we should remove the user_id check.
    // BUT, this specific route is under /keys (User Dashboard). So let's keep it safe:
    // Admin can delete their own keys here. 
    // WAIT: If the request is "Only Admin can delete key", it likely means for the specific key being viewed.
    // If I am an admin, I should be able to delete THIS key.
    
    await db.delete(apiKeys)
        .where(and(eq(apiKeys.id, id), eq(apiKeys.user_id, user.id)));

    return c.redirect("/keys");
});

app.get("/keys/:id", async (c) => {
    const user = c.get("jwtPayload");
    const id = parseInt(c.req.param("id"));

    const key = await db.query.apiKeys.findFirst({
        where: and(eq(apiKeys.id, id), eq(apiKeys.user_id, user.id))
    });

    if (!key) return c.text("Key not found", 404);

    return c.html(
        <Layout title={`Key: ${key.name}`} user={user}>
            <div class="max-w-2xl mx-auto">
                 <div class="mb-4">
                     <a href="/keys" class="text-blue-600 hover:underline">&larr; Back to Keys</a>
                 </div>
                 <Card title="API Key Details">
                     <div class="space-y-4">
                         <div>
                             <label class="block text-sm font-medium text-gray-500">Name</label>
                             <p class="text-lg font-medium">{key.name}</p>
                         </div>
                         <div>
                             <label class="block text-sm font-medium text-gray-500">Prefix</label>
                             <p class="font-mono text-gray-800 bg-gray-100 inline-block px-2 rounded">{key.key_prefix}...</p>
                         </div>
                         <div>
                             <label class="block text-sm font-medium text-gray-500">Status</label>
                             <Badge color={key.status === 'active' ? 'green' : 'gray'}>{key.status}</Badge>
                         </div>
                         <div class="grid grid-cols-2 gap-4">
                             <div>
                                 <label class="block text-sm font-medium text-gray-500">Created At</label>
                                 <p>{key.created_at?.toLocaleString()}</p>
                             </div>
                             <div>
                                 <label class="block text-sm font-medium text-gray-500">Last Used</label>
                                 <p>{key.last_used_at?.toLocaleString() || 'Never'}</p>
                             </div>
                             <div>
                                 <label class="block text-sm font-medium text-gray-500">Total Hits</label>
                                 <p class="font-bold">{key.total_hits}</p>
                             </div>
                         </div>
                          <div class="bg-blue-50 p-4 rounded text-blue-800 text-sm">
                             <strong>Note:</strong> The full API key secret is not stored and cannot be retrieved. If you lost it, please generate a new key.
                         </div>
                     </div>
                     <div class="mt-6 flex gap-3 border-t pt-4">
                          {key.status === 'active' && (
                             <form action={`/keys/${key.id}/revoke`} method="post" onsubmit="return confirm('Revoke this key?');">
                                 <Button type="submit" variant="warning">Revoke Key</Button>
                             </form>
                          )}
                           {user.role === 'admin' && (
                               <form action={`/keys/${key.id}/delete`} method="post" onsubmit="return confirm('Permanently delete this key?');">
                                    <Button type="submit" variant="danger">Delete Key</Button>
                               </form>
                           )}
                     </div>
                 </Card>
            </div>
        </Layout>
    );
});

app.get("/profile", async (c) => {
    try {
        const payload = c.get("jwtPayload");
        const user = await db.query.users.findFirst({
            where: eq(users.id, payload.id)
        });
        
        if (!user) return c.redirect('/logout');
        
        return c.html(
            <Layout title="My Profile" user={user}>
                <div class="max-w-2xl mx-auto">
                    <Card title="Profile Details">
                        <div class="flex items-center gap-6 mb-6">
                            <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                                {(user.email || user.username || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold">{user.name || user.email}</h3>
                                 <p class="text-gray-500">{user.email}</p>
                                <Badge color={user.role === 'admin' ? 'blue' : 'gray'}>{user.role}</Badge>
                            </div>
                             <div class="ml-auto flex flex-col items-end gap-2">
                                <a href="/profile/edit" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Edit Profile</a>
                                <a href="/profile/password" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm">Change Password</a>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                             <div>
                                 <label class="block text-sm font-medium text-gray-500">Username</label>
                                 <p class="font-mono">{user.username || '-'}</p>
                             </div>
                              <div>
                                 <label class="block text-sm font-medium text-gray-500">Full Name</label>
                                 <p>{user.name || '-'}</p>
                             </div>
                             <div>
                                 <label class="block text-sm font-medium text-gray-500">User ID</label>
                                 <p class="font-mono">{user.id}</p>
                             </div>
                             <div>
                                 <label class="block text-sm font-medium text-gray-500">Account Status</label>
                                 <Badge color={user.status === 'active' ? 'green' : 'red'}>{user.status}</Badge>
                             </div>
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    } catch (e) {
        console.error("Profile Error:", e);
        return c.text("Error loading profile", 500);
    }
});

app.get("/profile/edit", async (c) => {
    const payload = c.get("jwtPayload");
    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id)
    });

    if (!user) return c.redirect('/logout');

    return c.html(
        <Layout title="Edit Profile" user={user}>
            <div class="max-w-xl mx-auto">
                <Card title="Edit Your Profile">
                    <form action="/profile/edit" method="post" class="space-y-4">
                        <Input name="name" label="Full Name" value={user.name || ""} placeholder="John Doe" />
                        <Input name="username" label="Username" value={user.username || ""} placeholder="johndoe" />
                        
                         <div class="pt-4 flex justify-end gap-2">
                            <a href="/profile" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</a>
                            <Button type="submit" variant="primary">Save Changes</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>
    );
});

app.post("/profile/edit", async (c) => {
    const user = c.get("jwtPayload");
    const body = await c.req.parseBody();
    const name = body['name'] as string;
    const username = body['username'] as string;

    // Optional: Username uniqueness check could be added here

    await db.update(users)
        .set({ name, username })
        .where(eq(users.id, user.id));

    // Update JWT (Ideally we should refresh the token, but for now we redirect to login or just profile but token data will be stale)
    // To fix stale token data: The Middleware verifies the token. The 'user' object comes from the token payload.
    // If we update the DB, the token payload (which contains name/username if we put them there) is outdated.
    // BUT: Currently our JWT payload might only have id/email/role. Let's check auth.
    // If we only store ID in JWT and fetch User from DB in middleware, we are good.
    // Checking middleware... "c.set('jwtPayload', payload);". 
    // And in login: "sign({ id: user.id, email: user.email, role: user.role, ... }, secret)"
    // SO: The UI using `user.name` from `c.get("jwtPayload")` will be STALE until re-login.
    // FIX: We should fetch the FRESH user from DB for the /profile page, OR re-issue token.
    // EASIEST FIX: Fetch user from DB in /profile route instead of relying solely on JWT payload.
    
    return c.redirect("/profile");
});

app.get("/profile/password", async (c) => {
    const payload = c.get("jwtPayload");
    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id)
    });

    if (!user) return c.redirect('/logout');

    return c.html(
        <Layout title="Change Password" user={user}>
            <div class="max-w-xl mx-auto">
                <Card title="Change Password">
                    <form action="/profile/password" method="post" class="space-y-4">
                        {user.role !== 'admin' && (
                             <Input type="password" name="old_password" label="Current Password" required />
                        )}
                        
                        <Input type="password" name="new_password" label="New Password" required minLength={6} />
                        <Input type="password" name="confirm_password" label="Confirm New Password" required minLength={6} />
                        
                        <div class="pt-4 flex justify-end gap-2">
                            <a href="/profile" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</a>
                            <Button type="submit" variant="primary">Update Password</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>
    );
});

app.post("/profile/password", async (c) => {
    const payload = c.get("jwtPayload");
    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id)
    });

    if (!user) return c.redirect('/logout');

    const body = await c.req.parseBody();
    const oldPassword = body['old_password'] as string;
    const newPassword = body['new_password'] as string;
    const confirmPassword = body['confirm_password'] as string;

    if (newPassword !== confirmPassword) {
        return c.text("New passwords do not match", 400);
    }

    // Validation logic
    if (user.role !== 'admin') {
        if (!oldPassword) return c.text("Current password is required", 400);
        
        const valid = await compare(oldPassword, user.password);
        if (!valid) {
             return c.text("Incorrect current password", 401);
             // In a real app, render the form again with error message
        }
    }

    const hashed = await hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, user.id));

    return c.html(
        <Layout title="Password Updated" user={user}>
             <Card title="Success">
                <div class="p-4 bg-green-50 text-green-700 rounded mb-4">
                    Your password has been updated successfully.
                </div>
                <a href="/profile" class="text-blue-600 hover:underline">Back to Profile</a>
             </Card>
        </Layout>
    );
});

export const userRoutes = app;
// Need to import count from drizzle-orm but forgot earlier.
// Wait, I did verify imports. 'count' is available in drizzle-orm.
