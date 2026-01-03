import type { Metadata } from "next";
import React from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuardianGate - Solana Account Recovery",
  description: "Decentralized guardian-based account recovery for Solana wallets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

