import { getServerSession } from "~/lib/auth-helpers";
import { TopNav } from "~/app/_components/topnav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const session = await getServerSession();

  return (
    <div className="grid h-screen grid-rows-[auto,1fr] print:grid-rows-[1fr]">
      {session && <TopNav session={session} />}
      <main className="overflow-y-auto">{children}</main>
    </div>
  );
}