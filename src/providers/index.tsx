"use client";
import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";

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
