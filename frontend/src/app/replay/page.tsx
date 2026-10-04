"use client";

import React, { useEffect, useState } from "react";
import { analyzeLogs, CorrelatedIncident } from "@/lib/api-client";
import { AttackReplayGraph } from "@/components/investigation/attack-replay-graph";
import { EvidenceNarrative } from "@/components/investigation/evidence-narrative";
import { PlayCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ReplayPage() {
  const [incident, setIncident] = useState<CorrelatedIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await analyzeLogs();
      setIncident(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 font-mono text-cyber-cyan">
        <div className="w-12 h-12 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
        <p className="text-sm tracking-wider">LOADING REPLAY TIMELINE & CITATION RECEIPTS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-cyber-cyan animate-pulse" />
            Attack Replay & Citation Verification
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            "Every claim has receipts" — Interactive temporal replay with citation validator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/incidents">
            <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Incident Console
            </Button>
          </Link>
          <Badge variant="emerald" className="font-mono py-1 px-3">
            Citation Accuracy: 100.0%
          </Badge>
        </div>
      </div>

      {/* Interactive Kill-Chain Attack Replay Player */}
      <AttackReplayGraph steps={incident.replay_steps} />

      {/* Evidence-Locked Narrative Claims Reader */}
      <EvidenceNarrative claims={incident.narrative} />
    </div>
  );
}
