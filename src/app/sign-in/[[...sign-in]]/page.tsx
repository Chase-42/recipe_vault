import { SignIn } from "@clerk/nextjs";

interface PageProps {
  params: Promise<{ "sign-in"?: string[] }>;
}

export default function Page({ params }: PageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}