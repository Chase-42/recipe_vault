import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  getAuth: vi.fn(() => ({ userId: "test-user-id" })),
}));

// Mock Next.js request
interface MockNextRequest {
  url: string;
}

(
  global as unknown as { NextRequest: new (url: string) => MockNextRequest }
).NextRequest = class MockNextRequest {
  constructor(public url: string) {}
};
