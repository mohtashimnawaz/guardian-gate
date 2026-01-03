"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import ParallaxCard from "@/components/ui/parallax-card";
import { Shield } from "lucide-react";

interface ActionPanelProps {
  disabled?: boolean;
  onInitialize?: () => void;
}

export default function ActionPanel({ disabled, onInitialize }: ActionPanelProps) {
  return (
    <ParallaxCard className="rounded-xl p-6 shadow-lg bg-card card-3d" tilt={6} scale={1.02}>
      <div className="mb-3 text-xs text-muted-foreground">Ready to proceed?</div>
      <div className="text-lg font-semibold text-foreground mb-4">Initialize your recovery wallet</div>
      <Button onClick={onInitialize} disabled={disabled} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
        <Shield className="w-4 h-4 mr-2" /> Initialize Wallet
      </Button>
      <p className="text-sm text-muted-foreground mt-3">Transactions will be built client-side and sent for signing by your connected wallet.</p>
    </ParallaxCard>
  );
}
