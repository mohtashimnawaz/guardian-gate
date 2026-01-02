import type { Metadata } from "next";
import React from "react";

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
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
