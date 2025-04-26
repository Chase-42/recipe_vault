import FullImagePageClient from "~/app/_components/FullImagePageClient";

export default async function ImagePage({
  params,
}: {
  params: { id: string };
}) {
  const awaitedParams = await params;
  return <FullImagePageClient id={Number(awaitedParams.id)} />;
}
