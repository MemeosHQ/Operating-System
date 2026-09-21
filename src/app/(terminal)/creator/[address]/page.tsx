import { CreatorDetail } from "@/components/creator-detail";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <CreatorDetail address={address} />;
}
