"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";

const PROGRAM_ID = "4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ";

interface FormState {
  guardians: string[];
  threshold: number;
  newGuardianAddress: string;
}

export function GuardianGateDashboard() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [formState, setFormState] = useState<FormState>({
    guardians: [],
    threshold: 1,
    newGuardianAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleAddGuardian = () => {
    if (!formState.newGuardianAddress.trim()) {
      setMessage({ type: "error", text: "Please enter a guardian address" });
      return;
    }
    
    try {
      new PublicKey(formState.newGuardianAddress);
      setFormState((prev) => ({
        ...prev,
        guardians: [...prev.guardians, formState.newGuardianAddress],
        newGuardianAddress: "",
      }));
      setMessage({ type: "success", text: "Guardian added!" });
    } catch {
      setMessage({ type: "error", text: "Invalid Solana address" });
    }
  };

  const handleRemoveGuardian = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
    }));
  };

  const handleInitializeWallet = async () => {
    if (!publicKey || !signTransaction) return;
    if (formState.guardians.length === 0) {
      setMessage({ type: "error", text: "Add at least one guardian" });
      return;
    }
    if (formState.threshold > formState.guardians.length) {
      setMessage({ type: "error", text: "Threshold cannot exceed guardian count" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      setTxSignature("demo_tx_" + Date.now());
      setMessage({ type: "success", text: "Initialize Wallet transaction ready! Connect in full client library" });
    } catch (err: any) {
      setMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Connect Your Wallet</h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          Connect Phantom, Solflare, or another Solana wallet to get started
        </p>
        <WalletMultiButton style={{ 
          backgroundColor: "#14F195", 
          color: "black",
          fontSize: "1rem",
          padding: "0.75rem 1.5rem"
        }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2>GuardianGate Dashboard</h2>
        <WalletMultiButton />
      </div>

      {message && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            backgroundColor: message.type === "success" ? "#e8f5e9" : "#ffebee",
            color: message.type === "success" ? "#2e7d32" : "#c62828",
            border: `1px solid ${message.type === "success" ? "#4caf50" : "#f44336"}`,
          }}
        >
          {message.text}
          {txSignature && (
            <>
              <br />
              <small>
                Transaction: <code>{txSignature.slice(0, 20)}...</code>
              </small>
            </>
          )}
        </div>
      )}

      <div style={{ 
        backgroundColor: "#f9f9f9", 
        padding: "1.5rem", 
        borderRadius: "8px", 
        border: "1px solid #e0e0e0",
        marginBottom: "2rem"
      }}>
        <h3 style={{ marginTop: 0 }}>📋 Wallet Info</h3>
        <p><strong>Owner:</strong> {publicKey?.toBase58().slice(0, 20)}...</p>
        <p><strong>Status:</strong> ⏳ Connect guardians below</p>
      </div>

      <div style={{ 
        backgroundColor: "#fff", 
        padding: "1.5rem", 
        borderRadius: "8px", 
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0 }}>🛡️ Initialize Wallet</h3>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          Set up guardians and a recovery threshold for your wallet
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Add Guardian Address:
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Enter Solana address (e.g., 11111...)"
              value={formState.newGuardianAddress}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, newGuardianAddress: e.target.value }))
              }
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.95rem",
              }}
            />
            <button
              onClick={handleAddGuardian}
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Add
            </button>
          </div>
        </div>

        {formState.guardians.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Guardians ({formState.guardians.length}):
            </label>
            <div>
              {formState.guardians.map((guardian, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    backgroundColor: "#f5f5f5",
                    marginBottom: "0.5rem",
                    borderRadius: "4px",
                    alignItems: "center",
                  }}
                >
                  <code style={{ fontSize: "0.85rem" }}>{guardian.slice(0, 20)}...</code>
                  <button
                    onClick={() => handleRemoveGuardian(idx)}
                    style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Recovery Threshold:
          </label>
          <input
            type="number"
            min="1"
            max={formState.guardians.length || 5}
            value={formState.threshold}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                threshold: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "0.95rem",
            }}
          />
          <small style={{ color: "#666" }}>
            Number of guardian approvals needed to complete recovery
          </small>
        </div>

        <button
          onClick={handleInitializeWallet}
          disabled={loading || formState.guardians.length === 0}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: loading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Initializing..." : "✅ Initialize Wallet"}
        </button>
      </div>

      <div style={{
        marginTop: "2rem",
        padding: "1.5rem",
        backgroundColor: "#e3f2fd",
        borderRadius: "8px",
        border: "1px solid #90caf9"
      }}>
        <h4 style={{ marginTop: 0, color: "#1565c0" }}>📖 How to Use</h4>
        <ol style={{ color: "#333", lineHeight: "1.8" }}>
          <li><strong>Add Guardians:</strong> Enter the Solana wallet addresses of your guardians</li>
          <li><strong>Set Threshold:</strong> Define how many guardians must approve recovery</li>
          <li><strong>Initialize:</strong> Click the button to create your GuardianGate wallet</li>
          <li><strong>Recovery:</strong> If you lose access, guardians can recover your account in 24 hours</li>
        </ol>
      </div>
    </div>
  );
}

