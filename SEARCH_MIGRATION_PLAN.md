# Recipe Search Migration Plan

## Current Implementation Analysis

### Frontend Search (Fuse.js)
- Weighted search fields:
  - name (0.6)
  - categories (0.2)
  - tags (0.2)
- Fuzzy matching threshold: 0.4
- Client-side sorting: favorite, newest, oldest
- Search highlighting with match indices
- Memoized operations for performance

### Database
- Existing search index on:
  - name
  - instructions
  - ingredients
- Using Drizzle's index API
- Already structured for text search

### API
- Rate limited (100 req/min)
- Clerk authentication
- Pagination (12 items per page, max 100)
- Error handling with custom error types
- No search parameters yet

## Implementation Steps

### 1. Backend Search Implementation
Location: `src/server/queries.ts`

1. Create base query builder:
```typescript
function buildBaseQuery(userId: string) {
  return db
    .select({
      id: recipes.id,
      userId: recipes.userId,
      name: recipes.name,
      link: recipes.link,
      ingredients: recipes.ingredients,
      instructions: recipes.instructions,
      imageUrl: recipes.imageUrl,
      blurDataUrl: recipes.blurDataUrl,
      favorite: recipes.favorite,
      createdAt: recipes.createdAt,
      categories: recipes.categories,
      tags: recipes.tags,
    })
    .from(recipes)
    .where(eq(recipes.userId, userId));
}
```

2. Create search conditions builder:
```typescript
function addSearchConditions(query: any, searchQuery?: string) {
  if (!searchQuery) return query;
  
  const searchTerm = `%${searchQuery}%`;
  return query.where(
    or(
      ilike(recipes.name, searchTerm),
      ilike(recipes.instructions, searchTerm),
      ilike(recipes.ingredients, searchTerm)
    )
  );
}
```

3. Create category filter builder:
```typescript
function addCategoryFilter(query: any, category?: Category) {
  if (!category || category === 'all') return query;
  
  return query.where(sql`${recipes.categories} @> ARRAY[${category}]::text[]`);
}
```

4. Create sorting builder:
```typescript
function addSorting(query: any, sortBy?: 'newest' | 'oldest' | 'favorite' | 'relevance', searchQuery?: string) {
  switch (sortBy) {
    case 'favorite':
      return query.orderBy(desc(recipes.favorite), desc(recipes.createdAt));
    case 'oldest':
      return query.orderBy(recipes.createdAt);
    case 'relevance':
      if (searchQuery) {
        return query.orderBy(
          sql`similarity(${recipes.name}, ${searchQuery}) + 
              similarity(${recipes.instructions}, ${searchQuery}) + 
              similarity(${recipes.ingredients}, ${searchQuery})`.desc()
        );
      }
      return query.orderBy(desc(recipes.createdAt));
    default: // 'newest' or undefined
      return query.orderBy(desc(recipes.createdAt));
  }
}
```

5. Create pagination builder:
```typescript
function addPagination(query: any, offset: number, limit: number) {
  return query.offset(offset).limit(limit);
}
```

6. Update main getMyRecipes function:
```typescript
export async function getMyRecipes(
  userId: string,
  offset: number,
  limit: number,
  options?: {
    searchQuery?: string;
    category?: Category;
    sortBy?: 'newest' | 'oldest' | 'favorite' | 'relevance';
  }
) {
  // Build base query
  let query = buildBaseQuery(userId);
  
  // Add search conditions
  query = addSearchConditions(query, options?.searchQuery);
  
  // Add category filter
  query = addCategoryFilter(query, options?.category);
  
  // Get total count
  const [countResult] = await query
    .select({ count: sql<number>`count(*)` })
    .execute();
  const total = Number(countResult?.count ?? 0);
  
  // Add sorting
  query = addSorting(query, options?.sortBy, options?.searchQuery);
  
  // Add pagination
  query = addPagination(query, offset, limit);
  
  // Execute query
  const paginatedRecipes = await query.execute();
  
  return {
    recipes: paginatedRecipes,
    total,
  };
}
```

### 2. API Updates
Location: `src/app/api/recipes/route.ts`

1. Add search params schema:
```typescript
const searchParamsSchema = z.object({
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(100).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  category: z.enum(['all', ...MAIN_MEAL_CATEGORIES]).default('all'),
  sort: z.enum(['newest', 'oldest', 'favorite', 'relevance']).default('newest'),
});
```

2. Update GET handler:
```typescript
// Parse and validate search parameters
const params = {
  offset: Number(url.searchParams.get('offset')) ?? 0,
  limit: Number(url.searchParams.get('limit')) ?? DEFAULT_LIMIT,
  search: url.searchParams.get('search') ?? undefined,
  category: url.searchParams.get('category') ?? 'all',
  sort: url.searchParams.get('sort') ?? 'newest',
};

const validatedParams = searchParamsSchema.parse(params);

const { recipes: recipeList, total } = await getMyRecipes(
  userId,
  validatedParams.offset,
  validatedParams.limit,
  {
    searchQuery: validatedParams.search,
    category: validatedParams.category as Category,
    sortBy: validatedParams.sort as 'newest' | 'oldest' | 'favorite' | 'relevance',
  }
);
```

### 3. Frontend Updates

#### A. Update Recipe Service
Location: `src/utils/recipeService.ts`

1. Add search params interface:
```typescript
interface FetchRecipesParams {
  offset?: number;
  limit?: number;
  searchTerm?: string;
  category?: Category;
  sortOption?: 'newest' | 'oldest' | 'favorite' | 'relevance';
}
```

2. Update fetchRecipes function:
```typescript
export const fetchRecipes = ({
  offset = 0,
  limit = 12,
  searchTerm,
  category,
  sortOption,
}: FetchRecipesParams = {}): Promise<PaginatedRecipes> => {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (searchTerm) params.append('search', searchTerm);
  if (category) params.append('category', category);
  if (sortOption) params.append('sort', sortOption);

  return fetch(`/api/recipes?${params.toString()}`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    })
    .then((data) => {
      try {
        return schemas.paginatedRecipes.parse(data);
      } catch (error) {
        console.error("Validation error:", error);
        console.error("Received data:", data);
        throw error;
      }
    });
};
```

#### B. Update Recipe Filtering Hook
Location: `src/hooks/useRecipeFiltering.ts`

1. Remove Fuse.js and update hook:
```typescript
export function useRecipeFiltering(
  searchTerm: string,
  sortOption: SortOption,
  category: Category,
  page: number = 1,
  itemsPerPage: number = 12
) {
  const { data, isLoading } = useQuery({
    queryKey: ['recipes', { searchTerm, sortOption, category, page }],
    queryFn: () => fetchRecipes({
      searchTerm,
      sortOption,
      category,
      offset: (page - 1) * itemsPerPage,
      limit: itemsPerPage,
    }),
  });

  return {
    recipes: data?.recipes ?? [],
    isLoading,
    pagination: data?.pagination,
  };
}
```

#### C. Update RecipeList Component
Location: `src/app/_components/RecipeList.tsx`

1. Update data fetching:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['recipes', { searchTerm, sortOption, category, page }],
  queryFn: () => fetchRecipes({ 
    searchTerm, 
    sortOption, 
    category,
    offset: (page - 1) * ITEMS_PER_PAGE,
    limit: ITEMS_PER_PAGE 
  }),
});
```

2. Add loading state:
```typescript
{isLoading ? (
  <LoadingSpinner />
) : (
  // Existing recipe list rendering
)}
```

#### D. Update RecipeCard Component
Location: `src/app/_components/RecipeCard.tsx`

1. Update search match interface:
```typescript
interface SearchMatch {
  field: 'name' | 'instructions' | 'ingredients';
  indices: Array<[number, number]>;
}
```

2. Update highlighting logic to use backend match data

## Testing Steps

1. Backend Testing:
   - Test search with various queries
   - Test category filtering
   - Test sorting options
   - Test pagination with search
   - Verify performance

2. API Testing:
   - Test all parameter combinations
   - Test validation
   - Test error handling
   - Test rate limiting

3. Frontend Testing:
   - Test search functionality
   - Test loading states
   - Test pagination
   - Test error handling
   - Test performance

## Rollback Plan

1. Keep Fuse.js implementation in separate branch
2. Maintain current API endpoint
3. Add feature flag for new search
4. Monitor performance metrics

## Success Criteria

1. Performance:
   - Search response < 200ms
   - No client-side performance impact
   - Reduced memory usage

2. Functionality:
   - All current features maintained
   - Improved search accuracy
   - Better handling of large datasets

3. User Experience:
   - No visible changes to UI
   - Maintained search highlighting
   - Smooth pagination

## Dependencies

- PostgreSQL 12+
- Drizzle ORM
- Next.js 14+
- React Query
- Clerk Auth

## Timeline Estimate

1. Backend Implementation: 2 days
2. API Updates: 1 day
3. Frontend Updates: 2 days
4. Testing: 2 days
5. Total: 7 days

## Future Improvements

1. Search Analytics
2. Search Suggestions
3. Advanced Filtering
4. Search History
5. Personalization 