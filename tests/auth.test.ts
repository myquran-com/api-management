import { describe, expect, test, mock, beforeEach, jest } from "bun:test";
import { mockDb } from "./mocks";

// Mocks
const dbPath = process.cwd() + "/src/db/index.ts";
mock.module(dbPath, () => ({ db: mockDb }));

// Mock bcrypt
mock.module("bcryptjs", () => ({
    compare: jest.fn(),
    hash: jest.fn()
}));

// Mock github
mock.module("./github", () => ({
    githubAuth: {
        loginWithGithub: jest.fn(),
        githubCallback: jest.fn()
    }
}));

mock.module("hono-rate-limiter", () => ({
    rateLimiter: () => (c, next) => next()
}));

mock.module("hono/jwt", () => ({
    sign: jest.fn(() => "mock_token"),
    verify: jest.fn()
}));

mock.module("hono/cookie", () => ({
    setCookie: jest.fn(),
    deleteCookie: jest.fn(),
    getCookie: jest.fn()
}));

import { authRoutes } from "../src/features/auth";
import { compare } from "bcryptjs";

describe("Auth Tests", () => {
    
    beforeEach(() => {
        process.env.JWT_SECRET = "test-secret";
        mockDb.query.users.findFirst.mockReset();
        // @ts-ignore
        compare.mockReset();
    });

    test("POST /login - Success", async () => {
         mockDb.query.users.findFirst.mockResolvedValue({
             id: 1, email: "admin@example.com", password: "hashed_password", role: "admin", status: "active"
         });
         // @ts-ignore
         compare.mockResolvedValue(true);

         const req = new Request("http://localhost/login", {
             method: "POST",
             headers: { "Content-Type": "application/x-www-form-urlencoded" },
             body: new URLSearchParams({ email: "admin@example.com", password: "password" }).toString()
         });

         const res = await authRoutes.request(req);
         
         expect(res.status).toBe(302); // Redirect
         expect(res.headers.get("Location")).toBe("/admin");
    });

    test("POST /login - Invalid Credentials", async () => {
         mockDb.query.users.findFirst.mockResolvedValue({
             id: 1, email: "admin@example.com", password: "hashed_password"
         });
         // @ts-ignore
         compare.mockResolvedValue(false);

         const req = new Request("http://localhost/login", {
             method: "POST",
             headers: { "Content-Type": "application/x-www-form-urlencoded" },
             body: new URLSearchParams({ email: "admin@example.com", password: "wrong_password" }).toString()
         });

         const res = await authRoutes.request(req);
         
         expect(res.status).toBe(302);
         expect(res.headers.get("Location")).toContain("error=Invalid");
    });
    
    test("POST /login - Non-existent User", async () => {
         mockDb.query.users.findFirst.mockResolvedValue(null);

         const req = new Request("http://localhost/login", {
             method: "POST",
             headers: { "Content-Type": "application/x-www-form-urlencoded" },
             body: new URLSearchParams({ email: "unknown@example.com", password: "password" }).toString()
         });

         const res = await authRoutes.request(req);
         
         expect(res.status).toBe(302);
         expect(res.headers.get("Location")).toContain("error=Invalid");
    });
});
