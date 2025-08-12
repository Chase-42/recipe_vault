import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { TopNav } from "~/app/_components/topnav";
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
    <ClerkProvider>
      <ClientProvider>
        <SearchProvider>
          <html lang="en" className={`${GeistSans.variable} dark`}>
            <body>
              <Toaster
                closeButton
                position="top-center"
                duration={2000}
                expand={false}
              />
              <ErrorBoundary>
                <div className="grid h-screen grid-rows-[auto,1fr] print:grid-rows-[1fr]">
                  <TopNav />
                  <main className="overflow-y-auto">{children}</main>
                </div>
              </ErrorBoundary>
              <div id="modal-root" />
            </body>
          </html>
        </SearchProvider>
      </ClientProvider>
    </ClerkProvider>
  );
}
