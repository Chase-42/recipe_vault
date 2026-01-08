import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Toaster } from "~/components/ui/sonner";
import { ClientProvider } from "~/providers";
import { SearchProvider } from "~/providers";
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
    <ClientProvider>
      <SearchProvider>
        <html lang="en" className={`${GeistSans.variable} dark`}>
          <body className="min-h-screen bg-black bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]">
            <Toaster
              closeButton
              position="top-center"
              duration={2000}
              expand={false}
            />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <div id="modal-root" />
          </body>
        </html>
      </SearchProvider>
    </ClientProvider>
  );
}
