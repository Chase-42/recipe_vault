import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Toaster } from "~/components/ui/sonner";
import { ClientProvider, SearchProvider, HeaderProvider } from "~/providers";
import { Header } from "~/app/_components/Header";

export const metadata = {
  title: "Recipe Vault",
  icons: [{ rel: "icon", url: "/recipe_vault_image.svg" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body className="min-h-screen bg-black bg-grid-pattern">
        <ClientProvider>
          <SearchProvider>
            <HeaderProvider>
              <Toaster
                closeButton
                position="top-center"
                duration={2000}
                expand={false}
              />
              <Header />
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <div id="modal-root" />
            </HeaderProvider>
          </SearchProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
