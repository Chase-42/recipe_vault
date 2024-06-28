"use client";
import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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


const ClientProvider = ({ children }: { children: ReactNode }) => {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

export default ClientProvider;