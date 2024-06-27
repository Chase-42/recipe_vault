import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ClerkProvider } from "@clerk/nextjs";
import ClientProvider from "~/components/ClientProvider";
import { TopNav } from "../components/topnav";
import { SearchProvider } from "../providers";

export const metadata = {
	title: "Recipe Vault",
	description: "Generated by create-t3-app",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
	modal,
}: {
	children: React.ReactNode;
	modal: React.ReactNode;
}) {
	return (
		<ClerkProvider>
			<ClientProvider>
				<SearchProvider>
					<html lang="en" className={`${GeistSans.variable} dark`}>
						<body>
							<div className="h-screen grid grid-rows-[auto,1fr]">
								<TopNav />
								<main className="overflow-y-auto">{children}</main>
							</div>
							{modal}
							<div id="modal-root" />
						</body>
					</html>
				</SearchProvider>
			</ClientProvider>
		</ClerkProvider>
	);
}
