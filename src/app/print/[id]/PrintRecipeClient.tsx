'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import Image from 'next/image';
import LoadingSpinner from '~/app/_components/LoadingSpinner';
import { Button } from '~/components/ui/button';
import { fetchRecipe } from '~/utils/recipeService';

export default function PrintRecipeClient({ id }: { id: number }) {
  const { data: recipe, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipe(id),
  });

  if (error) return <div>Failed to load recipe</div>;
  if (!recipe) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-4">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Print Recipe</h1>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <article className="space-y-6">
        <h1 className="text-3xl font-bold">{recipe.name}</h1>

        <div className="relative h-64 w-full overflow-hidden rounded-lg">
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            className="object-cover print:absolute print:h-48 print:w-48"
            priority
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Added {format(new Date(recipe.createdAt), 'MMMM d, yyyy')}
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Ingredients</h2>
          <pre className="whitespace-pre-wrap font-serif">
            {recipe.ingredients}
          </pre>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Instructions</h2>
          <pre className="whitespace-pre-wrap font-serif">
            {recipe.instructions}
          </pre>
        </section>
      </article>

      <style jsx global>{`
        @media print {
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          body {
            font-size: 12pt;
          }
          pre {
            white-space: pre-wrap;
          }
        }
      `}</style>
    </div>
  );
}
