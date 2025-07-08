import FullImagePageClient from "~/app/_components/FullImagePageClient";

export default async function ImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FullImagePageClient id={Number(id)} />;
}
