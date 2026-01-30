interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="grid h-screen grid-rows-[1fr]">
      <main className="overflow-y-auto">{children}</main>
    </div>
  );
}
