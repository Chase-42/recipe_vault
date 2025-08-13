import LoadingSpinner from "~/app/_components/LoadingSpinner";

export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center">
      <LoadingSpinner fullHeight={false} />
    </div>
  );
}
