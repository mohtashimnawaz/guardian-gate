"use client";
import React from "react";
import ParallaxCard from "@/components/ui/parallax-card";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <ParallaxCard className="p-4 rounded-xl shadow-md bg-card card-3d" tilt={7} scale={1.015}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
        </div>
        <div className="bg-muted rounded-lg p-2">{icon}</div>
      </div>
    </ParallaxCard>
  );
}
