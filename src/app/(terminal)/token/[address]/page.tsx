import type { Metadata } from "next";
import { TokenDetail } from "@/components/token-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  return { title: `Token ${address.slice(0, 6)}… — MEMEOS` };
}

export default async function TokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <TokenDetail address={address} />;
}
