import { Home } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Not Found</h2>
      <p className="text-sm text-muted-foreground">
        Could not find the requested resource
      </p>
      <Link href="/">
        <Button variant="outline">
          <Home className="mr-2 h-4 w-4" />
          Return Home
        </Button>
      </Link>
    </div>
  );
}
