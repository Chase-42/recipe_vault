import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
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
import { ServiceWorkerRegistration } from "~/components/ServiceWorkerRegistration";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Recipe Vault",
  description: "Your personal recipe collection",
  icons: [
    { rel: "icon", url: "/recipe_vault_image.svg" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  appleWebApp: {
    capable: true,
    title: "Recipe Vault",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body className="h-dvh flex flex-col bg-black bg-grid-pattern">
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
                <ServiceWorkerRegistration />
              </HeaderProvider>
            </SearchProvider>
          </SessionProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
