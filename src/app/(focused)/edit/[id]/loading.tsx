import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { PageTransition } from "~/components/ui/page-transition";

export default function Loading() {
  return (
    <PageTransition>
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="md" fullHeight={false} />
      </div>
    </PageTransition>
  );
}
