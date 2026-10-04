"use client";

import React from "react";
import { DecoySummary } from "@/lib/api-client";
import { ShieldCheck, CheckCircle2, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DecoyProps {
  decoys: DecoySummary[];
  totalClearedCount: number;
}

export function ClearedDecoysPanel({ decoys, totalClearedCount = 52145 }: DecoyProps) {
  return (
    <div className="space-y-4 p-6 rounded-xl border border-slate-800 bg-surface/80 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-cyber-emerald" />
          <h3 className="text-base font-mono font-bold text-slate-100 uppercase tracking-wider">
            "Cleared" Decoys & Benign Traffic Panel
          </h3>
        </div>
        <Badge variant="emerald" className="font-mono py-1 px-3">
          {totalClearedCount.toLocaleString()} Benign Events Safely Filtered
        </Badge>
      </div>

      <p className="text-xs text-slate-400 font-mono">
        The baseline engine automatically isolates background operational noise (health checks, internal cron tasks, routine DNS) to prevent analyst fatigue while zeroing in on the true attack chain.
      </p>

      <div className="space-y-2">
        {decoys.map((decoy) => (
          <div
            key={decoy.event_id}
            className="p-3 rounded-lg border border-slate-800 bg-background/50 font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{decoy.event_id}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {decoy.log_source}
                  </Badge>
                </div>
                <div className="text-slate-400 text-[11px] truncate max-w-xl">
                  {decoy.description}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-cyber-emerald font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyber-emerald/10 border border-cyber-emerald/30">
                {decoy.reason_cleared}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
