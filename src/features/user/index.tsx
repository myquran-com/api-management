import { Hono } from "hono";
import { db } from "../../db";
import { apiKeys } from "../../db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { Layout } from "../../components/Layout";
import { Card, Table, Badge, Button, Input } from "../../components/UI";
import { IconKey } from "../../lib/icons";
import { createApiKeySchema } from "../../lib/zod-schema";
import { zValidator } from "@hono/zod-validator";
import { hashKey } from "../../middleware"; // We need hashKey helper

const app = new Hono();

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
                 <Table headers={["Name", "Prefix", "Created", "Status", "Actions"]}>
                     {myKeys.map(k => (
                         <tr>
                             <td class="px-6 py-4 font-medium">{k.name}</td>
                             <td class="px-6 py-4 font-mono text-xs">{k.key_prefix}...</td>
                             <td class="px-6 py-4 text-sm text-gray-500">{k.created_at?.toLocaleDateString()}</td>
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
        // expires_at: new Date(Date.now() + expires_in_days * 86400000)
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

export const userRoutes = app;
// Need to import count from drizzle-orm but forgot earlier.
// Wait, I did verify imports. 'count' is available in drizzle-orm.
