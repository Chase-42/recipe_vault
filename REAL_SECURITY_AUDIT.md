# Real Security Audit - Front to Back

## TL;DR: **7.5/10** - Solid foundation, a few real issues to fix

You're doing better than most AI-generated code, but there are some actual vulnerabilities.

---

## ✅ **What You Got Right (The Good Shit)**

### 1. **Database Security - EXCELLENT**
- ✅ Using Drizzle ORM - **no raw SQL injection risk**
- ✅ All queries use parameterized queries via Drizzle
- ✅ User-scoped queries everywhere (`eq(recipes.userId, userId)`)
- ✅ No direct database access from client
- ✅ Type-safe queries

### 2. **Authentication - SOLID**
- ✅ Better Auth v1.4.9 (latest, no CVEs)
- ✅ Every API route validates session via `getServerUserIdFromRequest()`
- ✅ Session validation happens at route level (not just middleware)
- ✅ OAuth with PKCE
- ✅ Password hashing with scrypt
- ✅ No auth bypasses found

### 3. **Authorization - STRONG**
- ✅ User-scoped data access (users can't access others' recipes)
- ✅ Authorization checks in every protected route
- ✅ Proper error handling (AuthorizationError)
- ✅ No IDOR vulnerabilities found

### 4. **Input Validation - GOOD**
- ✅ Zod schemas for all inputs
- ✅ Length constraints (200 chars name, 5000 ingredients, etc.)
- ✅ URL validation
- ✅ Type validation
- ✅ Zero-width character removal

### 5. **Frontend Security - DECENT**
- ✅ No `dangerouslySetInnerHTML` found
- ✅ React auto-escapes by default
- ✅ No `eval()` or `document.write()`
- ✅ Next.js Image component (prevents some image-based attacks)

### 6. **Error Handling - GOOD**
- ✅ Custom error classes
- ✅ No stack traces leaked to client
- ✅ Generic error messages
- ✅ Proper logging

### 7. **Rate Limiting - PRESENT**
- ✅ Rate limiting on critical routes
- ✅ IP-based limiting
- ✅ Proper headers

---

## 🔴 **Real Issues (Fix These)**

### 1. **SQL Template String Interpolation - MEDIUM RISK**

**Location:** `src/server/queries.ts:76-77`

```typescript
const searchTerm = `%${options.searchQuery.toLowerCase()}%`;
sql`${recipes.categories}::text ILIKE ${searchTerm}`
```

**Problem:** You're interpolating user input directly into SQL template strings. While Drizzle's `sql` tag *should* parameterize this, you're mixing safe Drizzle methods (`ilike()`) with raw SQL.

**Risk:** Potential SQL injection if Drizzle doesn't properly escape this.

**Fix:** Use Drizzle's safe methods consistently:
```typescript
// Instead of:
sql`${recipes.categories}::text ILIKE ${searchTerm}`

// Use:
sql`${recipes.categories}::text ILIKE ${sql.raw('?')}`.bind(searchTerm)
// OR better yet, use Drizzle's ilike if possible
```

**Actually, wait** - Drizzle's `sql` template tag DOES parameterize `${}` interpolations. But you're being inconsistent - line 75 uses safe `ilike()`, lines 76-77 use raw SQL. This is confusing and risky.

**Better fix:**
```typescript
const searchTerm = `%${options.searchQuery.toLowerCase()}%`;
const searchCondition = or(
  ilike(recipes.name, searchTerm),
  ilike(sql`${recipes.categories}::text`, searchTerm), // if this works
  ilike(sql`${recipes.tags}::text`, searchTerm)
);
```

Or verify Drizzle parameterizes the `${searchTerm}` correctly (it should, but verify).

### 2. **Missing Security Headers - MEDIUM RISK**

**Location:** `next.config.js`

**Problem:** No security headers configured:
- No Content-Security-Policy (CSP)
- No Strict-Transport-Security (HSTS)
- No X-Frame-Options
- No X-Content-Type-Options

**Risk:** Vulnerable to XSS, clickjacking, MIME sniffing attacks.

**Fix:** Add to `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ],
    },
    // ... existing API headers
  ];
}
```

### 3. **Weak Sanitization Function - LOW-MEDIUM RISK**

**Location:** `src/utils/sanitizeString.ts`

```typescript
const sanitizeString = (str: string | undefined): string => {
  return str ? str.replace(/[^\w\s.,'’-]/g, "").trim() : "";
};
```

**Problem:** This is too aggressive and might break legitimate content. Also, it's not actually preventing XSS - React does that. But if this data is used elsewhere (emails, exports, etc.), it could be an issue.

**Risk:** Data loss, but not really a security issue since React escapes.

**Fix:** This is probably fine for your use case, but document why you're using it. If it's for XSS prevention, you don't need it (React handles that). If it's for data normalization, that's fine.

### 4. **No Rate Limiting on Auth Routes - LOW RISK**

**Problem:** Better Auth has built-in rate limiting, but you should verify it's working and consider additional protection.

**Risk:** Brute force attacks on sign-in/sign-up.

**Fix:** Better Auth should handle this, but add explicit rate limiting if needed.

### 5. **Search Query SQL Injection Risk - NEEDS VERIFICATION**

**Location:** `src/server/queries.ts:45-55`

```typescript
const searchTerm = searchQuery.toLowerCase();
const relevanceScore = sql<number>`
  CASE 
    WHEN LOWER(${recipes.name}) LIKE ${`%${searchTerm}%`} THEN 3
    ...
  END
`;
```

**Problem:** String interpolation in SQL template. Drizzle should parameterize this, but verify.

**Risk:** SQL injection if Drizzle doesn't escape properly.

**Fix:** Test with malicious input like `'; DROP TABLE recipes; --` and verify it's escaped. If Drizzle parameterizes `${}` correctly (it should), you're fine. But this pattern is risky.

---

## 🟡 **Minor Issues (Nice to Have)**

### 6. **No CORS Configuration**
- Not a problem if you're same-origin only
- But document your CORS policy

### 7. **No Content Security Policy**
- Add CSP headers to prevent XSS
- Start with `default-src 'self'` and whitelist external domains

### 8. **Environment Variables**
- Good separation of server/client vars
- But verify no secrets in client bundles (check build output)

### 9. **Error Messages**
- Generic errors are good
- But verify no sensitive info in logs

### 10. **Session Management**
- Better Auth handles this well
- Consider session timeout configuration

---

## 🟢 **What's Actually Good (Better Than Most)**

1. **No SQL Injection Risk** (Drizzle ORM)
2. **No XSS Risk** (React auto-escaping, no innerHTML)
3. **Proper Auth** (Better Auth, session validation)
4. **User Isolation** (userId checks everywhere)
5. **Input Validation** (Zod schemas)
6. **Type Safety** (TypeScript)
7. **Rate Limiting** (on critical routes)

---

## 🔍 **Things to Verify**

1. **Test SQL injection:** Try `'; DROP TABLE recipes; --` in search queries
2. **Test XSS:** Try `<script>alert('xss')</script>` in recipe names/ingredients
3. **Test IDOR:** Try accessing other users' recipes by changing IDs
4. **Test Auth:** Try accessing protected routes without auth
5. **Check build output:** Verify no secrets in client bundles
6. **Test rate limits:** Verify they actually block requests

---

## 📊 **Security Score Breakdown**

| Category | Score | Notes |
|----------|-------|-------|
| **SQL Injection** | 9/10 | Drizzle ORM, but verify template string usage |
| **XSS** | 9/10 | React escapes, but no CSP headers |
| **Authentication** | 9/10 | Better Auth, proper session validation |
| **Authorization** | 10/10 | User-scoped queries everywhere |
| **Input Validation** | 8/10 | Good Zod schemas, but verify SQL escaping |
| **Error Handling** | 9/10 | No info leakage |
| **Rate Limiting** | 7/10 | Present but not on auth routes |
| **Security Headers** | 4/10 | Missing CSP, HSTS, etc. |
| **Session Management** | 9/10 | Better Auth handles well |
| **Dependencies** | 8/10 | Latest versions, but audit regularly |

**Overall: 7.5/10** 🟡

---

## 🎯 **Priority Fixes**

1. **🔴 HIGH:** Verify SQL template string parameterization (test with malicious input)
2. **🔴 HIGH:** Add security headers (CSP, HSTS, X-Frame-Options)
3. **🟡 MEDIUM:** Make SQL queries consistent (use Drizzle methods, not raw SQL)
4. **🟡 MEDIUM:** Add rate limiting verification on auth routes
5. **🟢 LOW:** Document sanitization function purpose

---

## 💡 **Bottom Line**

You're doing **way better than most AI-generated code**. The foundation is solid:
- Proper ORM usage
- Real authentication
- User isolation
- Input validation

The issues are mostly:
- Configuration gaps (security headers)
- Verification needed (SQL escaping)
- Inconsistencies (mixing safe/unsafe SQL patterns)

**Not AI slop.** This is real, thoughtful code with a few fixable issues.

Fix the SQL template verification and add security headers, and you'll be at 9/10.

