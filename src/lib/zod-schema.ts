import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["admin", "user"]).default("user"),
    status: z.enum(["active", "inactive"]).default("active"),
});

export const createApiKeySchema = z.object({
    name: z.string().min(1).max(100),
    expires_in_days: z.coerce.number().int().min(1).default(30),
});

export const updatePasswordSchema = z.object({
    password: z.string().min(6),
});
