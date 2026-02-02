"use client";

import { authClient } from "~/lib/auth-client";
import {
  Plus,
  Search,
  ShoppingCart,
  Calendar,
  LogOut,
  ArrowLeft,
  Edit,
  Menu,
  X,
} from "lucide-react";
import { IconHeart } from "@tabler/icons-react";
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
import { useSearch, useHeaderContext, useSession } from "~/providers";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { cn } from "~/lib/utils";
import { Drawer } from "~/components/ui/drawer";

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

interface HeaderConfig {
  hidden: boolean;
  showBackButton: boolean;
  backDestination: string;
  title: string | null;
  showLogo: boolean;
  showSearch: boolean;
  showNav: boolean;
  showUserMenu: boolean;
  showRecipeActions: boolean;
}

function getHeaderConfig(pathname: string | null): HeaderConfig {
  // Auth pages - no header
  if (pathname?.startsWith("/sign-") || pathname === "/sso-callback") {
    return {
      hidden: true,
      showBackButton: false,
      backDestination: "/",
      title: null,
      showLogo: false,
      showSearch: false,
      showNav: false,
      showUserMenu: false,
      showRecipeActions: false,
    };
  }

  // Home page - full header
  if (pathname === "/") {
    return {
      hidden: false,
      showBackButton: false,
      backDestination: "/",
      title: null,
      showLogo: true,
      showSearch: true,
      showNav: true,
      showUserMenu: true,
      showRecipeActions: false,
    };
  }

  // Add Recipe
  if (pathname === "/add") {
    return {
      hidden: false,
      showBackButton: true,
      backDestination: "/",
      title: "Add Recipe",
      showLogo: false,
      showSearch: false,
      showNav: false,
      showUserMenu: true,
      showRecipeActions: false,
    };
  }

  // Edit Recipe
  if (pathname?.startsWith("/edit/")) {
    return {
      hidden: false,
      showBackButton: true,
      backDestination: "/",
      title: "Edit Recipe",
      showLogo: false,
      showSearch: false,
      showNav: false,
      showUserMenu: true,
      showRecipeActions: false,
    };
  }

  // Meal Planner - no back button (it's in sidebar)
  if (pathname === "/meal-planner") {
    return {
      hidden: false,
      showBackButton: false,
      backDestination: "/",
      title: "Meal Planner",
      showLogo: false,
      showSearch: false,
      showNav: false,
      showUserMenu: true,
      showRecipeActions: false,
    };
  }

  // Shopping Lists
  if (pathname === "/shopping-lists") {
    return {
      hidden: false,
      showBackButton: true,
      backDestination: "/",
      title: "Shopping Lists",
      showLogo: false,
      showSearch: false,
      showNav: false,
      showUserMenu: true,
      showRecipeActions: false,
    };
  }

  // Print page - render but print:hidden
  if (pathname?.startsWith("/print/")) {
    return {
      hidden: false,
      showBackButton: true,
      backDestination: "/",
      title: "Print Recipe",
      showLogo: false,
      showSearch: false,
      showNav: false,
      showUserMenu: false,
      showRecipeActions: false,
    };
  }

  // Image viewer - show recipe actions
  if (pathname?.startsWith("/img/")) {
    return {
      hidden: false,
      showBackButton: true,
      backDestination: "/",
      title: null, // Will use recipe name from context
      showLogo: false,
      showSearch: false,
      showNav: false,
      showUserMenu: true,
      showRecipeActions: true,
    };
  }

  // Default - minimal header
  return {
    hidden: false,
    showBackButton: false,
    backDestination: "/",
    title: null,
    showLogo: true,
    showSearch: false,
    showNav: false,
    showUserMenu: true,
    showRecipeActions: false,
  };
}

export function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { searchTerm, setSearchTerm } = useSearch();
  const { recipeData } = useHeaderContext();
  const { toggleFavorite } = useFavoriteToggle();
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);

  const session = useSession();
  const config = getHeaderConfig(pathname);

  // Update grid offset CSS variable when header height changes
  useEffect(() => {
    if (config.hidden || !session) {
      document.documentElement.style.setProperty("--grid-offset", "0px");
      return;
    }

    const updateGridOffset = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
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
  }, [config.hidden, session, pathname]);

  // Close nav drawer and mobile search on route change
  useEffect(() => {
    setIsNavDrawerOpen(false);
    setIsMobileSearchExpanded(false);
  }, [pathname]);

  // Focus mobile search input when expanded
  useEffect(() => {
    if (isMobileSearchExpanded && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [isMobileSearchExpanded]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenModalFromDrawer = () => {
    setIsNavDrawerOpen(false);
    // Small delay to let drawer close animation start
    setTimeout(() => {
      setIsModalOpen(true);
    }, 150);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const handleToggleFavorite = () => {
    if (recipeData) {
      toggleFavorite(recipeData);
    }
  };

  // No header if hidden or not authenticated
  if (config.hidden || !session) {
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

  // Determine title - use recipe name if showing recipe actions and we have data
  const displayTitle = config.showRecipeActions && recipeData
    ? recipeData.name
    : config.title;

  return (
    <>
      <header
        ref={headerRef}
        className="z-50 flex items-center justify-between border-b bg-black px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-xl font-semibold print:hidden sm:px-4 sm:py-4 sm:pt-[max(1rem,env(safe-area-inset-top))]"
      >
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {config.showBackButton && (
            <Link
              href={config.backDestination}
              className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}

          {config.showLogo && (
            <Link href="/" className="flex h-11 min-w-[44px] items-center gap-2">
              <Image
                src="/recipe_vault_image.svg"
                alt="Recipe Vault Icon"
                width={28}
                height={28}
                className="flex-shrink-0"
              />
              <span className="hidden text-white hover:underline sm:inline">
                Recipe Vault
              </span>
            </Link>
          )}

          {displayTitle && (
            <h1 className="max-w-[120px] truncate text-base font-bold sm:max-w-[180px] sm:text-lg md:max-w-[280px]">
              {displayTitle}
            </h1>
          )}

          {/* Recipe Actions (edit, favorite) for image viewer */}
          {config.showRecipeActions && recipeData && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/edit/${recipeData.id}`)}
                className="h-11 w-11 text-white hover:bg-zinc-800"
                aria-label="Edit recipe"
              >
                <Edit className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="h-11 w-11 text-white hover:bg-zinc-800"
                aria-label={recipeData.favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <IconHeart
                  size={20}
                  className={cn(
                    "transition-colors duration-300",
                    recipeData.favorite
                      ? "text-destructive fill-current"
                      : "text-white"
                  )}
                  strokeWidth={2}
                />
              </Button>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Mobile search - icon that expands to full-width */}
          {config.showSearch && (
            <div className="md:hidden">
              {isMobileSearchExpanded ? (
                <div className="relative flex items-center">
                  <Input
                    ref={mobileSearchRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
                      // Delay to allow click events to fire
                      setTimeout(() => setIsMobileSearchExpanded(false), 150);
                    }}
                    placeholder="Search recipes..."
                    className="w-[200px] pl-9 pr-9 placeholder:text-zinc-400"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setIsMobileSearchExpanded(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4 text-zinc-400" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileSearchExpanded(true)}
                  className="h-11 w-11 text-white hover:bg-zinc-800"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {/* Desktop search - expand on focus */}
          {config.showSearch && (
            <div className="relative hidden md:block">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={isSearchFocused ? "Search recipes..." : "Search"}
                className="w-32 pl-9 transition-[width] duration-300 placeholder:text-zinc-400 focus:w-72 lg:focus:w-80"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          )}

          {/* Mobile hamburger menu - visible below md */}
          {config.showNav && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNavDrawerOpen(true)}
              className="h-11 w-11 text-white hover:bg-zinc-800 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}

          {/* Desktop nav - hidden below md */}
          {config.showNav && (
            <div className="hidden items-center gap-4 md:flex">
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
            </div>
          )}

          {config.showUserMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-white transition-colors hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
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
                  className="cursor-pointer text-red-400 focus:bg-red-950/20 focus:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {config.showNav && (
        <Drawer
          open={isNavDrawerOpen}
          onOpenChange={setIsNavDrawerOpen}
          side="left"
        >
          <nav className="flex flex-col p-6 pt-12">
            <div className="mb-6 flex items-center gap-3">
              <Image
                src="/recipe_vault_image.svg"
                alt="Recipe Vault"
                width={32}
                height={32}
              />
              <span className="text-lg font-semibold">Recipe Vault</span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleOpenModalFromDrawer}
                className="h-12 w-full justify-start gap-3 text-base"
              >
                <Plus className="h-5 w-5" />
                Add Recipe
              </Button>

              <Button
                asChild
                variant="ghost"
                className="h-12 w-full justify-start gap-3 text-base"
              >
                <Link
                  href="/meal-planner"
                  onClick={() => setIsNavDrawerOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  Meal Planner
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="h-12 w-full justify-start gap-3 text-base"
              >
                <Link
                  href="/shopping-lists"
                  onClick={() => setIsNavDrawerOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Shopping Lists
                </Link>
              </Button>
            </div>
          </nav>
        </Drawer>
      )}

      {config.showNav && isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <AddRecipe onSuccess={handleCloseModal} />
        </Modal>
      )}
    </>
  );
}
