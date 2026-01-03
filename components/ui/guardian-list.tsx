"use client";
import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface GuardianListProps {
  guardians: string[];
  onAdd: (addr: string) => void;
  onRemove: (index: number) => void;
}

export default function GuardianList({ guardians, onAdd, onRemove }: GuardianListProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);

  const add = () => {
    const v = value.trim();
    if (!v) return setError("Enter an address");
    onAdd(v);
    setValue("");
    setError(null);
    ref.current?.focus();
  };

  return (
    <div>
      <div className="flex gap-3 items-center">
        <Input ref={ref} placeholder="Enter a Solana address" value={value} onChange={(e: any) => { setValue(e.target.value); if (error) setError(null); }} />
        <Button onClick={add} className="bg-gradient-to-r from-primary to-secondary text-white"><Plus className="w-4 h-4" /> Add</Button>
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      <div className="mt-4 space-y-2">
        {guardians.length === 0 ? (
          <p className="text-sm text-muted-foreground">No guardians added yet.</p>
        ) : (
          guardians.map((g, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
              <div className="min-w-0">
                <div className="text-sm text-foreground truncate">{g}</div>
                <div className="text-xs text-muted-foreground">Guardian {i + 1}</div>
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(i)} aria-label={`Remove guardian ${i + 1}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
