import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  // Server-side environment variables schema
  server: {
    POSTGRES_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BETTER_AUTH_SECRET: z.string().min(32).default("build-time-placeholder-secret-must-be-32-chars-min"),
    BETTER_AUTH_URL: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    UPLOADCARE_SECRET_KEY: z.string().min(1),
  },

  // Client-side environment variables schema (prefix with NEXT_PUBLIC_)
  client: {
    NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY: z.string().min(1),
    NEXT_PUBLIC_DOMAIN: z.string().url(),
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
  },

  // Manual destructuring required for Next.js edge runtimes
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_DOMAIN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    UPLOADCARE_SECRET_KEY: process.env.UPLOADCARE_SECRET_KEY,
    NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY,
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  },
  // Skip env validation with SKIP_ENV_VALIDATION (useful for Docker builds)
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  // Treat empty strings as undefined
  emptyStringAsUndefined: true,
});
