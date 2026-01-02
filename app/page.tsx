/**
 * GuardianGate Frontend - Main Landing Page
 */

"use client";

import React from "react";
import { GuardianManagementDashboard } from "./components/GuardianManagementDashboard";

export default function Home() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🛡️ GuardianGate</h1>
        <p style={{ fontSize: "1.1rem", color: "#666" }}>
          Decentralized Account Recovery for Solana Wallets
        </p>
      </header>

      <main>
        <GuardianManagementDashboard />
      </main>

      <footer style={{ marginTop: "3rem", padding: "2rem", textAlign: "center", borderTop: "1px solid #eee" }}>
        <p>Built with ❤️ on Solana | GuardianGate v1.0</p>
      </footer>
    </div>
  );
}
