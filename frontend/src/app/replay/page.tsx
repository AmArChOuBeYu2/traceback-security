"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { analyzeLogs } from "@/lib/api-client";
import { AttackReplayGraph } from "@/components/investigation/attack-replay-graph";
import { Play, ArrowLeft, ShieldAlert, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CorrelatedIncident } from "@/lib/types";

export default function ReplayPage() {
  const [incident, setIncident] = useState<CorrelatedIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    analyzeLogs().then((data) => {
      setIncident(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Badge variant="cyan" className="font-mono text-[10px]">TEMPORAL RECONSTRUCTION</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 mt-1">
            Attack Replay & Kill-Chain Visualizer
          </h1>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <Button asChild variant="outline" size="sm" className="border-slate-800 text-slate-300">
            <Link href="/incidents">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Incidents
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-cyber-cyan text-slate-950 font-bold hover:bg-cyber-cyan/90">
            <Link href="/scorecard">
              <Award className="w-3.5 h-3.5 mr-1.5" /> View Scorecard
            </Link>
          </Button>
        </div>
      </div>

      {/* Replay Graph Component */}
      {incident?.replay_steps && incident.replay_steps.length > 0 ? (
        <AttackReplayGraph steps={incident.replay_steps} />
      ) : (
        <div className="p-12 text-center border border-slate-800 rounded-xl font-mono text-slate-400">
          {loading ? "Loading replay steps..." : "No replay steps available."}
        </div>
      )}
    </div>
  );
}
