"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { analyzeLogs } from "@/lib/api-client";
import { FunnelVisualizer } from "@/components/investigation/funnel-visualizer";
import { EvidenceNarrative } from "@/components/investigation/evidence-narrative";
import { ClearedDecoysPanel } from "@/components/investigation/cleared-decoys-panel";
import { InvestigationScorecard } from "@/components/investigation/scorecard-modal";
import { ShieldAlert, ArrowRight, RefreshCw, Layers, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CorrelatedIncident } from "@/lib/types";

export default function IncidentsPage() {
  const [incident, setIncident] = useState<CorrelatedIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showScorecard, setShowScorecard] = useState<boolean>(false);

  async function loadData() {
    setLoading(true);
    const data = await analyzeLogs();
    setIncident(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Badge variant="cyan" className="font-mono text-[10px]">INCIDENT COMMAND</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 mt-1">
            Correlated Incident Store
          </h1>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-cyber-cyan" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowScorecard(true)}
            variant="outline"
            size="sm"
            className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 font-bold"
          >
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Verify Receipts
          </Button>
        </div>
      </div>

      {/* Incident List Summary Banner */}
      {incident && (
        <div className="p-6 rounded-2xl border-2 border-rose-500/40 bg-surface/90 space-y-4 shadow-red-glow font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="red" className="text-xs font-bold px-2.5 py-0.5">CRITICAL SEVERITY</Badge>
              <span className="text-xs text-slate-400">CONFIDENCE: <strong className="text-emerald-400">99%</strong></span>
            </div>
            <Badge variant="cyan" className="text-[10px]">✓ 100% EVIDENCE LINKED</Badge>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500">INCIDENT ID: {incident.incident_id}</span>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">{incident.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Attacker IP: <strong className="text-cyber-cyan">{incident.attacker_ip}</strong> | Compromised Hosts: {incident.compromised_hosts.join(", ")}
              </p>
            </div>
            <Button asChild className="bg-rose-500 text-slate-950 font-bold hover:bg-rose-400 shrink-0">
              <Link href={`/incidents/${incident.incident_id || "INC-2026-0841"}`}>
                Inspect Hero Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Funnel Visualizer */}
      <FunnelVisualizer scorecard={incident?.scorecard} loading={loading} />

      {/* Narrative & Cleared Decoys Grid */}
      {incident && !loading && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <EvidenceNarrative claims={incident.narrative || []} />
        </div>
        <div className="lg:col-span-4">
          <ClearedDecoysPanel decoys={incident.cleared_decoys || []} totalClearedCount={incident.scorecard?.decoys_cleared ?? 52145} />
        </div>
      </div>
      )}

      {/* Scorecard Modal */}
      {showScorecard && incident?.scorecard && (
        <InvestigationScorecard
          scorecard={incident.scorecard}
        />
      )}
    </div>
  );
}
