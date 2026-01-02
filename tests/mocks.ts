import { Context } from "hono";
import { jest } from "bun:test";

// Mock DB
export const mockDb = {
    query: {
        users: {
            findFirst: jest.fn(),
        },
        apiKeys: {
            findFirst: jest.fn(),
        }
    },
    update: jest.fn(() => ({
        set: jest.fn(() => ({
            where: jest.fn(),
        })),
    })),
    insert: jest.fn(() => ({
        values: jest.fn(),
    })),
};

// Mock Context Helper
export const createMockContext = (req: Partial<Request> = {}, headers: Record<string, string> = {}) => {
    const reqObj = {
        header: (name: string) => headers[name.toLowerCase()] || headers[name],
        ...req,
    } as unknown as Request;

    return {
        req: reqObj,
        json: jest.fn((data, status) => ({ data, status })),
        text: jest.fn((text, status) => ({ text, status })),
        redirect: jest.fn((url) => ({ redirect: url })),
        set: jest.fn(),
        get: jest.fn(),
    } as unknown as Context;
};
