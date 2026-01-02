import { describe, expect, test, mock, beforeEach, afterEach, jest } from "bun:test";
import { createMockContext, mockDb } from "./mocks";

// Mock the DB module BEFORE importing middleware
const dbPath = process.cwd() + "/src/db/index.ts";
mock.module(dbPath, () => ({
    db: mockDb
}));

import { apiKeyMiddleware, validateApiKeyString } from "../src/middleware";

describe("Middleware Tests", () => {
    
    beforeEach(() => {
        mockDb.query.apiKeys.findFirst.mockReset();
        mockDb.query.users.findFirst.mockReset();
        mockDb.update.mockClear();
    });

    describe("validateApiKeyString", () => {
        test("should return valid false for invalid key", async () => {
             mockDb.query.apiKeys.findFirst.mockResolvedValue(null);

             const result = await validateApiKeyString("invalid-key");
             expect(result.valid).toBe(false);
             expect(result.error).toBe("Invalid API Key");
        });

        test("should return valid false for expired key", async () => {
            mockDb.query.apiKeys.findFirst.mockResolvedValue({
                id: 1,
                user_id: 1,
                key_hash: "hash",
                status: "active",
                expires_at: new Date(Date.now() - 10000) // Expired
            });

            const result = await validateApiKeyString("expired-key");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("API Key Expired");
        });
        
        test("should return valid false if user is inactive", async () => {
             mockDb.query.apiKeys.findFirst.mockResolvedValue({
                id: 1,
                user_id: 1,
                key_hash: "hash",
                status: "active",
                expires_at: null
            });
            mockDb.query.users.findFirst.mockResolvedValue({
                id: 1,
                status: "inactive",
                role: "user"
            });

            const result = await validateApiKeyString("valid-key");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("User Inactive");
        });

         test("should return valid true for correct key and active user", async () => {
             mockDb.query.apiKeys.findFirst.mockResolvedValue({
                id: 1,
                user_id: 1,
                key_hash: "hash",
                status: "active",
                expires_at: null
            });
            mockDb.query.users.findFirst.mockResolvedValue({
                id: 1,
                status: "active",
                role: "user"
            });

            const result = await validateApiKeyString("valid-key");
            expect(result.valid).toBe(true);
            expect(result.user_id).toBe(1);
        });
    });

    describe("apiKeyMiddleware", () => {
        test("should return 401 if missing X-API-KEY", async () => {
             const c = createMockContext({}, {});
             const next = jest.fn();

             await apiKeyMiddleware(c, next);

             expect(c.json).toHaveBeenCalledWith({ error: "Missing API Key" }, 401);
             expect(next).not.toHaveBeenCalled();
        });

         test("should call next() if validation passes", async () => {
             const c = createMockContext({}, { "x-api-key": "valid" });
             const next = jest.fn();
            
             // Mock internal validation calls
             // Note: Since we are testing integration with the helper, we mock the DB responses again
             mockDb.query.apiKeys.findFirst.mockResolvedValue({
                id: 1, user_id: 1, status: "active"
            });
            mockDb.query.users.findFirst.mockResolvedValue({
                id: 1, status: "active", role: "user"
            });

             await apiKeyMiddleware(c, next);

             expect(c.set).toHaveBeenCalledWith("user_id", 1);
             expect(next).toHaveBeenCalled();
        });
    });
});
