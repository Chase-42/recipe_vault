import { vi } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock Better Auth helpers
vi.mock("~/lib/auth-helpers", () => ({
  getServerUserId: vi.fn(() => Promise.resolve("test-user-id")),
  getServerUserIdFromRequest: vi.fn(() => Promise.resolve("test-user-id")),
  getServerUser: vi.fn(() => Promise.resolve({ id: "test-user-id", email: "test@example.com" })),
  getServerSession: vi.fn(() => Promise.resolve({ user: { id: "test-user-id", email: "test@example.com" } })),
  getServerSessionFromRequest: vi.fn(() => Promise.resolve({ user: { id: "test-user-id", email: "test@example.com" } })),
}));

// Mock Next.js request
(global as any).NextRequest = class MockNextRequest {
  constructor(public url: string) {}
} as any;
