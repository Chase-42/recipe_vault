# Codebase Cleanup Plan

## Priority 1: Critical Issues (High Impact, Low Effort)

### 1.1 Remove Dead Code
- [ ] Remove Flask development script from package.json
- [ ] Clean up unused imports across components
- [ ] Remove TODO comment and implement or document logging strategy

### 1.2 Fix Memory Leak
- [ ] Fix cache implementation in `duplicateDetection.ts`
- [ ] Implement proper LRU cache or use a library

### 1.3 Replace Console Statements
- [ ] Replace all console.log/warn/error with logger in production code
- [ ] Keep performance logging conditional on development mode
- [ ] Update error handling in hooks to use logger

## Priority 2: Code Quality (Medium Impact, Medium Effort)

### 2.1 Break Down Large Components
- [ ] Split `EnhancedGeneratedShoppingList.tsx` into smaller components:
  - [ ] Extract `IngredientsList` component
  - [ ] Extract `ExistingItemsPanel` component  
  - [ ] Extract `BulkActions` component
  - [ ] Create custom hooks for state management

### 2.2 Improve Type Safety
- [ ] Replace `any` types with specific types where possible
- [ ] Add stricter typing to utility functions
- [ ] Review and improve generic function signatures

### 2.3 Optimize Performance
- [ ] Optimize duplicate detection algorithm
- [ ] Add memoization to expensive calculations
- [ ] Review and optimize React re-renders

## Priority 3: Code Organization (Low Impact, High Value)

### 3.1 Simplify Complex Logic
- [ ] Refactor `duplicateDetection.ts` nested logic
- [ ] Extract constants for magic numbers
- [ ] Improve function single responsibility

### 3.2 Improve Error Handling
- [ ] Make error messages more specific
- [ ] Add better error boundaries
- [ ] Improve validation error messages

### 3.3 Documentation & Standards
- [ ] Add JSDoc for complex utility functions
- [ ] Create coding standards document
- [ ] Add performance monitoring guidelines

## Implementation Order

1. **Week 1**: Priority 1 items (quick wins)
2. **Week 2**: Component refactoring (Priority 2.1)
3. **Week 3**: Type safety improvements (Priority 2.2)
4. **Week 4**: Performance optimizations (Priority 2.3)
5. **Week 5**: Code organization cleanup (Priority 3)

## Success Metrics

- [ ] Zero console.log statements in production code
- [ ] All components under 200 lines
- [ ] No `any` types except in test files
- [ ] Memory usage stable over time
- [ ] Bundle size reduction of 5-10%
- [ ] Improved TypeScript strict mode compliance

## Files to Focus On

### High Priority
- `src/components/shopping-lists/EnhancedGeneratedShoppingList.tsx`
- `src/utils/duplicateDetection.ts`
- `src/hooks/useDragAndDrop.ts`
- `package.json`

### Medium Priority
- `src/hooks/usePerformanceMonitor.ts`
- `src/utils/performance.ts`
- `src/app/meal-planner/MealPlannerClient.tsx`

### Low Priority
- Various utility files with minor type improvements
- Test files with `as any` usage (acceptable but could be improved)