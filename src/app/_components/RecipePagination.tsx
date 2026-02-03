"use client";

import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { cn } from "~/lib/utils";

interface RecipePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function RecipePagination({
  currentPage,
  totalPages,
  onPageChange,
}: RecipePaginationProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll handler
  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    // Check initial scroll position
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    scrollContainer.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Calculate which page numbers to display with ellipsis for overflow prevention
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const siblingsCount = 1; // Pages to show on each side of current

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const leftSibling = Math.max(2, currentPage - siblingsCount);
    const rightSibling = Math.min(totalPages - 1, currentPage + siblingsCount);

    // Add ellipsis after first page if needed
    if (leftSibling > 2) {
      pages.push("ellipsis");
    }

    // Add pages around current
    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (rightSibling < totalPages - 1) {
      pages.push("ellipsis");
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <>
      <div className="mt-8 flex justify-center">
        <Pagination>
          <PaginationContent className="flex-wrap gap-1">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                className={
                  currentPage <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {pageNumbers.map((page, index) =>
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                className={
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Button
        variant="outline"
        size="icon"
        className={cn(
          "fixed z-[100] h-11 w-11 rounded-full bg-black text-white transition-all duration-300",
          "bottom-[max(2rem,env(safe-area-inset-bottom))] right-[max(2rem,env(safe-area-inset-right))]",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </>
  );
}
