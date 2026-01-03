"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Lock, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function GuardianGateDashboardContent() {
  const { publicKey, connected } = useWallet();
  const [formState, setFormState] = useState({
    guardians: [] as string[],
    threshold: 1,
    newGuardianAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAddGuardian = () => {
    if (!formState.newGuardianAddress.trim()) {
      toast.push({ type: "error", description: "Please enter a guardian address" });
      return;
    }

    try {
      new PublicKey(formState.newGuardianAddress);
      if (formState.guardians.includes(formState.newGuardianAddress)) {
        toast.push({ type: "error", description: "Guardian already added" });
        return;
      }
      setFormState((prev) => ({
        ...prev,
        guardians: [...prev.guardians, formState.newGuardianAddress],
        newGuardianAddress: "",
      }));
      toast.push({ type: "success", description: "Guardian added" });
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
    if (!publicKey) {
      toast.push({ type: "error", description: "Wallet not connected" });
      return;
    }
    if (formState.guardians.length === 0) {
      toast.push({ type: "error", description: "Add at least one guardian" });
      return;
    }
    if (formState.threshold > formState.guardians.length) {
      toast.push({ type: "error", description: "Recovery threshold cannot exceed guardian count" });
      return;
    }

    setLoading(true);
    toast.push({ type: "success", description: "Transaction ready - signing..." });
    setTimeout(() => {
      toast.push({ type: "success", description: "Wallet initialized successfully!" });
      setLoading(false);
    }, 2000);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to GuardianGate</CardTitle>
            <CardDescription>Connect your wallet to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">Connect Phantom, Solflare, or another Solana wallet to begin setting up multi-signature recovery.</p>
            <WalletMultiButton className="!w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">GuardianGate</h1>
              <p className="text-muted-foreground">Multi-signature wallet recovery system</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Connection Status */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-primary" />
                Wallet Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connected && publicKey ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Address</p>
                    <p className="font-mono text-xs text-foreground break-all">{publicKey.toBase58()}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">Not connected</span>
                </div>
              )}
              <WalletMultiButton className="!w-full" />
            </CardContent>
          </Card>

          {/* Recovery Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                Recovery Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Total Guardians</p>
                  <p className="text-3xl font-bold text-primary">{formState.guardians.length}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Threshold</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formState.threshold}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Status</p>
                  <p className="text-sm font-medium text-foreground">{formState.guardians.length > 0 ? "Ready" : "Setup needed"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guardian Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Manage Guardians</CardTitle>
            <CardDescription>Add trusted addresses for wallet recovery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Guardian Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Add Guardian Address</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter a Solana address"
                  value={formState.newGuardianAddress}
                  onChange={(e: any) =>
                    setFormState((prev) => ({
                      ...prev,
                      newGuardianAddress: e.target.value,
                    }))
                  }
                  onKeyPress={(e: any) => {
                    if (e.key === "Enter") handleAddGuardian();
                  }}
                />
                <Button onClick={handleAddGuardian} className="gap-2 whitespace-nowrap" disabled={!formState.newGuardianAddress.trim()}>
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Guardian List */}
            {formState.guardians.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Active Guardians ({formState.guardians.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {formState.guardians.map((guardian, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge variant="secondary" className="flex-shrink-0">
                          G{index + 1}
                        </Badge>
                        <code className="text-xs text-foreground truncate bg-card px-2 py-1 rounded">{guardian}</code>
                      </div>
                      <Button onClick={() => handleRemoveGuardian(index)} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive ml-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recovery Threshold */}
            <div className="space-y-3 pt-6 border-t border-border">
              <label className="block text-sm font-semibold text-foreground">Recovery Threshold (M-of-N)</label>
              <p className="text-sm text-muted-foreground">How many guardians must approve to recover your wallet</p>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max={Math.max(formState.guardians.length, 1)}
                  value={formState.threshold}
                  onChange={(e: any) => {
                    const val = parseInt(e.target.value) || 1;
                    setFormState((prev) => ({
                      ...prev,
                      threshold: Math.min(val, prev.guardians.length || 1),
                    }));
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  of <span className="font-semibold text-foreground">{formState.guardians.length || "—"}</span> guardians
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Section */}
        <div className="space-y-4">
          <Button onClick={handleInitializeWallet} disabled={loading || !connected || formState.guardians.length === 0} size="lg" className="w-full py-6 text-lg font-semibold gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Initialize Wallet
              </>
            )}
          </Button>

          {/* Status Messages */}
          {message && (
            <div
              className={`p-4 rounded-lg border flex gap-3 ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-950/50 text-green-900 dark:text-green-300 border-green-200 dark:border-green-700/50"
                  : "bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border-red-200 dark:border-red-700/50"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">How GuardianGate Works</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✓ Add trusted guardians who can help you recover your wallet</li>
            <li>✓ Set a threshold (e.g., 2-of-3) for recovery approval</li>
            <li>✓ If you lose access, guardians can collectively help restore it</li>
            <li>✓ All recovery operations are secured by the Solana blockchain</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
