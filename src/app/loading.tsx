import LoadingSpinner from "~/app/_components/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-200px)] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
