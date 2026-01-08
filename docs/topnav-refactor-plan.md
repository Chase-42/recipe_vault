# TopNav Architecture Refactor Plan

## Objective
Refactor the TopNav component and app structure to use Next.js route groups, eliminating pathname-based navigation hiding and improving maintainability.

## Current Issues to Fix
1. Unused imports (`SignInButton`, `SignedOut`)
2. Pathname-based navigation hiding (maintenance nightmare)
3. Missing authentication UX for signed-out users
4. Tight coupling between navigation and route knowledge

## Refactor Strategy: Route Groups Architecture

### Phase 1: Preparation (30 minutes)
1. **Create branch**: `refactor/topnav-architecture`
2. **Backup current state**: Ensure all changes are stashed/committed
3. **Create new directory structure**:
   ```
   src/app/
   ├── (main)/           # Routes WITH navigation
   │   └── layout.tsx    # Includes TopNav
   ├── (focused)/        # Routes WITHOUT navigation
   │   └── layout.tsx    # Clean layout, no nav
   └── layout.tsx        # Root layout (auth, providers)
   ```

### Phase 2: Create New Layouts (15 minutes)
1. **Root Layout** (`src/app/layout.tsx`):
   - Keep existing root layout
   - Only handle global providers, auth, fonts, etc.
   - No navigation logic

2. **Main Layout** (`src/app/(main)/layout.tsx`):
   - Include TopNav component
   - For routes that need navigation

3. **Focused Layout** (`src/app/(focused)/layout.tsx`):
   - Clean layout without navigation
   - For focused experiences (add, edit, meal-planner, etc.)

### Phase 3: Refactor TopNav Component (20 minutes)
1. **Remove pathname checking logic**
2. **Add proper SignedOut state**
3. **Simplify component - no route knowledge**
4. **Add props for customization if needed**

### Phase 4: Move Pages to Route Groups (45 minutes)
1. **Main group** (with navigation):
   - `page.tsx` (home/recipe list)
   - Any other pages that need full navigation

2. **Focused group** (without navigation):
   - `add/` directory
   - `edit/` directory  
   - `meal-planner/` directory
   - `shopping-lists/` directory
   - `print/` directory (if exists)

### Phase 5: Testing & Cleanup (30 minutes)
1. **Test all routes work correctly**
2. **Verify navigation shows/hides appropriately**
3. **Test authentication flows**
4. **Remove any unused code**
5. **Update imports if needed**

## Detailed Implementation

### Step 1: Create Directory Structure
```bash
# Create route group directories
mkdir -p src/app/\(main\)
mkdir -p src/app/\(focused\)
```

### Step 2: Create Layout Files

**`src/app/(main)/layout.tsx`**:
```tsx
import { TopNav } from "~/app/_components/topnav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
```

**`src/app/(focused)/layout.tsx`**:
```tsx
export default function FocusedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

### Step 3: Refactor TopNav Component

**Remove this logic**:
```tsx
// DELETE THIS ENTIRE BLOCK
if (
  pathname?.startsWith("/img/") ||
  pathname === "/add" ||
  pathname?.startsWith("/edit/") ||
  pathname?.startsWith("/print/") ||
  pathname === "/shopping-lists" ||
  pathname === "/meal-planner"
) {
  return null;
}
```

**Remove unused imports**:
```tsx
// Remove usePathname import since we won't need it
import { usePathname } from "next/navigation"; // DELETE THIS
```

**Add proper SignedOut state**:
```tsx
return (
  <>
    <SignedIn>
      {/* Existing navigation */}
    </SignedIn>
    
    <SignedOut>
      <nav className="z-50 flex items-center justify-between border-b p-4 text-xl font-semibold print:hidden">
        <div className="flex items-center gap-2">
          <Image
            src="/recipe_vault_image.svg"
            alt="Recipe Vault Icon"
            width={28}
            height={28}
          />
          <Link href="/" className="text-white hover:underline">
            Recipe Vault
          </Link>
        </div>
        
        <SignInButton>
          <Button>Sign In</Button>
        </SignInButton>
      </nav>
    </SignedOut>
  </>
);
```

### Step 4: Move Pages

**Main group pages** (keep navigation):
```bash
# Move home page
mv src/app/page.tsx src/app/\(main\)/page.tsx
```

**Focused group pages** (no navigation):
```bash
# Move focused experience pages
mv src/app/add src/app/\(focused\)/
mv src/app/edit src/app/\(focused\)/
mv src/app/meal-planner src/app/\(focused\)/
mv src/app/shopping-lists src/app/\(focused\)/

# If print directory exists
mv src/app/print src/app/\(focused\)/ 2>/dev/null || true
```

## File Changes Checklist

### Files to Create:
- [ ] `src/app/(main)/layout.tsx`
- [ ] `src/app/(focused)/layout.tsx`

### Files to Move:
- [ ] `src/app/page.tsx` → `src/app/(main)/page.tsx`
- [ ] `src/app/add/` → `src/app/(focused)/add/`
- [ ] `src/app/edit/` → `src/app/(focused)/edit/`
- [ ] `src/app/meal-planner/` → `src/app/(focused)/meal-planner/`
- [ ] `src/app/shopping-lists/` → `src/app/(focused)/shopping-lists/`

### Files to Modify:
- [ ] `src/app/_components/topnav.tsx` - Remove pathname logic, add SignedOut
- [ ] Any import statements that reference moved files

## Testing Checklist

### Navigation Tests:
- [ ] Home page shows navigation
- [ ] Add recipe page has no navigation
- [ ] Edit recipe page has no navigation
- [ ] Meal planner has no navigation
- [ ] Shopping lists has no navigation

### Authentication Tests:
- [ ] Signed-in users see full navigation
- [ ] Signed-out users see sign-in button
- [ ] Sign-in flow works correctly
- [ ] User button works in signed-in state

### Functionality Tests:
- [ ] All existing functionality still works
- [ ] Modal dialogs still work
- [ ] Search functionality works
- [ ] Navigation links work correctly

## Rollback Plan
If issues arise:
1. `git checkout main` - return to main branch
2. `git branch -D refactor/topnav-architecture` - delete refactor branch
3. `git stash pop` - restore any stashed changes

## Benefits After Refactor
1. ✅ **Maintainable**: New routes automatically get correct layout
2. ✅ **Performant**: No pathname checking on every render
3. ✅ **Scalable**: Easy to add new route groups
4. ✅ **Clean**: Separation of concerns
5. ✅ **Next.js Best Practice**: Proper use of route groups
6. ✅ **No Dead Code**: All imports used properly

## Estimated Time: 2.5 hours total
- Phase 1: 30 minutes
- Phase 2: 15 minutes  
- Phase 3: 20 minutes
- Phase 4: 45 minutes
- Phase 5: 30 minutes

## Next Steps
1. Create the branch: `git checkout -b refactor/topnav-architecture`
2. Follow the phases in order
3. Test thoroughly before merging
4. Create PR with detailed description of changes