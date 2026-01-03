"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

// Dynamically import to prevent SSR issues with wallet adapter
const DashboardContent = dynamic(() => import("./GuardianGateDashboardContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Loading GuardianGate...</CardTitle>
        </CardHeader>
      </Card>
    </div>
  ),
});

export default function GuardianGateDashboard() {
  return <DashboardContent />;
}
