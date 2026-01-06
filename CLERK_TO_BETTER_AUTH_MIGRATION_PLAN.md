# Clerk to Better Auth Migration Plan

## Overview

This document outlines the step-by-step plan to migrate Recipe Vault from Clerk authentication to Better Auth. This migration will invalidate all active sessions and requires careful execution to ensure data integrity and minimal user disruption.

## Current Status

**✅ Phase 1: COMPLETE** - All Better Auth setup is done!

**📋 Summary:**
- Better Auth is installed and configured
- API route handler is in place
- Database schema is defined
- Client instance is ready
- Environment variables are configured

**🎯 Ready to Proceed:**
- **Phase 3:** Update application code (replace Clerk components and API usage)
  - Start with Step 3.2: Create auth helper functions
  - Then update middleware, API routes, and UI components

**⚠️ Important Notes:**
- Ensure database tables exist: `npm run db:push`
- All Clerk code is still active - migration is in progress
- Test thoroughly in development before deploying
- **No user migration needed** - users will sign up fresh with Better Auth

---

## Phase 1 Progress Details

**Phase 1 Progress:**
- ✅ Step 1.1: Better Auth installed (v1.4.9)
- ✅ Step 1.2: Environment variables configured in `src/env.js`
- ✅ Step 1.3: Better Auth configuration created (`src/lib/auth.ts`)
- ✅ Step 1.4: API route handler **COMPLETE** (`src/app/api/auth/[...all]/route.ts`)
- ✅ Step 1.5: Database schema **COMPLETE** - Better Auth tables exist in `src/server/db/schema.ts`
- ✅ Step 1.6: Client instance **COMPLETE** (`src/lib/auth-client.ts`)

**Phase 1 Status: ✅ COMPLETE**

All Phase 1 setup steps are complete. Ready to proceed to Phase 2 (Migration Script) or Phase 3 (Code Updates).

**Next Steps:**
1. Verify database tables exist (run `npm run db:push` if needed)
2. Create auth helper functions (Step 3.2) before updating API routes
3. Begin Phase 3: Update application code to use Better Auth
4. **Note:** No user migration needed - users will create new accounts with Better Auth

**Still Using Clerk:**
- All 15 API routes
- Middleware
- All UI components (layout, topnav, pages)
- Server queries
- Test setup

## Prerequisites

- [ ] Review current Clerk usage in the codebase
- [ ] Backup production database (if applicable)
- [ ] Set up development/staging environment for testing
- [ ] Document all Clerk features currently in use
- [ ] **Note:** No user migration needed - users will create new accounts

## Current Clerk Usage Analysis

Based on codebase analysis, Clerk is used in the following areas:

### 1. **Authentication Components**
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign in page
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign up page
- `src/app/_components/topnav.tsx` - Uses `SignInButton`, `SignedIn`, `SignedOut`, `UserButton`
- `src/app/page.tsx` - Uses `SignedIn`, `SignedOut`, `SignInButton`

### 2. **Server-Side Authentication**
- `src/middleware.ts` - Route protection using `clerkMiddleware`
- `src/server/queries.ts` - Uses `getAuth` from Clerk
- All API routes use `getAuth(req)` to get userId:
  - `src/app/api/recipes/route.ts`
  - `src/app/api/recipes/create/route.ts`
  - `src/app/api/recipes/[id]/route.ts`
  - `src/app/api/recipes/[id]/favorite/route.ts`
  - `src/app/api/upload/route.ts`
  - `src/app/api/shopping-lists/route.ts`
  - `src/app/api/shopping-lists/items/route.ts`
  - `src/app/api/shopping-lists/items/[id]/route.ts`
  - `src/app/api/shopping-lists/generate/route.ts`
  - `src/app/api/shopping-lists/generate-enhanced/route.ts`
  - `src/app/api/shopping-lists/add-from-meal-plan/route.ts`
  - `src/app/api/meal-planner/plans/route.ts`
  - `src/app/api/meal-planner/plans/[id]/route.ts`
  - `src/app/api/meal-planner/current-week/route.ts`
  - `src/app/api/revalidate/route.ts`
  - `src/app/edit/[id]/page.tsx`

### 3. **Layout & Providers**
- `src/app/layout.tsx` - Wraps app with `ClerkProvider`

### 4. **Testing**
- `src/test-setup.ts` - Mocks Clerk auth

### 5. **Environment Variables**
- `CLERK_FRONTEND_API` (mentioned in README)
- `CLERK_API_KEY` (mentioned in README)
- **Note:** No Clerk secret key needed - no user migration

## Migration Steps

### Phase 1: Setup Better Auth (Development Environment)

#### Step 1.1: Install Better Auth
```bash
npm install better-auth
```

**Note:** `better-auth` is already installed (v1.4.9), so this step may be skipped.

#### Step 1.2: Set Environment Variables
Create/update `.env.local` with:

**Status: ✅ COMPLETED** (variables added to `src/env.js`)

```txt
BETTER_AUTH_SECRET=<generate-secret-here>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
```

**Generate secret:**
```bash
npx @better-auth/cli secret 
```
Or manually:
```bash
openssl rand -base64 32
```

**Note:** `BETTER_AUTH_SECRET` must be at least 32 characters. All variables are validated in `src/env.js`.

#### Step 1.3: Create Better Auth Configuration
Create `src/lib/auth.ts`:

**Status: ✅ COMPLETED**

```typescript
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

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: getSocialProviders(),
});
```

**Note:** Google OAuth is conditionally enabled when credentials are present.

**Database Configuration Notes:**
- Using Drizzle adapter with PostgreSQL (`provider: "pg"`)
- If your schema uses table prefixes (e.g., `recipe_vault_`), ensure Better Auth tables follow the same convention
- The `drizzleAdapter` automatically uses your existing Drizzle instance from `~/server/db`

#### Step 1.4: Create Better Auth API Route
Create `src/app/api/auth/[...all]/route.ts`:

**Status: ✅ COMPLETED**

The API route handler exists at `src/app/api/auth/[...all]/route.ts` and correctly uses `toNextJsHandler` from Better Auth.

#### Step 1.5: Generate Database Schema
Better Auth requires database tables to store user data, sessions, and OAuth accounts. Since you're using Drizzle with PostgreSQL, you need to generate the schema.

**Status: ✅ COMPLETED**

The Better Auth schema tables have been added to `src/server/db/schema.ts`:
- `user` table (lines 21-32)
- `session` table (lines 34-51)
- `account` table (lines 53-75)
- `verification` table (lines 77-91)

**Schema Details:**
- Tables are defined using `pgTable` (without the `recipe_vault_` prefix) as required by Better Auth
- The `drizzle.config.ts` includes these tables in the `tablesFilter`: `["recipe_vault_*", "user", "session", "account", "verification"]`
- Relations are properly defined between user, session, and account tables

**Next Step:** Push schema to database:
```bash
npm run db:push
```

**Note:** The tables use standard Better Auth naming (no prefix) which is the expected configuration. This matches the `drizzle.config.ts` setup.

#### Step 1.6: Create Client Instance
Create `src/lib/auth-client.ts`:

**Status: ✅ COMPLETED**

The client instance exists at `src/lib/auth-client.ts` and correctly:
- Uses `"use client"` directive
- Imports from `"better-auth/react"`
- Optionally uses `NEXT_PUBLIC_BETTER_AUTH_URL` if provided
- Exports `authClient` for use in components

**Ready for:** All client-side authentication operations.

### Phase 2: Update Application Code

**Note:** No user migration script needed. Users will create new accounts with Better Auth when they sign up.

#### Step 3.1: Update Middleware
Replace `src/middleware.ts`:

**Status: ✅ COMPLETED** (already using Better Auth `getSessionCookie`)

**Note:** Verify Better Auth middleware API. The example below may need adjustment based on actual Better Auth documentation.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { AuthorizationError } from "./lib/errors";

const isProtectedRoute = (pathname: string) => {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/shopping-lists") ||
    pathname.startsWith("/api/recipes") ||
    pathname.startsWith("/api/upload")
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (isProtectedRoute(pathname)) {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      throw new AuthorizationError();
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Current state:** Already updated to use Better Auth. Middleware checks for session cookie and protects API routes.

#### Step 3.2: Create Auth Helper Functions
Create `src/lib/auth-helpers.ts`:

**Status: ❌ NOT DONE** (required before updating API routes)

```typescript
import "server-only";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { AuthorizationError } from "./errors";
import type { NextRequest } from "next/server";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getServerUser() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new AuthorizationError();
  }
  return session.user;
}

export async function getServerUserId() {
  const user = await getServerUser();
  return user.id;
}

// For API routes that receive NextRequest
export async function getServerSessionFromRequest(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return session;
}

export async function getServerUserIdFromRequest(req: NextRequest) {
  const session = await getServerSessionFromRequest(req);
  if (!session?.user) {
    throw new AuthorizationError();
  }
  return session.user.id;
}
```

#### Step 3.3: Update Server Queries
Update `src/server/queries.ts`:

**Before:**
```typescript
import { getAuth } from "@clerk/nextjs/server";

function getUserIdFromRequest(req: NextRequest): string {
  const { userId } = getAuth(req);
  if (!userId) throw new AuthorizationError();
  return userId;
}
```

**After:**
```typescript
import { getServerUserIdFromRequest } from "~/lib/auth-helpers";

async function getUserIdFromRequest(req: NextRequest): Promise<string> {
  return await getServerUserIdFromRequest(req);
}
```

**Note:** This changes the function to async, so all callers need to be updated with `await`.

#### Step 3.4: Update API Routes
For each API route, replace:

**Before:**
```typescript
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) throw new AuthorizationError();
  // ...
}
```

**After:**
```typescript
import { getServerUserIdFromRequest } from "~/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const userId = await getServerUserIdFromRequest(req);
  // ...
}
```

**Files to update:**
- `src/app/api/recipes/route.ts`
- `src/app/api/recipes/create/route.ts`
- `src/app/api/recipes/[id]/route.ts`
- `src/app/api/recipes/[id]/favorite/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/shopping-lists/route.ts`
- `src/app/api/shopping-lists/items/route.ts`
- `src/app/api/shopping-lists/items/[id]/route.ts`
- `src/app/api/shopping-lists/generate/route.ts`
- `src/app/api/shopping-lists/generate-enhanced/route.ts`
- `src/app/api/shopping-lists/add-from-meal-plan/route.ts`
- `src/app/api/meal-planner/plans/route.ts`
- `src/app/api/meal-planner/plans/[id]/route.ts`
- `src/app/api/meal-planner/current-week/route.ts`
- `src/app/api/revalidate/route.ts`

#### Step 3.5: Update Page Components
Update `src/app/edit/[id]/page.tsx`:

**Before:**
```typescript
import { auth } from "@clerk/nextjs/server";
```

**After:**
```typescript
import { getServerUserId } from "~/lib/auth-helpers";
```

#### Step 3.6: Update Sign In Page
Replace `src/app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
"use client";

import { authClient } from "~/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      
      if (signInError) {
        setError(signInError.message || "Failed to sign in");
        return;
      }
      
      if (data) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your recipes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Step 3.7: Update Sign Up Page
Create similar page for sign-up using `authClient.signUp.email()`.

#### Step 3.8: Update TopNav Component
Update `src/app/_components/topnav.tsx`:

**Before:**
```typescript
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export const TopNav = () => {
  return (
    <SignedIn>
      {/* ... */}
      <UserButton />
    </SignedIn>
  );
};
```

**After:**
```typescript
"use client";

import { authClient } from "~/lib/auth-client";
import { useSession } from "better-auth/react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const TopNav = () => {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  
  if (!session) {
    return null; // Or show sign in button
  }
  
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };
  
  return (
    <nav>
      {/* ... existing nav content ... */}
      <div className="flex items-center gap-2">
        <span className="text-sm">{session.user.name || session.user.email}</span>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
    </nav>
  );
};
```

#### Step 3.9: Update Home Page
Update `src/app/page.tsx`:

**Before:**
```typescript
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <RecipeList />
      </SignedIn>
    </main>
  );
}
```

**After:**
```typescript
"use client";

import { authClient } from "~/lib/auth-client";
import RecipeList from "~/app/_components/RecipeList";
import LandingPage from "./landing-page"; // Extract landing page component

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-red-800" />
      </div>
    );
  }
  
  if (!session) {
    return <LandingPage />;
  }
  
  return <RecipeList />;
}
```

#### Step 3.10: Update Layout
Update `src/app/layout.tsx`:

**Before:**
```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {/* ... */}
    </ClerkProvider>
  );
}
```

**After:**
```typescript
// Remove ClerkProvider - Better Auth doesn't need a provider component
export default function RootLayout({ children }) {
  return (
    <>
      {/* ... */}
    </>
  );
}
```

#### Step 3.11: Update Test Setup
Update `src/test-setup.ts`:

**Before:**
```typescript
vi.mock("@clerk/nextjs/server", () => ({
  getAuth: vi.fn(() => ({ userId: "test-user-id" })),
}));
```

**After:**
```typescript
vi.mock("~/lib/auth-helpers", () => ({
  getServerUserId: vi.fn(() => Promise.resolve("test-user-id")),
  getServerUserIdFromRequest: vi.fn(() => Promise.resolve("test-user-id")),
  getServerUser: vi.fn(() => Promise.resolve({ id: "test-user-id", email: "test@example.com" })),
}));
```

### Phase 4: Testing

#### Step 4.1: Unit Tests
- Update all tests to use Better Auth mocks
- Test authentication flows
- Test protected routes

#### Step 4.2: Integration Tests
- Test sign in/sign up flows
- Test API route authentication
- Test middleware protection
- Test user session management

#### Step 4.3: Manual Testing
- [ ] Sign in with email/password
- [ ] Sign up new user
- [ ] Sign out
- [ ] Access protected routes
- [ ] Access protected API routes
- [ ] Test social providers (if enabled)
- [ ] Test 2FA (if enabled)
- [ ] Test user profile updates
- [ ] Test password reset flow

### Phase 5: Production Deployment

#### Step 5.1: Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backup created (if applicable)
- [ ] Rollback plan prepared

#### Step 5.2: Deployment Steps
1. Deploy Better Auth configuration
2. Run database migrations (`npm run db:push`)
3. Deploy updated application code
4. Monitor for errors
5. Test production authentication
6. **Note:** Users will need to create new accounts

#### Step 5.3: Post-Deployment
- [ ] Monitor error logs
- [ ] Verify user authentication works
- [ ] Check API route authentication
- [ ] Monitor session management
- [ ] Collect user feedback

### Phase 6: Cleanup

#### Step 6.1: Remove Clerk Dependencies
```bash
npm uninstall @clerk/nextjs @clerk/themes @clerk/types
```

#### Step 6.2: Remove Clerk Environment Variables
Remove from `.env` files:
- `CLERK_FRONTEND_API`
- `CLERK_API_KEY`

#### Step 6.3: Update Documentation
- Update README.md
- Remove Clerk references
- Add Better Auth documentation
- Update environment variable documentation

## Risk Assessment

### High Risk
- **User Account Loss**: Existing users will need to create new accounts
  - **Mitigation**: Communicate clearly to users, provide migration instructions if needed

- **Session Invalidation**: All active sessions will be invalidated
  - **Mitigation**: Communicate to users, provide clear sign-in instructions

- **Authentication Failures**: Users may not be able to sign in
  - **Mitigation**: Thorough testing, rollback plan, support channels ready

### Medium Risk
- **API Route Failures**: Protected routes may fail
  - **Mitigation**: Update all routes systematically, test each one

- **Social Provider Issues**: OAuth flows may break
  - **Mitigation**: Test each provider, have fallback authentication

### Low Risk
- **UI/UX Changes**: Authentication UI may look different
  - **Mitigation**: Match existing design, test user flows

## Rollback Plan

If migration fails:

1. **Immediate Rollback**
   - Revert code deployment
   - Restore database from backup
   - Re-enable Clerk environment variables

2. **Partial Rollback**
   - Keep Better Auth code but disable routes
   - Re-enable Clerk temporarily
   - Fix issues and retry migration

3. **Data Recovery**
   - Restore from database backup if needed
   - Verify data integrity

## Timeline Estimate

- **Phase 1 (Setup)**: ✅ COMPLETE
- **Phase 2 (Code Updates)**: 8-12 hours
- **Phase 3 (Testing)**: 4-6 hours
- **Phase 4 (Deployment)**: 2-4 hours
- **Phase 5 (Cleanup)**: 1-2 hours

**Total Estimated Time Remaining**: 15-24 hours

## Success Criteria

- [ ] Authentication works for new users
- [ ] All protected routes work correctly
- [ ] All API routes authenticate properly
- [ ] Social providers work (if enabled)
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Clerk dependencies removed

## Additional Notes

- **User Communication**: Notify users that they will need to create new accounts with Better Auth
- **Monitoring**: Set up monitoring for authentication errors post-migration
- **Support**: Have support channels ready for user issues
- **Gradual Rollout**: Consider feature flagging Better Auth for gradual rollout
- **Backup Strategy**: Maintain database backups throughout the process
- **No User Migration**: Users will sign up fresh with Better Auth - no data migration needed

## Resources

- [Better Auth Installation Guide](https://www.better-auth.com/docs/installation)
- [Better Auth Basic Usage](https://www.better-auth.com/docs/basic-usage)
- [Better Auth Clerk Migration Guide](https://www.better-auth.com/docs/guides/clerk-migration-guide)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)

---

**Document Version**: 2.0  
**Last Updated**: [Current Date]  
**Status**: Final - Based on Official Documentation
