import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { ClerkProvider } from "@clerk/nextjs";
import { ClientProvider } from "~/providers";
import { SearchProvider } from "~/providers";
import { Toaster } from "sonner";
import { TopNav } from "~/app/_components/topnav";
import { ErrorBoundary } from "~/components/ErrorBoundary";

export const metadata = {
  title: "Recipe Vault",
  icons: [{ rel: "icon", url: "/recipe_vault_image.svg" }],
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
              <Toaster position="top-center" />
              <ErrorBoundary>
                <div className="grid h-screen grid-rows-[auto,1fr]">
                  <TopNav />
                  <main className="overflow-y-auto">{children}</main>
                </div>
              </ErrorBoundary>
              {modal}
              <div id="modal-root" />
            </body>
          </html>
        </SearchProvider>
      </ClientProvider>
    </ClerkProvider>
  );
}
