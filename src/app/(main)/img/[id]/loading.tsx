import LoadingSpinner from "~/app/_components/LoadingSpinner";
import {
  PageTransition,
  AnimatedBackButton,
} from "~/components/ui/page-transition";
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <PageTransition>
      <div className="flex h-full w-full flex-col">
        <div className="border-b p-2 flex items-center gap-4">
          <AnimatedBackButton className="h-8 w-8 rounded-md bg-transparent hover:bg-accent flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </AnimatedBackButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingSpinner size="md" fullHeight={false} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
