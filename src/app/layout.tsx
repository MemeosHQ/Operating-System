import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/providers/app-provider";
import { WalletConnectProvider } from "@/lib/providers/wallet-provider";
import { DATA_MODE } from "@/lib/config";
import { WalletSelector } from "@/components/wallet/wallet-selector";
import { BootLoader } from "@/components/boot-loader";

export const metadata: Metadata = {
  metadataBase: new URL("https://meme-os.xyz"),
  title: "MEMEOS — The Intelligence Layer for Solana Memes",
  description:
    "See what moves. Understand why. MEMEOS turns raw Solana meme activity — attention, wallets, narratives, launches — into intelligence you can actually read.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MEMEOS — The Intelligence Layer for Solana Memes",
    description:
      "See what moves. Understand why. MEMEOS turns raw Solana meme activity — attention, wallets, narratives, launches — into intelligence you can actually read.",
    url: "https://meme-os.xyz",
    siteName: "MEMEOS",
    images: [{ url: "/images/memeos-hero-original.png", width: 1600, height: 900 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MEMEOS — The Intelligence Layer for Solana Memes",
    description:
      "See what moves. Understand why. Live Solana meme intelligence — attention, narratives, wallets, launches, Meme DNA.",
    images: ["/images/memeos-hero-original.png"],
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
