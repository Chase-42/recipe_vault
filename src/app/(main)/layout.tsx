interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>;
}
