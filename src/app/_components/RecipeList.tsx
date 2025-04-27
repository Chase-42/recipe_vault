'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { schemas } from '~/lib/schemas';
import { cn } from '~/lib/utils';
import { useSearch } from '~/providers';
import type { Category } from '~/types/category';
import type {
  RecipeWithCategories,
  PaginatedRecipes,
  SortOption,
} from '~/lib/schemas';

import LoadingSpinner from '~/app/_components/LoadingSpinner';

// Components
import RecipeCard from './RecipeCard';
import RecipeFilters from './RecipeFilters';
import RecipePagination from './RecipePagination';

import { useFavoriteToggle } from '~/hooks/useFavoriteToggle';
import { useRecipeFiltering } from '~/hooks/useRecipeFiltering';
import { useUrlParams } from '~/hooks/useUrlParams';
import { deleteRecipe, fetchRecipe, fetchRecipes } from '~/utils/recipeService';

const ITEMS_PER_PAGE = 12;

interface RecipeListProps {
  initialData: {
    recipes: RecipeWithCategories[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

// Update the fetchRecipes function type
const fetchRecipesWithTypes = async (
  offset: number,
  limit: number
): Promise<PaginatedRecipes> => {
  const response = await fetchRecipes(offset, limit);
  const validatedRecipes = response.recipes.map((recipe) =>
    schemas.recipeWithCategories.parse(recipe)
  );

  return {
    recipes: validatedRecipes,
    pagination: {
      total: response.pagination.total,
      offset,
      limit,
      totalPages: Math.ceil(response.pagination.total / limit),
      currentPage: Math.floor(offset / limit) + 1,
      hasNextPage: offset + limit < response.pagination.total,
      hasPreviousPage: offset > 0,
    },
  };
};

export default function RecipeList({ initialData }: RecipeListProps) {
  const { searchTerm } = useSearch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { updateParam, getParam } = useUrlParams();
  const { toggleFavorite } = useFavoriteToggle();

  // State
  const [gridView, setGridView] = useState<'grid' | 'list'>('grid');
  const [_showScrollTop, setShowScrollTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // URL params
  const currentPage = Number(getParam('page')) || 1;
  const sortOption = schemas.sortOption.parse(getParam('sort') ?? 'newest');
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Scroll handler
  useEffect(() => {
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    // Check initial scroll position
    handleScroll();

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const _scrollToTop = useCallback(() => {
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;

    scrollContainer.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // Data fetching with initial data
  const { data, isLoading } = useQuery<PaginatedRecipes>({
    queryKey: ['recipes', offset],
    queryFn: async () => {
      const response = await fetchRecipesWithTypes(offset, ITEMS_PER_PAGE);

      return response;
    },
    initialData:
      currentPage === 1
        ? {
            recipes: initialData.recipes.map((recipe) =>
              schemas.recipeWithCategories.parse(recipe)
            ),
            pagination: {
              total: initialData.total,
              offset: 0,
              limit: ITEMS_PER_PAGE,
              totalPages: Math.ceil(initialData.total / ITEMS_PER_PAGE),
              currentPage: 1,
              hasNextPage: initialData.total > ITEMS_PER_PAGE,
              hasPreviousPage: false,
            },
          }
        : undefined,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Update the recipes type
  const recipes = useMemo(() => data?.recipes ?? [], [data?.recipes]);
  const totalPages = data?.pagination?.totalPages ?? 0;
  const total = data?.pagination?.total ?? 0;

  // Effect to handle page changes
  useEffect(() => {
    if (currentPage > 1) {
      void queryClient.invalidateQueries({ queryKey: ['recipes'] });
    }
  }, [currentPage, queryClient]);

  // Update the category filter
  const categoryFilteredRecipes = useMemo(
    () =>
      selectedCategory && selectedCategory !== 'all'
        ? recipes.filter((r) => r.categories === selectedCategory)
        : recipes,
    [recipes, selectedCategory]
  );

  // Delete mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['recipes'] });
      const previousRecipes = queryClient.getQueryData<PaginatedRecipes>([
        'recipes',
      ]);

      if (previousRecipes) {
        queryClient.setQueryData<PaginatedRecipes>(['recipes'], (old) => {
          if (!old) return old;
          return {
            ...old,
            recipes: old.recipes.filter((recipe) => recipe.id !== id),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        });
      }

      return { previousRecipes };
    },
    onError: (_, __, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(['recipes'], context.previousRecipes);
      }
      toast.error('Failed to delete recipe');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted successfully');
    },
  });

  // Event handlers
  const handleDelete = useCallback(
    (id: number) => {
      void deleteRecipeMutation.mutateAsync(id);
    },
    [deleteRecipeMutation]
  );

  const handlePageChange = (page: number) => {
    updateParam('page', page.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = useCallback(
    (value: SortOption) => {
      updateParam('sort', value);
      if (currentPage !== 1) {
        updateParam('page', '1');
      }
    },
    [currentPage, updateParam]
  );

  // Filter and sort recipes
  const filteredAndSortedRecipes = useRecipeFiltering(
    categoryFilteredRecipes,
    searchTerm,
    sortOption
  );

  // Smart preloading on hover with rate limiting
  const handleRecipeHover = useCallback(
    (recipe: RecipeWithCategories) => {
      const cacheKey = ['preloadedImages', recipe.id];
      if (!queryClient.getQueryData(cacheKey)) {
        // Load image
        const img = new Image();
        img.src = recipe.imageUrl;
        img.onload = () => {
          queryClient.setQueryData(cacheKey, true);
        };

        // Prefetch recipe data
        void queryClient.prefetchQuery({
          queryKey: ['recipe', recipe.id],
          queryFn: () => fetchRecipe(recipe.id),
          staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
        });

        // Prefetch related routes
        void router.prefetch(`/img/${recipe.id}`);
        void router.prefetch(`/edit/${recipe.id}`);
      }
    },
    [queryClient, router]
  );

  // Update prefetching to use typed function
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (currentPage < totalPages) {
      timeoutId = setTimeout(() => {
        const nextPageOffset = currentPage * ITEMS_PER_PAGE;
        void queryClient.prefetchQuery({
          queryKey: ['recipes', nextPageOffset],
          queryFn: () => fetchRecipesWithTypes(nextPageOffset, ITEMS_PER_PAGE),
          staleTime: 1000 * 30, // Consider data fresh for 30 seconds
        });
      }, 1000); // Delay prefetching by 1 second
    }

    return () => clearTimeout(timeoutId);
  }, [currentPage, totalPages, queryClient]);

  // Update the favorite toggle
  const handleFavoriteToggle = useCallback(
    (id: number) => {
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) return;
      toggleFavorite(recipe);
    },
    [recipes, toggleFavorite]
  );

  return (
    <div className="p-4">
      <RecipeFilters
        total={total}
        offset={offset}
        itemsPerPage={ITEMS_PER_PAGE}
        gridView={gridView}
        setGridView={setGridView}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />

      <div className="min-h-[calc(100vh-160px)]">
        <div
          className={cn(
            'flex gap-6 pb-8',
            gridView === 'grid'
              ? 'mx-auto flex w-full max-w-[1200px] flex-wrap justify-center'
              : 'mx-auto w-full max-w-3xl flex-col items-center'
          )}
        >
          {data?.recipes && filteredAndSortedRecipes.length === 0 ? (
            <div className="flex h-[50vh] w-full items-center justify-center text-lg text-muted-foreground">
              No recipes found
            </div>
          ) : (
            filteredAndSortedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onMouseEnter={() => handleRecipeHover(recipe)}
                className={cn(
                  gridView === 'grid' &&
                    'w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]'
                )}
              >
                <RecipeCard
                  recipe={recipe}
                  onDelete={handleDelete}
                  onFavoriteToggle={handleFavoriteToggle}
                  priority={currentPage === 1 && recipe.id <= 4}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <RecipePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
