/**
 * Guardian Management Dashboard - React Component
 * Displays guardian list and recovery status
 */

"use client";

import React, { useState, useEffect } from "react";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { GuardianGateClient, formatRecoveryProgress } from "@/app/lib/guardian-gate-client";
import { useWallet } from "@solana/wallet-adapter-react";

interface GuardianInfo {
  address: PublicKey;
  hasApproved: boolean;
}

interface WalletState {
  owner: PublicKey;
  guardians: GuardianInfo[];
  threshold: number;
  recoveryActive: boolean;
  proposedOwner?: PublicKey;
  recoveryProgress?: string;
  timeRemaining?: number;
}

export function GuardianManagementDashboard() {
  const { publicKey, signTransaction } = useWallet();
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connection = new Connection(clusterApiUrl("mainnet-beta"));

  useEffect(() => {
    if (!publicKey) return;
    loadWalletState();
  }, [publicKey]);

  const loadWalletState = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      // Note: In production, use actual keypair instead of dummy
      const client = new GuardianGateClient(
        connection,
        publicKey as any,
        clusterApiUrl("mainnet-beta")
      );

      const config = await client.getWalletConfig(publicKey);
      const recoveryStatus = await client.getRecoveryStatus(publicKey);

      const guardians: GuardianInfo[] = config.guardians.map(
        (guardian: PublicKey) => ({
          address: guardian,
          hasApproved: recoveryStatus.approvals?.some((a: PublicKey) =>
            a.equals(guardian)
          ),
        })
      );

      setWalletState({
        owner: config.owner,
        guardians,
        threshold: config.threshold,
        recoveryActive: recoveryStatus.isActive,
        proposedOwner: recoveryStatus.proposedOwner,
        recoveryProgress: formatRecoveryProgress(
          recoveryStatus.approvals || [],
          config.threshold,
          recoveryStatus.timeRemaining || 0
        ),
        timeRemaining: recoveryStatus.timeRemaining,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load wallet state"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Please connect your wallet to view guardian settings
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Loading wallet configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">Error: {error}</p>
        <button
          onClick={loadWalletState}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!walletState) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">Wallet not initialized</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Wallet Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Wallet Information
        </h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">Owner:</span>
            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
              {walletState.owner.toString().slice(0, 20)}...
            </code>
          </div>
          <div>
            <span className="text-gray-600">Recovery Threshold:</span>
            <span className="ml-2 font-semibold">
              {walletState.threshold} of {walletState.guardians.length} guardians
            </span>
          </div>
        </div>
      </div>

      {/* Recovery Status */}
      {walletState.recoveryActive && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-semibold text-orange-900">
              Recovery in Progress
            </h2>
          </div>
          <div className="space-y-2 text-sm text-orange-800">
            <p>
              <span className="font-medium">Proposed Owner:</span>
              <code className="ml-2 bg-orange-100 px-2 py-1 rounded text-xs">
                {walletState.proposedOwner?.toString().slice(0, 20)}...
              </code>
            </p>
            <p>
              <span className="font-medium">Status:</span>
              <span className="ml-2">{walletState.recoveryProgress}</span>
            </p>
            {walletState.timeRemaining! > 0 && (
              <p className="text-xs mt-3 p-3 bg-orange-100 rounded">
                Recovery can be cancelled by the current owner within{" "}
                {Math.ceil(walletState.timeRemaining! / 3600)} hours
              </p>
            )}
          </div>
        </div>
      )}

      {/* Guardians List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardians</h2>
        <div className="space-y-3">
          {walletState.guardians.map((guardian, idx) => (
            <div
              key={guardian.address.toString()}
              className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {guardian.address.toString()}
                  </p>
                </div>
              </div>
              {walletState.recoveryActive && (
                <div className="flex items-center gap-2">
                  {guardian.hasApproved ? (
                    <>
                      <span className="text-lg">✓</span>
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                        Approved
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nuclear Option - Initiate Recovery */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">
          🚨 Nuclear Option
        </h2>
        <p className="text-sm text-red-800 mb-4">
          If you've lost access to your wallet, guardians can vote to assign a
          new owner. This action cannot be undone during the 24-hour challenge
          period.
        </p>
        <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm transition">
          Initiate Recovery
        </button>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadWalletState}
        className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium text-sm transition"
      >
        Refresh Status
      </button>
    </div>
  );
}
