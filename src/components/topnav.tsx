"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import AddRecipe from "./AddRecipe";
import { Modal } from "./Modal";

export const TopNav = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);

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
					<button
						onClick={handleOpenModal}
						className="px-4 py-2 text-white bg-red-800 rounded-md hover:bg-red-500"
						type="button"
					>
						Add Recipe
					</button>
					<UserButton />
				</SignedIn>
			</div>

			{isModalOpen && (
				<Modal onClose={handleCloseModal}>
					<AddRecipe />
				</Modal>
			)}
		</nav>
	);
};
