"use client";
import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
  MutationCache,
} from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";

interface SearchContextProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

type MutationContext = {
  invalidateQueries?: { queryKey: QueryKey }[];
};

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextProps => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => {
    const mutationCache = new MutationCache({
      onSettled: async (_, error, __, context) => {
        const mutationContext = context as MutationContext | undefined;
        if (!error && mutationContext?.invalidateQueries) {
          await Promise.all(
            mutationContext.invalidateQueries.map((query) =>
              queryClient.invalidateQueries(query),
            ),
          );
        }
      },
    });

    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60, // 1 minute
          refetchOnWindowFocus: "always",
          retry: 3,
          retryDelay: (attemptIndex) =>
            Math.min(1000 * 2 ** attemptIndex, 30000),
          gcTime: 1000 * 60 * 5, // 5 minutes
        },
        mutations: {
          retry: false,
        },
      },
      mutationCache,
    });
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const AnimatePresenceContext = createContext<ReactNode | undefined>(undefined);

export const AnimatePresenceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <AnimatePresenceContext.Provider value={children}>
      <AnimatePresence>{children}</AnimatePresence>
    </AnimatePresenceContext.Provider>
  );
};

export const useAnimatePresence = (): ReactNode => {
  const context = useContext(AnimatePresenceContext);
  if (!context) {
    throw new Error(
      "useAnimatePresence must be used within an AnimatePresenceProvider",
    );
  }
  return context;
};
