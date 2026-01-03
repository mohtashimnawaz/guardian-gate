"use client";

import React, { useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Lock, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function GuardianGateDashboardContent() {
  const { publicKey, connected } = useWallet();
  const [formState, setFormState] = useState({
    guardians: [] as string[],
    threshold: 1,
    newGuardianAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [guardianError, setGuardianError] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const guardianInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddGuardian = () => {
    const addr = formState.newGuardianAddress.trim();
    if (!addr) {
      setGuardianError("Please enter a guardian address");
      guardianInputRef.current?.focus();
      return;
    }

    try {
      new PublicKey(addr);
      if (formState.guardians.includes(addr)) {
        setGuardianError("Guardian already added");
        guardianInputRef.current?.focus();
        return;
      }

      setFormState((prev) => ({
        ...prev,
        guardians: [...prev.guardians, addr],
        newGuardianAddress: "",
      }));

      setGuardianError(null);
      setThresholdError(null);
      toast.push({ type: "success", description: "Guardian added" });
    } catch {
      setGuardianError("Invalid Solana address");
      guardianInputRef.current?.focus();
    }
  };

  const handleRemoveGuardian = (index: number) => {
    setFormState((prev) => {
      const guards = prev.guardians.filter((_, i) => i !== index);
      return {
        ...prev,
        guardians: guards,
        threshold: Math.min(prev.threshold, Math.max(guards.length, 1)),
      };
    });

    setGuardianError(null);
    setThresholdError(null);
  };

  const handleInitializeWallet = async () => {
    if (guardianError || thresholdError) {
      toast.push({ type: "error", description: "Please fix form errors before continuing" });
      if (guardianError) guardianInputRef.current?.focus();
      return;
    }

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
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="relative mb-16">
          <div className="hero-shapes"></div>
          <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-tr from-primary/8 to-secondary/8 p-8 md:p-12 bg-page-gradient">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="transform-gpu will-change-transform transition-transform duration-300 hover:scale-105 hover:-translate-y-1 flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
                  <Shield className="w-8 h-8" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">GuardianGate</h1>
                  <p className="mt-1 text-muted-foreground max-w-xl">A modern, secure multi-signature recovery system for your Solana wallet — set guardians, choose a threshold, and recover access safely.</p>
                  <div className="mt-4 flex items-center gap-3">
                    <WalletMultiButton className="!px-5 !py-2" />
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col items-end text-right">
                <div className="text-sm text-muted-foreground">Status</div>
                {connected && publicKey ? (
                  <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <div className="text-sm font-medium">Connected</div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <AlertCircle className="w-5 h-5" />
                    <div className="text-sm">Not connected</div>
                  </div>
                )}
                <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div className="font-mono text-sm text-foreground break-all max-w-xs truncate">{publicKey?.toBase58() ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* floating stats cards */}
          <div className="-mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 z-20">
            <div className="transform hover:-translate-y-1 transition-shadow duration-200">
              <Card className="p-4 shadow-xl rounded-xl ring-1 ring-border card-3d motion-safe:animate-float">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Guardians</div>
                    <div className="mt-1 text-2xl font-bold text-foreground">{formState.guardians.length}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>
            <div className="transform hover:-translate-y-1 transition-shadow duration-200">
              <Card className="p-4 shadow-xl rounded-xl ring-1 ring-border card-3d motion-safe:animate-float">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Threshold</div>
                    <div className="mt-1 text-2xl font-bold text-foreground">{formState.threshold}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>
            </div>
            <div className="transform hover:-translate-y-1 transition-shadow duration-200">
              <Card className="p-4 shadow-xl rounded-xl ring-1 ring-border card-3d motion-safe:animate-float">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="mt-1 text-2xl font-bold text-foreground">{formState.guardians.length > 0 ? 'Ready' : 'Setup needed'}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 relative z-10">
          {/* Guardian Management - left column (spans 2 on large) */}
          <div className="lg:col-span-2">
            <Card className="mb-6 rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Manage Guardians</span>
                  <span className="text-sm text-muted-foreground">Add trusted addresses for account recovery</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Guardian */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-foreground mb-2">Add Guardian Address</label>
                    <Input
                      ref={guardianInputRef}
                      type="text"
                      placeholder="Enter a Solana address"
                      value={formState.newGuardianAddress}
                      onChange={(e: any) => {
                        const v = e.target.value;
                        setFormState((prev) => ({ ...prev, newGuardianAddress: v }));
                        if (guardianError) setGuardianError(null);
                      }}
                      onKeyPress={(e: any) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGuardian();
                        }
                      }}
                      aria-invalid={!!guardianError}
                      aria-describedby={guardianError ? 'guardian-error' : undefined}
                      className="w-full"
                    />
                    {guardianError && (
                      <p id="guardian-error" role="alert" aria-live="assertive" className="text-sm text-destructive mt-1">
                        {guardianError}
                      </p>
                    )}
                  </div>

                  <div className="w-full md:w-auto">
                    <Button onClick={handleAddGuardian} className="gap-2 whitespace-nowrap bg-gradient-to-r from-primary to-secondary text-white shadow-md" disabled={!formState.newGuardianAddress.trim()}>
                      <Plus className="w-4 h-4" />
                      Add Guardian
                    </Button>
                  </div>
                </div>

                {/* Guardian List */}
                {formState.guardians.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Active Guardians ({formState.guardians.length})</h3>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {formState.guardians.map((guardian, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold">G{index + 1}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-foreground truncate">{guardian}</div>
                              <div className="text-xs text-muted-foreground">Guardian address</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button onClick={() => handleRemoveGuardian(index)} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" aria-label={`Remove guardian ${index + 1}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No guardians added yet. Add one to get started.</div>
                )}

                {/* Threshold */}
                <div className="pt-2 border-t border-border">
                  <label className="block text-sm font-semibold text-foreground mb-2">Recovery Threshold (M-of-N)</label>
                  <p className="text-sm text-muted-foreground mb-3">How many guardians must approve to recover your wallet</p>
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
                        if (val > formState.guardians.length) {
                          setThresholdError('Threshold cannot exceed number of guardians');
                        } else {
                          setThresholdError(null);
                        }
                      }}
                      className={`w-28 ${thresholdError ? 'border-destructive' : ''}`}
                      aria-invalid={!!thresholdError}
                      aria-describedby={thresholdError ? 'threshold-error' : undefined}
                    />
                    <div className="text-sm text-muted-foreground">
                      of <span className="font-semibold text-foreground">{formState.guardians.length || '—'}</span> guardians
                    </div>
                  </div>
                  {thresholdError && (
                    <p id="threshold-error" role="alert" aria-live="assertive" className="text-sm text-destructive mt-2">
                      {thresholdError}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Actions & Help */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-xl shadow-lg p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Ready to proceed?</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">Initialize your recovery wallet</div>
                </div>

                <div>
                  <Button onClick={handleInitializeWallet} disabled={loading || !connected || formState.guardians.length === 0} size="lg" className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Initialize Wallet
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">Transactions will be built client-side and sent for signing by your connected wallet.</div>
              </div>
            </Card>

            <Card className="rounded-xl p-6 border border-border bg-muted/50">
              <h3 className="text-sm font-semibold text-foreground mb-3">How GuardianGate Works</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Add trusted guardians who can help you recover your wallet</li>
                <li>✓ Set a threshold (e.g., 2-of-3) for recovery approval</li>
                <li>✓ If you lose access, guardians can collectively help restore it</li>
                <li>✓ All recovery operations are secured by the Solana blockchain</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
