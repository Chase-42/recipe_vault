import { vi } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  getAuth: vi.fn(() => ({ userId: "test-user-id" })),
}));

// Mock Next.js request
(global as any).NextRequest = class MockNextRequest {
  constructor(public url: string) {}
} as any;
