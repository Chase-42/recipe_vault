"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { ValidationError } from "~/lib/errors";

interface HeaderRecipeData {
  id: number;
  name: string;
  favorite: boolean;
}

interface HeaderContextType {
  recipeData: HeaderRecipeData | null;
  setRecipeData: (data: HeaderRecipeData | null) => void;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [recipeData, setRecipeData] = useState<HeaderRecipeData | null>(null);

  return (
    <HeaderContext.Provider value={{ recipeData, setRecipeData }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeaderContext() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new ValidationError(
      "useHeaderContext must be used within a HeaderProvider"
    );
  }
  return context;
}
