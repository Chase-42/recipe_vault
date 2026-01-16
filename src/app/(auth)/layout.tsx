interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <main className="min-h-screen bg-grid-pattern">{children}</main>;
}
