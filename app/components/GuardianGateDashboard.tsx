"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";
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
          <CardContent className="space-y-4 px-6 py-4">
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  ),
});

export default function GuardianGateDashboard() {
  return <DashboardContent />;
}
