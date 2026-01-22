"use client";
import { authClient } from "~/lib/auth-client";
import { Plus, Search, ShoppingCart, Calendar, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSearch } from "~/providers";
import type { Session, User } from "better-auth/types";

interface AuthSession {
  session: Session;
  user: User;
}

const Modal = dynamic(() => import("./Modal").then((mod) => mod.Modal), {
  ssr: false,
  loading: () => null,
});

const AddRecipe = dynamic(() => import("./AddRecipe"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-red-800" />
    </div>
  ),
});

interface TopNavProps {
  showSearch?: boolean;
  showActions?: boolean;
  session: AuthSession | null;
}

export const TopNav = ({ 
  showSearch = true, 
  showActions = true,
  session 
}: TopNavProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { searchTerm, setSearchTerm } = useSearch();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  // Check if focused page - this will be false on initial render, then update after hydration
  const isFocusedPage =
    pathname?.startsWith("/img/") ||
    pathname === "/add" ||
    pathname?.startsWith("/edit/") ||
    pathname?.startsWith("/print/") ||
    pathname === "/shopping-lists" ||
    pathname === "/meal-planner";

  // Update grid offset CSS variable when nav height changes
  useEffect(() => {
    if (isFocusedPage) {
      document.documentElement.style.setProperty("--grid-offset", "0px");
      return;
    }

    const updateGridOffset = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--grid-offset",
          `${height}px`
        );
      } else {
        document.documentElement.style.setProperty("--grid-offset", "0px");
      }
    };

    const timeoutId = setTimeout(updateGridOffset, 0);
    window.addEventListener("resize", updateGridOffset);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateGridOffset);
    };
  }, [isFocusedPage]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  if (!session) {
    return null;
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (session.user.name) {
      const names = session.user.name.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0]![0]?.toUpperCase()}${names[names.length - 1]![0]?.toUpperCase()}`;
      }
      return names[0]![0]?.toUpperCase() ?? "U";
    }
    if (session.user.email) {
      return session.user.email[0]?.toUpperCase() ?? "U";
    }
    return "U";
  };

  return (
    <nav 
      ref={navRef}
      className={`z-50 flex flex-col items-center justify-between border-b bg-black p-4 text-xl font-semibold md:flex-row print:hidden ${isFocusedPage ? "hidden" : ""}`}
    >
      <div className="mb-4 flex items-center gap-2 md:mb-0">
        <Image
          src="/recipe_vault_image.svg"
          alt="Recipe Vault Icon"
          width={28}
          height={28}
        />
        <Link href="/" className="text-white hover:underline">
          Recipe Vault
        </Link>
      </div>

      <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
        {showSearch && (
          <div className="relative md:mr-6">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={isSearchFocused ? "Search recipes..." : "Search"}
              className="pl-9 w-28 focus:w-64 transition-[width] duration-300 placeholder:text-zinc-400"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
          </div>
        )}
        <div className="flex items-center gap-6">
          {showActions && (
            <>
              <Button
                onClick={handleOpenModal}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link href="/meal-planner">
                  <Calendar className="h-4 w-4" />
                  Meal Planner
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link href="/shopping-lists">
                  <ShoppingCart className="h-4 w-4" />
                  Shopping Lists
                </Link>
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-white transition-colors hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                aria-label="User menu"
              >
                {getUserInitials()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user.name || "User"}
                  </p>
                  {session.user.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-950/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showActions && isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <AddRecipe onSuccess={handleCloseModal} />
        </Modal>
      )}
    </nav>
  );
};