import { WalletIntel } from "@/components/wallet-intel";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Wallet Profile</h1>
        <p className="mt-1 text-[14px] text-muted">Observable behavior, transparently labeled.</p>
      </div>
      <WalletIntel address={address} />
    </div>
  );
}
