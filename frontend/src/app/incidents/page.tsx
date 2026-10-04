"use client";

import React, { useEffect, useState } from "react";
import { analyzeLogs, CorrelatedIncident } from "@/lib/api-client";
import { FunnelVisualizer } from "@/components/investigation/funnel-visualizer";
import { EvidenceNarrative } from "@/components/investigation/evidence-narrative";
import { ClearedDecoysPanel } from "@/components/investigation/cleared-decoys-panel";
import { InvestigationScorecard } from "@/components/investigation/scorecard-modal";
import { Flame, ShieldAlert, ArrowRight, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function IncidentsPage() {
  const [incident, setIncident] = useState<CorrelatedIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadData() {
    setLoading(true);
    const data = await analyzeLogs();
    setIncident(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 font-mono text-cyber-cyan">
        <div className="w-12 h-12 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
        <p className="text-sm tracking-wider">CORRELATING 52,149 LOG LINES INTO KILL-CHAIN NARRATIVE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Flame className="w-6 h-6 text-cyber-red animate-pulse" />
            Correlated Incident Console
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Deterministic detection + entity graph correlation + evidence-locked narration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2 font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze 52k Benchmark
          </Button>
          <Link href="/replay">
            <Button variant="cyber" size="sm" className="gap-2 font-mono text-xs">
              <span>Launch Attack Replay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Scorecard Widget */}
      <InvestigationScorecard scorecard={incident.scorecard} />

      {/* 52k -> 1 Funnel Visualizer */}
      <FunnelVisualizer
        rawCount={incident.scorecard.total_raw_events}
        normalizedCount={incident.scorecard.normalized_events}
        alertsCount={incident.scorecard.alerts_detected}
        incidentsCount={incident.scorecard.incidents_correlated}
        noiseReductionPct={incident.scorecard.noise_reduction_percentage}
      />

      {/* Interactive Evidence-Locked Narrative */}
      <EvidenceNarrative claims={incident.narrative} />

      {/* Cleared Decoys Panel */}
      <ClearedDecoysPanel
        decoys={incident.cleared_decoys}
        totalClearedCount={incident.scorecard.decoys_cleared}
      />
    </div>
  );
}
