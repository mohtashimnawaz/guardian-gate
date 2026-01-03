"use client";

import React, { ReactNode } from "react";

interface ATLayoutProps {
  hero?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}

export default function ATLayout({ hero, left, right, children }: ATLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* HERO / T bar */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="-mt-6">
            <div className="rounded-2xl p-8 bg-page-gradient shadow-2xl">
              {hero}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN AREA - vertical mast (A/T) */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">{left}</div>
          <div className="lg:col-span-1">{right}</div>
        </div>

        {/* Optional full width children below */}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
