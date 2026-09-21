import { NarrativeDetail } from "@/components/narrative-detail";

export default async function NarrativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <NarrativeDetail slug={slug} />;
}
