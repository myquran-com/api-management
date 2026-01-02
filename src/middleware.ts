import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { db } from "./db";
import { apiKeys, users, auditLogs } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCookie } from "hono/cookie";

export const loggerMiddleware = createMiddleware(async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${c.req.method} ${c.req.path} - ${c.res.status} - ${ms}ms`);
});

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "") || getCookie(c, "token"); // Support cookie for UI
  
  if (!token) { // If no token, check if it's a browser request, maybe redirect
      if (c.req.header('accept')?.includes('text/html')) {
           return c.redirect('/login');
      }
      return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set("jwtPayload", payload);
    await next();
  } catch (e) {
      if (c.req.header('accept')?.includes('text/html')) {
           return c.redirect('/login');
      }
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Helper to hash key (simple sha256)
export async function hashKey(key: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const apiKeyMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("X-API-KEY");

  if (!apiKey) {
    return c.json({ error: "Missing API Key" }, 401);
  }

  const hashed = await hashKey(apiKey);

  // Check key existence and status
  const keyRecord = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.key_hash, hashed),
    with: {
        // We need check user status too? Drizzle relations or manual query
    }
  });

  if (!keyRecord) {
    return c.json({ error: "Invalid API Key" }, 401);
  }

  // Check if expired
  if (keyRecord.expires_at && new Date() > keyRecord.expires_at) {
      return c.json({ error: "API Key Expired" }, 401);
  }

  // Check if key is active
  if (keyRecord.status !== 'active') {
       return c.json({ error: "API Key Revoked" }, 401);
  }

  // CRITICAL: Check User Status
  const user = await db.query.users.findFirst({
      where: eq(users.id, keyRecord.user_id),
      columns: { status: true }
  });

  if (!user || user.status !== 'active') {
       return c.json({ error: "User Inactive - API Access Denied" }, 403);
  }

  // Update last used and hit count
  await db.update(apiKeys)
    .set({ 
        last_used_at: new Date(),
        total_hits: sql`${apiKeys.total_hits} + 1`
    })
    .where(eq(apiKeys.id, keyRecord.id));
    
  // Log access (simple access log logic inline or via another middleware)
  // For 'audit log' requirement (admin actions), we handle that in mutation endpoints.
  // For 'access log', we can just log here.
  console.log(`API Access: KeyID=${keyRecord.id} UserID=${keyRecord.user_id}`);

  c.set("user_id", keyRecord.user_id);
  await next();
});

export const auditLog = async (action: string, actorId: number, targetId: number | null, details: string) => {
    await db.insert(auditLogs).values({
        action,
        actor_id: actorId,
        target_id: targetId,
        details,
        ip_address: "127.0.0.1" // Simplified
    });
}
