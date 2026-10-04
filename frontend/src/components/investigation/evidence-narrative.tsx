"use client";

import React, { useState } from "react";
import { NarrativeClaim, RawLogEntry, fetchRawLogs } from "@/lib/api-client";
import { Lock, CheckCircle2, FileCode, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NarrativeProps {
  claims: NarrativeClaim[];
  onSelectClaim?: (claim: NarrativeClaim) => void;
}

export function EvidenceNarrative({ claims }: NarrativeProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.claim_id || "CLM-001");
  const [rawLogs, setRawLogs] = useState<RawLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const activeClaim = claims.find((c) => c.claim_id === selectedClaimId) || claims[0];

  const handleClaimClick = async (claim: NarrativeClaim) => {
    setSelectedClaimId(claim.claim_id);
    setLoadingLogs(true);
    const data = await fetchRawLogs(claim.evidence_event_ids);
    setRawLogs(data.logs);
    setLoadingLogs(false);
  };

  // Initial load for first claim
  React.useEffect(() => {
    if (activeClaim) {
      handleClaimClick(activeClaim);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Evidence-Locked Narrative Claims (Left 7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between p-4 rounded-t-lg border border-slate-800 bg-surface/90">
          <div className="flex items-center gap-2 font-mono">
            <Lock className="w-5 h-5 text-cyber-amber" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Evidence-Locked Attack Narrative
            </h3>
          </div>
          <Badge variant="cyan" className="font-mono text-[10px]">
            Sentence Click -&gt; Receipts
          </Badge>
        </div>

        <div className="space-y-3 font-mono">
          {claims.map((claim) => {
            const isSelected = claim.claim_id === selectedClaimId;
            return (
              <div
                key={claim.claim_id}
                onClick={() => handleClaimClick(claim)}
                className={cn(
                  "p-4 rounded-lg border transition-all cursor-pointer space-y-2 relative overflow-hidden",
                  isSelected
                    ? "border-cyber-cyan bg-cyber-cyan/10 shadow-cyan-glow"
                    : "border-slate-800 bg-surface/60 hover:bg-surface-hover/60 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyber-cyan text-xs">[{claim.claim_id}]</span>
                    <Badge variant="outline" className="text-[10px]">
                      {claim.mitre_stage}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-cyber-emerald font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyber-emerald" />
                    <span>{claim.evidence_event_ids.length} Proven Receipts</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                  {claim.sentence}
                </p>

                {isSelected && (
                  <div className="text-[10px] text-cyber-cyan flex items-center gap-1 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
                    Active Claim Selection - Raw receipts illuminated on right panel
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Illuminated Raw Receipts Panel (Right 5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between p-4 rounded-t-lg border border-slate-800 bg-surface/90">
          <div className="flex items-center gap-2 font-mono">
            <FileCode className="w-5 h-5 text-cyber-emerald" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Illuminated Log Receipts
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activeClaim ? `Claim ${activeClaim.claim_id}` : "Select Claim"}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono min-h-[420px] max-h-[600px] overflow-y-auto space-y-3">
          {loadingLogs ? (
            <div className="flex items-center justify-center h-48 text-cyber-cyan text-xs">
              <span className="animate-spin mr-2">⚡</span> Validating citation receipts...
            </div>
          ) : rawLogs.length > 0 ? (
            rawLogs.map((log) => (
              <div
                key={log.event_id}
                className="p-3 rounded border border-cyber-emerald/40 bg-cyber-emerald/5 text-[11px] text-slate-200 space-y-1 hover:border-cyber-emerald transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] text-cyber-emerald font-bold border-b border-cyber-emerald/20 pb-1">
                  <span>ID: {log.event_id}</span>
                  <span>{log.log_source.toUpperCase()}</span>
                </div>
                <div className="text-slate-300 font-mono break-all leading-tight">
                  {log.raw_text}
                </div>
                <div className="text-[9px] text-slate-400 text-right pt-0.5">
                  {log.timestamp}
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-xs text-center py-12">
              No matching receipts loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
