"use client";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import AddRecipe from "./AddRecipe";
import { Modal } from "./Modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useSearch } from "../../providers";
import { motion } from "framer-motion";
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
    <nav className="z-50 flex w-full items-center justify-between border-b p-4 text-xl font-semibold">
      <div className="flex items-center gap-2">
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

      <div className="flex flex-row items-center gap-4">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <Button onClick={handleOpenModal} type="button">
            Add Recipe
          </Button>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipes..."
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
