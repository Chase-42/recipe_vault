import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db";
import { env } from "~/env";

const getSocialProviders = () => {
  const providers: Record<string, unknown> = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  return providers;
};

const getTrustedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Add production domain
  if (env.NEXT_PUBLIC_DOMAIN) {
    origins.push(env.NEXT_PUBLIC_DOMAIN);
  }
  
  // Add Better Auth URL if different
  if (env.BETTER_AUTH_URL && !origins.includes(env.BETTER_AUTH_URL)) {
    origins.push(env.BETTER_AUTH_URL);
  }
  
  // Allow Vercel preview deployments (they use *.vercel.app)
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  // Allow localhost for development
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000");
  }
  
  return origins;
};

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL || env.NEXT_PUBLIC_DOMAIN,
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: getSocialProviders(),
});
