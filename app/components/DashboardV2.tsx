"use client";

import React, { useRef, useState } from "react";
import ATLayout from "@/components/ATLayout";
import { Shield, Users, Lock, CheckCircle2, Trash2, Plus } from "lucide-react";
import ParallaxCard from "@/components/ui/parallax-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatCard from "@/components/ui/stat-card";
import ActionPanel from "@/components/ui/action-panel";
import GuardianList from "@/components/ui/guardian-list";
import ThemeToggle from "@/components/ui/theme-toggle";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function DashboardV2() {
  const { publicKey, connected } = useWallet();
  const [guardians, setGuardians] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(1);

  const hero = (
    <div className="relative z-10">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <ParallaxCard className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg transform transition" tilt={10} scale={1.06}>
            <Shield className="w-8 h-8" />
          </ParallaxCard>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">GuardianGate</h1>
            <p className="mt-1 text-muted-foreground max-w-xl">A modern, secure multi-signature recovery system for Solana wallets. Build a safer recovery plan with trusted guardians and an adjustable recovery threshold.</p>
            <div className="mt-4 flex items-center gap-3">
              <WalletMultiButton className="!px-4 !py-2" />
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end text-right">
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <div className="text-sm font-medium">{connected ? "Connected" : "Not connected"}</div>
          </div>
          <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="font-mono text-sm text-foreground break-all max-w-xs truncate">{publicKey?.toBase58() ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const left = (
    <div>
      <Card className="card-3d p-6 shadow-lg">
        <CardHeader>
          <CardTitle>Manage Guardians</CardTitle>
        </CardHeader>
        <CardContent>
          <GuardianList
            guardians={guardians}
            onAdd={(addr) => setGuardians((g) => [...g, addr])}
            onRemove={(i) => setGuardians((g) => g.filter((_, idx) => idx !== i))}
          />

          <div className="mt-6 pt-4 border-t border-border">
            <label className="block text-sm font-semibold text-foreground mb-2">Recovery Threshold</label>
            <div className="flex items-center gap-3">
              <Input type="number" min={1} value={threshold} onChange={(e: any) => setThreshold(Number(e.target.value || 1))} className="w-28" />
              <div className="text-sm text-muted-foreground">of <span className="font-semibold">{guardians.length || '—'}</span> guardians</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Total Guardians" value={guardians.length} icon={<Users />} />
        <StatCard title="Threshold" value={threshold} icon={<Lock />} />
      </div>
    </div>
  );

  const right = (
    <div className="space-y-6">
      <ActionPanel disabled={!connected || guardians.length === 0} onInitialize={() => console.log('init')} />

      <Card className="rounded-xl p-6 border border-border bg-muted/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">How GuardianGate Works</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Add trusted guardians who can help you recover your wallet</li>
          <li>• Set a threshold (e.g., 2-of-3) for recovery approval</li>
          <li>• If you lose access, guardians can collectively help restore it</li>
          <li>• All recovery operations are secured by the Solana blockchain</li>
        </ul>
      </Card>
    </div>
  );

  return <ATLayout hero={hero} left={left} right={right} />;
}
