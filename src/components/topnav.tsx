"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import AddRecipe from "./AddRecipe";
import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { useSearch } from "../providers";

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
		<nav className="flex w-full items-center justify-between border-b p-4 text-xl font-semibold">
			<div>Recipes</div>

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
