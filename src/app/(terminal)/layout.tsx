import type { ReactNode } from "react";
import { CommandRail } from "@/components/layout/command-rail";
import { Topbar } from "@/components/layout/topbar";
import { StatusBar } from "@/components/layout/status-bar";
import { SearchCommand } from "@/components/layout/search-command";
import { MobileTabBar } from "@/components/layout/mobile-tabbar";
import { AiQuick } from "@/components/layout/ai-quick";
import { WalletGate } from "@/components/wallet/wallet-gate";

/** Shared shell for every terminal route — gated on a connected Solana wallet. */
export default function TerminalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <CommandRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="w-full flex-1 px-4 py-5 pb-24 md:px-6 md:pb-5">
          <div className="mx-auto w-full max-w-7xl">
            <WalletGate>{children}</WalletGate>
          </div>
        </main>
        <div className="hidden md:block">
          <StatusBar />
        </div>
      </div>
      <SearchCommand />
      <MobileTabBar />
      <AiQuick />
    </div>
  );
}


