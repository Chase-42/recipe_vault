"use client";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import type React from "react";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface SearchContextProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
}

type MutationContext = {
  invalidateQueries?: { queryKey: QueryKey }[];
};

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <SearchContext.Provider
      value={{ searchTerm, setSearchTerm, debouncedSearchTerm }}
    >
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
              queryClient.invalidateQueries(query)
            )
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
      "useAnimatePresence must be used within an AnimatePresenceProvider"
    );
  }
  return context;
};
