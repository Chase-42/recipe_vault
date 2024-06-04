import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export const TopNav = () => {
	return (
		<nav className="flex w-full items-center justify-between border-b p-4 text-xl font-semibold">
			<div>Recipes</div>

			<div className="flex flex-row items-center gap-4">
				<SignedOut>
					<SignInButton />
				</SignedOut>
				<SignedIn>
					<UserButton />
				</SignedIn>
			</div>
		</nav>
	);
};
