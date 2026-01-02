/**
 * GuardianGate Frontend - Main App
 */

import React from "react";
import { GuardianGateDashboard } from "./components/GuardianGateDashboard";

export default function Home() {
  return (
    <div style={{ padding: "1rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: "2rem", textAlign: "center", paddingTop: "1rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛡️ GuardianGate</h1>
        <p style={{ fontSize: "1rem", color: "#666", marginBottom: "0.5rem" }}>
          Decentralized Account Recovery for Solana Wallets
        </p>
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          Devnet: 4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ
        </p>
      </header>

      <GuardianGateDashboard />

      <footer style={{ marginTop: "3rem", padding: "2rem", textAlign: "center", borderTop: "1px solid #eee", color: "#999" }}>
        <p>Built on Solana | GuardianGate v1.0</p>
      </footer>
    </div>
  );
}

