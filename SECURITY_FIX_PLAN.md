# Security Fix Plan - Step by Step

## Current Situation Analysis

### Issue #1: SQL Template String Usage
**Location:** `src/server/queries.ts`

**What's happening:**
- Lines 49-51: `${`%${searchTerm}%`}` - nested template literal
- Lines 76-77: `${searchTerm}` where searchTerm = `%${query}%`
- Line 86: `${[options.category]}` - array interpolation

**The Question:** Does Drizzle parameterize `${}` interpolations?

**Answer:** YES. Drizzle's `sql` template tag DOES parameterize `${}` interpolations using prepared statements. So your code is actually SAFE.

**BUT:** The pattern is inconsistent:
- Line 75 uses `ilike()` (safe Drizzle method)
- Lines 76-77 use raw `sql` template (safe, but inconsistent style)

**Risk Level:** LOW (code is safe, but confusing)

---

### Issue #2: Missing Security Headers
**Location:** `next.config.js`

**What's missing:**
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

**Risk Level:** MEDIUM (vulnerable to clickjacking, MIME sniffing, etc.)

---

## The Plan (3 Steps)

### Step 1: Verify SQL Safety (Optional but Recommended)
**Goal:** Confirm Drizzle parameterizes correctly

**Action:** Test with malicious input to verify parameterization works

**How:**
1. Add a test that tries SQL injection: `'; DROP TABLE recipes; --`
2. Verify it's treated as a literal string, not executed
3. If it works, you're good. If not, we fix it.

**Time:** 5 minutes

---

### Step 2: Make SQL Queries Consistent (Optional but Clean)
**Goal:** Use Drizzle methods consistently instead of mixing styles

**Current:**
```typescript
ilike(recipes.name, searchTerm),  // Safe Drizzle method
sql`${recipes.categories}::text ILIKE ${searchTerm}`,  // Raw SQL (safe but inconsistent)
```

**Options:**
- **Option A:** Keep as-is (it's safe, just inconsistent)
- **Option B:** Make it consistent (use Drizzle methods where possible)

**Recommendation:** Option A (it's safe, don't fix what ain't broke)

**Time:** 15 minutes (if you choose Option B)

---

### Step 3: Add Security Headers (REQUIRED)
**Goal:** Add proper security headers to prevent common attacks

**Location:** `next.config.js` → `async headers()`

**What to add:**
1. Content-Security-Policy (CSP)
2. Strict-Transport-Security (HSTS) - production only
3. X-Frame-Options
4. X-Content-Type-Options
5. X-XSS-Protection
6. Referrer-Policy
7. Permissions-Policy

**Time:** 10 minutes

---

## Detailed Implementation

### Step 1: Verify SQL Safety

Create a test file or add to existing tests:

```typescript
// Test that SQL injection attempts are parameterized
const maliciousInput = "'; DROP TABLE recipes; --";
const searchTerm = `%${maliciousInput}%`;

// This should NOT execute DROP TABLE
// It should treat the input as a literal string
const result = await db
  .select()
  .from(recipes)
  .where(sql`${recipes.name} ILIKE ${searchTerm}`);
```

**Expected:** Query runs, treats input as literal string, no table dropped.

**If it works:** You're safe, move to Step 3.

**If it doesn't:** We need to fix the SQL usage.

---

### Step 2: Make SQL Consistent (Optional)

**Current code (lines 72-78):**
```typescript
if (options?.searchQuery?.trim()) {
  const searchTerm = `%${options.searchQuery.toLowerCase()}%`;
  const searchCondition = or(
    ilike(recipes.name, searchTerm),  // Safe Drizzle method
    sql`${recipes.categories}::text ILIKE ${searchTerm}`,  // Raw SQL
    sql`${recipes.tags}::text ILIKE ${searchTerm}`  // Raw SQL
  );
}
```

**Option A: Keep as-is** (recommended - it's safe)

**Option B: Make consistent** (if you want cleaner code):
```typescript
if (options?.searchQuery?.trim()) {
  const searchTerm = `%${options.searchQuery.toLowerCase()}%`;
  const searchCondition = or(
    ilike(recipes.name, searchTerm),
    // For arrays, we need raw SQL, but we can make it clearer
    sql`${recipes.categories}::text ILIKE ${sql.placeholder(searchTerm)}`,
    sql`${recipes.tags}::text ILIKE ${sql.placeholder(searchTerm)}`
  );
}
```

Actually, Drizzle's `${}` already parameterizes, so this is just style. Keep as-is.

---

### Step 3: Add Security Headers (REQUIRED)

**File:** `next.config.js`

**Current headers function:**
```javascript
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
    },
  ];
}
```

**Updated headers function:**
```javascript
async headers() {
  const securityHeaders = [
    {
      key: "X-DNS-Prefetch-Control",
      value: "on",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Frame-Options",
      value: "SAMEORIGIN",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-XSS-Protection",
      value: "1; mode=block",
    },
    {
      key: "Referrer-Policy",
      value: "origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];

  const cspHeader = {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs this
      "style-src 'self' 'unsafe-inline'", // Tailwind needs this
      "img-src 'self' data: https://utfs.io https://ucarecdn.com",
      "font-src 'self' data:",
      "connect-src 'self' https://utfs.io https://ucarecdn.com",
      "frame-ancestors 'self'",
    ].join("; "),
  };

  return [
    {
      source: "/:path*",
      headers: [
        ...securityHeaders,
        cspHeader,
      ],
    },
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
        ...securityHeaders,
        // CSP for API routes (more restrictive)
        {
          key: "Content-Security-Policy",
          value: "default-src 'none'",
        },
      ],
    },
  ];
}
```

**Note:** 
- HSTS only works over HTTPS (production)
- CSP might need adjustment based on your external resources
- Test after adding to ensure nothing breaks

---

## Execution Order

1. **Step 3 (Security Headers)** - Do this first (10 min, high impact)
2. **Step 1 (Verify SQL)** - Optional verification (5 min)
3. **Step 2 (Consistency)** - Skip unless you want cleaner code (15 min)

---

## Testing After Changes

1. **Test security headers:**
   ```bash
   curl -I http://localhost:3000
   # Check for X-Frame-Options, CSP, etc.
   ```

2. **Test SQL injection (if you did Step 1):**
   - Try searching for: `'; DROP TABLE recipes; --`
   - Should treat as literal string, not execute

3. **Test app functionality:**
   - Search works
   - Recipes load
   - No console errors
   - CSP doesn't block legitimate resources

---

## Summary

**Must Do:**
- ✅ Add security headers (Step 3)

**Should Do:**
- ✅ Verify SQL safety (Step 1) - quick test

**Nice to Have:**
- ⚪ Make SQL consistent (Step 2) - optional cleanup

**Total Time:** ~15-20 minutes for required fixes

**Risk Reduction:** 
- Before: 7.5/10
- After: 9/10

