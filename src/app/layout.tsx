import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/providers/app-provider";
import { WalletConnectProvider } from "@/lib/providers/wallet-provider";
import { DATA_MODE } from "@/lib/config";
import { WalletSelector } from "@/components/wallet/wallet-selector";
import { BootLoader } from "@/components/boot-loader";

export const metadata: Metadata = {
  title: "MEMEOS — The Operating System for Solana Memes",
  description:
    "Track attention, wallets, narratives, launches and meme intelligence across Solana.",
  openGraph: {
    title: "MEMEOS — The Operating System for Solana Memes",
    description:
      "Track attention, wallets, narratives, launches and meme intelligence across Solana.",
    images: [{ url: "/brand/logo-stacked.svg" }],
  },
  twitter: {
    card: "summary",
    title: "MEMEOS — The Operating System for Solana Memes",
    description:
      "Track attention, wallets, narratives, launches and meme intelligence across Solana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <BootLoader />
        <WalletConnectProvider>
          <AppProvider mode={DATA_MODE}>
            {children}
            <WalletSelector />
          </AppProvider>
        </WalletConnectProvider>
      </body>
    </html>
  );
}
