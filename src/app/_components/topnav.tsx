"use client";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import AddRecipe from "./AddRecipe";
import { Modal } from "./Modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useSearch } from "../../providers";
import Link from "next/link";
import Image from "next/image";

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
          <Button
            onClick={handleOpenModal}
            type="button"
            className="w-full md:w-auto"
          >
            Add Recipe
          </Button>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipes..."
            className="w-full md:w-auto"
          />
          <UserButton />
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
