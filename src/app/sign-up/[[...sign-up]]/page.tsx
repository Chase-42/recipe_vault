import { SignUp } from "@clerk/nextjs";

interface PageProps {
  params: Promise<{ "sign-up"?: string[] }>;
}

export default function Page({ params }: PageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}