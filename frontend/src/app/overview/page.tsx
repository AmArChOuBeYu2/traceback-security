"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldAlert, Activity, Filter, ArrowRight, Layers,
  UserCheck, Server, Globe, CheckCircle2, Zap, RefreshCw, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { analyzeLogs } from "@/lib/api-client";
import type { CorrelatedIncident } from "@/lib/types";

export default function OverviewPage() {
  const [incident, setIncident] = useState<CorrelatedIncident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeLogs().then((data) => {
      setIncident(data);
      setLoading(false);
    });
  }, []);

  const totalEvents = incident?.scorecard?.total_raw_events || 52149;
  const totalAlerts = incident?.scorecard?.alerts_detected || 31;
  const noiseReduction = incident?.scorecard?.noise_reduction_percentage || 99.93;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" className="font-mono text-[10px]">SOC COMMAND CENTER</Badge>
            <span className="text-xs font-mono text-slate-500">LIVE SESSION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 mt-1">
            Security Intelligence Overview
          </h1>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              analyzeLogs().then((d) => {
                setIncident(d);
                setLoading(false);
              });
            }}
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-cyber-cyan" : ""}`} />
            Refresh Data
          </Button>
          <Button asChild size="sm" className="bg-cyber-cyan text-slate-950 font-bold hover:bg-cyber-cyan/90">
            <Link href="/analysis">
              New Investigation <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-surface/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono text-slate-400">EVENTS ANALYZED</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-slate-100">
              {loading ? "..." : totalEvents.toLocaleString()}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">Raw log stream baseline</p>
          </CardContent>
        </Card>

        <Card className="border-cyber-cyan/30 bg-cyber-cyan/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono text-cyber-cyan">RULE FINDINGS</span>
            <Filter className="w-4 h-4 text-cyber-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-cyber-cyan">
              {loading ? "..." : totalAlerts}
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-1">Deterministic alert triggers</p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-rose-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono text-rose-400">CORRELATION INCIDENTS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-rose-400">
              {loading ? "..." : "1"}
            </div>
            <p className="text-[11px] font-mono text-rose-300/80 mt-1">1 Critical Kill-Chain</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono text-emerald-400">NOISE REDUCTION</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {loading ? "..." : `${noiseReduction}%`}
            </div>
            <p className="text-[11px] font-mono text-emerald-300/80 mt-1">Decoys safely cleared</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel & Priority Incident Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 52k -> 31 -> 1 Compression Funnel */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-800 bg-surface/80 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyber-cyan" />
                EVENT-TO-INCIDENT FUNNEL
              </span>
              <Badge variant="cyan" className="text-[10px] font-mono">AUTOMATED PIPELINE</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-6 leading-relaxed">
              How TRACEBACK reduces 52,149 raw security log events into a single evidence-locked incident story.
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>RAW EVENTS</span>
                  <span className="text-slate-100 font-bold">{totalEvents.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full w-full" />
                </div>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowRight className="w-4 h-4 rotate-90 text-cyber-cyan" />
              </div>

              <div className="p-3.5 rounded-xl border border-cyber-cyan/30 bg-cyber-cyan/5 space-y-1">
                <div className="flex justify-between text-cyber-cyan">
                  <span>RULE DETECTOR FINDINGS</span>
                  <span className="font-bold">{totalAlerts}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyber-cyan h-full w-2/5" />
                </div>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowRight className="w-4 h-4 rotate-90 text-cyber-cyan" />
              </div>

              <div className="p-4 rounded-xl border-2 border-rose-500/40 bg-rose-950/20 space-y-2 shadow-red-glow">
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>CORRELATION INCIDENT</span>
                  <span>1 CRITICAL</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Filter Efficiency: {noiseReduction}%</span>
            <span className="text-emerald-400 font-bold">Zero False Positives in Story</span>
          </div>
        </div>

        {/* Priority Critical Incident Card */}
        <div className="lg:col-span-7 p-6 rounded-2xl border-2 border-rose-500/40 bg-surface/90 space-y-6 shadow-red-glow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="red" className="font-mono text-xs px-2.5 py-0.5 animate-pulse">
                CRITICAL SEVERITY
              </Badge>
              <span className="text-xs font-mono text-slate-400">RISK SCORE: <strong className="text-rose-400">99/100</strong></span>
            </div>
            <Badge variant="cyan" className="text-[10px] font-mono">✓ 100% EVIDENCE VERIFIED</Badge>
          </div>

          <div className="space-y-3 font-mono">
            <div className="text-xs text-slate-500">INCIDENT ID: INC-2026-0841</div>
            <h3 className="text-xl font-bold text-slate-100">
              {incident?.title || "APT-29 Lateral Movement & DNS Exfiltration Chain"}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Threat actor IP 198.51.100.42 executed SSH brute force, gained access to sysadmin, escalated privileges via Mimikatz, pivoted laterally to prod-db-01, staged customer_vault.dump, and exfiltrated data over DNS TXT queries.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">ATTACKER IP</span>
              <span className="font-bold text-cyber-cyan">{incident?.attacker_ip || "198.51.100.42"}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">VICTIM USER</span>
              <span className="font-bold text-slate-200">sysadmin, root</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">TARGET HOST</span>
              <span className="font-bold text-slate-200">prod-db-01</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">C2 DOMAIN</span>
              <span className="font-bold text-rose-400">c2-exfil-node.com</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">6 Attack Stages Correlated</span>
            <Button asChild size="lg" className="bg-rose-500 text-slate-950 font-mono font-bold hover:bg-rose-400">
              <Link href="/incidents/INC-2026-0841">
                Investigate Incident <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Suspects & Cleared Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Suspect Entities Table */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-800 bg-surface/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyber-cyan" />
              SUSPECT ENTITIES RANKING
            </span>
            <span className="text-xs font-mono text-slate-500">SORTED BY RISK</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-2">ENTITY</th>
                  <th className="pb-2">TYPE</th>
                  <th className="pb-2">RISK SCORE</th>
                  <th className="pb-2">FINDINGS</th>
                  <th className="pb-2">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 font-bold text-cyber-cyan">198.51.100.42</td>
                  <td className="py-3 text-slate-400">Source IP</td>
                  <td className="py-3 font-bold text-rose-400">99 / 100</td>
                  <td className="py-3">101 failures</td>
                  <td className="py-3"><Badge variant="red" className="text-[9px]">ATTACKER</Badge></td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-slate-200">sysadmin</td>
                  <td className="py-3 text-slate-400">User Account</td>
                  <td className="py-3 font-bold text-amber-400">85 / 100</td>
                  <td className="py-3">1 Sudo Elev</td>
                  <td className="py-3"><Badge variant="amber" className="text-[9px]">COMPROMISED</Badge></td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-slate-200">prod-bastion-01</td>
                  <td className="py-3 text-slate-400">Host</td>
                  <td className="py-3 font-bold text-amber-400">78 / 100</td>
                  <td className="py-3">Mimikatz Exec</td>
                  <td className="py-3"><Badge variant="amber" className="text-[9px]">PIVOT NODE</Badge></td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-slate-200">prod-db-01</td>
                  <td className="py-3 text-slate-400">Host</td>
                  <td className="py-3 font-bold text-rose-400">95 / 100</td>
                  <td className="py-3">Vault Dump</td>
                  <td className="py-3"><Badge variant="red" className="text-[9px]">TARGET HOST</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cleared Activity False Positive Panel */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-800 bg-surface/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              CLEARED ACTIVITY AUDIT
            </span>
            <Badge variant="emerald" className="text-[10px] font-mono">NON-MALICIOUS</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Suspicious-looking activity that was evaluated by baseline engines but not escalated to incident status.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Routine Nightly Backup Job</span>
                <span className="text-emerald-400 text-[10px]">CLEARED</span>
              </div>
              <p className="text-[11px] text-slate-500">
                cron[1029]: (/usr/local/bin/check_disk_space.sh) — Routine operational CMD execution matching historical baseline.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>K8s Scheduler API Ping</span>
                <span className="text-emerald-400 text-[10px]">CLEARED</span>
              </div>
              <p className="text-[11px] text-slate-500">
                system:kube-scheduler GET /pods — Authorized internal service probe.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Internal Nginx Health Checks</span>
                <span className="text-emerald-400 text-[10px]">CLEARED</span>
              </div>
              <p className="text-[11px] text-slate-500">
                10.0.1.12 GET /api/v1/health HTTP/1.1 200 — High volume expected health pings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
