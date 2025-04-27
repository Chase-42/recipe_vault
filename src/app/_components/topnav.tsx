"use client";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Plus, Search, ShoppingCart } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useSearch } from "../../providers";

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

export const TopNav = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { searchTerm, setSearchTerm } = useSearch();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <nav className="z-50 flex flex-col items-center justify-between border-b p-4 text-xl font-semibold md:flex-row">
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
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-9 md:w-[300px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenModal}
              type="button"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
            <Link href="/shopping-lists">
              <Button variant="outline" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Shopping Lists
              </Button>
            </Link>
            <UserButton />
          </div>
        </SignedIn>
      </div>

      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <AddRecipe onSuccess={handleCloseModal} />
        </Modal>
      )}
    </nav>
  );
};
