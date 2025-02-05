"use client";
import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";

interface SearchContextProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            refetchOnWindowFocus: true,
            retry: 1,
          },
          mutations: {
            onSettled: async () => {
              await queryClient.invalidateQueries({ queryKey: ["recipes"] });
            },
          },
        },
      }),
  );

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
