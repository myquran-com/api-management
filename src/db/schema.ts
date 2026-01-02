import { mysqlTable, varchar, timestamp, boolean, int, mysqlEnum, uniqueIndex, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'user']).default('user').notNull(),
  status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    emailIdx: index('email_idx').on(table.email),
  }
});

export const apiKeys = mysqlTable('api_keys', {
  id: int('id').primaryKey().autoincrement(),
  user_id: int('user_id').notNull().references(() => users.id),
  key_hash: varchar('key_hash', { length: 255 }).notNull().unique(), // Store hashed key
  key_prefix: varchar('key_prefix', { length: 10 }).notNull(), // To identify key type/owner without decrypting
  name: varchar('name', { length: 100 }).notNull(),
  status: mysqlEnum('status', ['active', 'revoked']).default('active').notNull(),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  last_used_at: timestamp('last_used_at'),
  expires_at: timestamp('expires_at'),
}, (table) => {
  return {
    keyHashIdx: uniqueIndex('key_hash_idx').on(table.key_hash),
    userIdIdx: index('user_id_idx').on(table.user_id),
  }
});

export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').primaryKey().autoincrement(),
  action: varchar('action', { length: 255 }).notNull(),
  actor_id: int('actor_id').notNull(), // User/Admin ID who performed action
  target_id: int('target_id'), // User/Resource ID affected
  details: varchar('details', { length: 500 }),
  ip_address: varchar('ip_address', { length: 45 }),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});
