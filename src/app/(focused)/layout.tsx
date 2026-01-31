// Route group for add/edit/print/meal-planner pages. No shared layout currently.
interface FocusedLayoutProps {
  children: React.ReactNode;
}

export default function FocusedLayout({ children }: FocusedLayoutProps) {
  return <>{children}</>;
}
