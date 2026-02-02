import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Toaster } from "~/components/ui/sonner";
import {
  ClientProvider,
  SearchProvider,
  HeaderProvider,
  SessionProvider,
} from "~/providers";
import { Header } from "~/app/_components/Header";
import { getServerSession } from "~/lib/auth-helpers";

export const metadata = {
  title: "Recipe Vault",
  icons: [{ rel: "icon", url: "/recipe_vault_image.svg" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body className="min-h-screen bg-black bg-grid-pattern">
        <ClientProvider>
          <SessionProvider initialSession={session}>
            <SearchProvider>
              <HeaderProvider>
                <Toaster
                  closeButton
                  position="top-center"
                  duration={2000}
                  expand={false}
                />
                <Header />
                <ErrorBoundary>{children}</ErrorBoundary>
                <div id="modal-root" />
              </HeaderProvider>
            </SearchProvider>
          </SessionProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
