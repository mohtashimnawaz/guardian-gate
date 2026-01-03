"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Toast = { id: string; type: "success" | "error"; title?: string; description: string };

const ToastContext = React.createContext<{
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = (t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: Toast = { id, ...t };
    setToasts((prev) => [toast, ...prev]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
  };

  const remove = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "max-w-sm w-full rounded-lg shadow p-4 flex items-start gap-3",
              t.type === "success" ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200"
            )}
            role="status"
          >
            <div className="mt-0.5">
              {t.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              {t.title && <div className="font-semibold mb-1">{t.title}</div>}
              <div className="text-sm">{t.description}</div>
            </div>
            <button className="ml-auto text-sm opacity-70" onClick={() => remove(t.id)} aria-label="Dismiss toast">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
