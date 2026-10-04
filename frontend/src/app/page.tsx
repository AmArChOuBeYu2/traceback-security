"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, ShieldAlert, ArrowRight, CheckCircle2, Play, Award,
  Database, Filter, Activity, Lock, Cpu, Eye, Code, Terminal, Layers, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const processSteps = [
  {
    num: "01",
    title: "PARSE",
    desc: "Ingest heterogeneous security logs (Syslog, CSV, JSON, JSONL, CloudTrail) with layout auto-detection.",
    icon: Database,
  },
  {
    num: "02",
    title: "BASELINE",
    desc: "Calculate statistical entity baselines for logon velocity, IP geo-transitions, and off-hours behavior.",
    icon: Activity,
  },
  {
    num: "03",
    title: "DETECT",
    desc: "Run 6 zero-hallucination deterministic detectors targeting MITRE ATT&CK tactics.",
    icon: ShieldAlert,
  },
  {
    num: "04",
    title: "CORRELATE",
    desc: "Cross-link User ↔ IP ↔ Host entities across temporal windows into unified kill-chains.",
    icon: Layers,
  },
  {
    num: "05",
    title: "NARRATE",
    desc: "Structure findings into an executive attack story without exposing raw logs to the LLM.",
    icon: Cpu,
  },
  {
    num: "06",
    title: "VERIFY",
    desc: "Validate every narrative claim against ground-truth event ID receipts.",
    icon: CheckCircle2,
  },
];

const simulatedClaims = [
  {
    id: "step-1",
    stage: "Initial Access",
    time: "14:02:01 UTC",
    title: "SSH Brute Force Campaign",
    claim: "Threat actor IP 198.51.100.42 initiated a high-velocity SSH brute force attack against prod-bastion-01.",
    evidenceIds: ["EV-10001", "EV-10002", "EV-10050"],
    logs: [
      { id: "EV-10001", raw: "sshd[4912]: Failed password for invalid user admin from 198.51.100.42 port 50001 ssh2" },
      { id: "EV-10002", raw: "sshd[4912]: Failed password for invalid user root from 198.51.100.42 port 50002 ssh2" },
    ]
  },
  {
    id: "step-2",
    stage: "Account Compromise",
    time: "14:03:15 UTC",
    title: "Authentication Success Following Failures",
    claim: "Attacker successfully authenticated via SSH using sysadmin credentials following 100 failed attempts.",
    evidenceIds: ["EV-10101"],
    logs: [
      { id: "EV-10101", raw: "sshd[4915]: Accepted password for sysadmin from 198.51.100.42 port 50101 ssh2 on host prod-bastion-01" }
    ]
  },
  {
    id: "step-3",
    stage: "Privilege Escalation",
    time: "14:04:02 UTC",
    title: "Sudo Elevation & Credential Harvest",
    claim: "Sudo elevation executed to run Mimikatz in-memory credential dump tool on prod-bastion-01.",
    evidenceIds: ["EV-10102", "EV-10103"],
    logs: [
      { id: "EV-10102", raw: "sudo: sysadmin : TTY=pts/0 ; PWD=/home/sysadmin ; USER=root ; COMMAND=/bin/bash" },
      { id: "EV-10103", raw: "process_creation host=prod-bastion-01 process=/usr/bin/mimikatz cmd='mimikatz.exe securlsa::logonpasswords'" }
    ]
  },
  {
    id: "step-4",
    stage: "Exfiltration",
    time: "14:10:07 UTC",
    title: "Encrypted DNS TXT Tunneling",
    claim: "Staged database vault payload exfiltrated over encrypted DNS TXT queries to c2-exfil-node.attacker.com.",
    evidenceIds: ["EV-10107", "EV-10108"],
    logs: [
      { id: "EV-10107", raw: "dns_query client=192.168.1.99 query=chunk-001.a4f102c9.c2-exfil-node.attacker.com record_type=TXT" }
    ]
  }
];

export default function MarketingHomepage() {
  const [activeClaimIdx, setActiveClaimIdx] = useState(0);
  const [activePreviewTab, setActivePreviewTab] = useState<"overview" | "incidents" | "replay" | "scorecard">("overview");

  const currentClaim = simulatedClaims[activeClaimIdx];

  return (
    <div className="space-y-24 pb-20 pt-6 max-w-[1280px] mx-auto px-4 md:px-6">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div className="lg:col-span-7 space-y-6" {...fadeUp} transition={{ duration: 0.5 }}>
            <Badge variant="cyan" className="font-mono text-xs px-3 py-1 tracking-wider uppercase">
              Deterministic Security Investigation Platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 font-mono leading-[1.1]">
              <span className="text-slate-100">50,000 log lines.</span><br />
              <span className="text-cyber-cyan">One attacker.</span><br />
              <span className="text-slate-100">Every claim proven.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
              TRACEBACK turns security event noise into evidence-linked attack stories. Detect the pattern, follow the chain, and inspect the exact raw log receipts behind every claim.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" className="bg-cyber-cyan text-slate-950 font-mono font-bold hover:bg-cyber-cyan/90 shadow-cyan-glow">
                <Link href="/analysis">
                  Start Investigation <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-800 text-slate-300 hover:bg-slate-800 font-mono">
                <Link href="/analysis">
                  <Database className="mr-2 w-4 h-4 text-cyber-cyan" /> Load Sample Dataset
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero Pipeline Particle Visualization */}
          <motion.div
            className="lg:col-span-5 rounded-2xl border border-slate-800 bg-surface/80 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyber-cyan animate-pulse" />
                NOISE REDUCTION ENGINE
              </span>
              <Badge variant="cyan" className="text-[10px] font-mono">99.93% NOISE FILTERED</Badge>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>RAW EVENTS INGESTED</span>
                  <span className="text-slate-200 font-bold">52,149</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full w-full" />
                </div>
              </div>

              <div className="flex justify-center my-1 text-slate-600">
                <ArrowRight className="w-4 h-4 rotate-90 text-cyber-cyan" />
              </div>

              <div className="p-3 rounded-lg border border-cyber-cyan/20 bg-cyber-cyan/5 space-y-1">
                <div className="flex justify-between text-cyber-cyan">
                  <span>DETERMINISTIC ALERTS</span>
                  <span className="font-bold">31 FINDINGS</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyber-cyan h-full w-1/3" />
                </div>
              </div>

              <div className="flex justify-center my-1 text-slate-600">
                <ArrowRight className="w-4 h-4 rotate-90 text-cyber-cyan" />
              </div>

              <div className="p-4 rounded-xl border-2 border-cyber-cyan/40 bg-cyber-cyan/10 space-y-2 shadow-cyan-glow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-cyber-cyan" />
                    CORRELATION INCIDENT
                  </span>
                  <span className="text-xs font-bold text-cyber-cyan">INC-2026-0841</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  APT-29 Lateral Pivot & DNS Exfiltration
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    ✓ 100% EVIDENCE LINKED
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── The Problem Section ──────────────────────────────────── */}
      <section className="space-y-8 pt-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="outline" className="text-xs font-mono border-slate-800 text-slate-400">
            THE SOC PROBLEM
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-100">
            Security logs tell you everything.<br />
            <span className="text-cyber-cyan">Except what actually happened.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Security teams don't need another stream of disconnected warnings. They need the connected story behind them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-6 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-semibold">
              <ShieldAlert className="w-4 h-4" />
              TRADITIONAL SIEM WORKFLOW
            </div>
            <div className="space-y-2 font-mono text-xs text-slate-400">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">52,000+ Raw Log Lines</div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">Hundreds of Disconnected Alerts</div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">Manual IP & Host Correlation by Analysts</div>
              <div className="p-2.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">High Triage Time & Unverified Assumptions</div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-cyber-cyan/30 bg-cyber-cyan/5 space-y-4 shadow-cyan-glow">
            <div className="flex items-center gap-2 text-cyber-cyan font-mono text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              TRACEBACK EVIDENCE PIPELINE
            </div>
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <div className="p-2.5 rounded bg-surface border border-slate-800">52,000 Raw Log Events</div>
              <div className="p-2.5 rounded bg-surface border border-slate-800">31 Deterministic Rule Findings</div>
              <div className="p-2.5 rounded bg-surface border border-slate-800">1 Unified Kill-Chain Incident</div>
              <div className="p-2.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 font-bold">
                ✓ Proven Attack Story with 100% Raw Receipts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Process Steps Section ────────────────────────────────── */}
      <section id="how-it-works" className="space-y-8 pt-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="cyan" className="text-xs font-mono">PIPELINE ARCHITECTURE</Badge>
          <h2 className="text-3xl font-extrabold font-mono text-slate-100">
            How TRACEBACK Operates
          </h2>
          <p className="text-slate-400 text-sm">
            A 6-step deterministic pipeline converting noisy log streams into auditable incidents.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-5 rounded-xl border border-slate-800 bg-surface/60 hover:bg-surface hover:border-cyber-cyan/40 transition-all group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyber-cyan font-bold">{step.num}</span>
                  <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center group-hover:border-cyber-cyan/50">
                    <Icon className="w-4 h-4 text-cyber-cyan" />
                  </div>
                </div>
                <h3 className="font-mono font-bold text-slate-100 text-sm group-hover:text-cyber-cyan transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Killer Feature Interactive Section ───────────────────── */}
      <section className="space-y-8 pt-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="cyan" className="text-xs font-mono">THE KILLER FEATURE</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-100">
            AI can tell a story.<br />
            <span className="text-cyber-cyan">TRACEBACK makes it prove the story.</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Click any claim in the narrative below to inspect the exact ground-truth evidence event IDs behind it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-2xl border border-cyber-cyan/30 bg-surface/80 backdrop-blur-xl shadow-2xl">
          {/* Narrative Claims List */}
          <div className="lg:col-span-6 space-y-3">
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2 pb-1 border-b border-slate-800">
              <FileText className="w-4 h-4 text-cyber-cyan" />
              INCIDENT NARRATIVE CLAIMS
            </div>
            <div className="space-y-2">
              {simulatedClaims.map((claim, idx) => {
                const isSelected = idx === activeClaimIdx;
                return (
                  <button
                    key={claim.id}
                    onClick={() => setActiveClaimIdx(idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 font-mono ${
                      isSelected
                        ? "border-cyber-cyan bg-cyber-cyan/10 text-slate-100 shadow-cyan-glow"
                        : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyber-cyan font-bold">{claim.stage}</span>
                      <span className="text-slate-500 text-[11px]">{claim.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200">
                      {claim.claim}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      {claim.evidenceIds.map((evId) => (
                        <span key={evId} className="text-[10px] px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan font-mono border border-cyber-cyan/30">
                          {evId}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Evidence Inspector Drawer */}
          <div className="lg:col-span-6 p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-slate-300 font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyber-cyan" />
                  EVIDENCE LOG INSPECTOR
                </span>
                <Badge variant="emerald" className="text-[10px]">VERIFIED RECEIPT</Badge>
              </div>

              <div className="space-y-3">
                <div className="text-slate-400 text-xs">
                  <span className="text-slate-500">Claim Title:</span> {currentClaim.title}
                </div>
                <div className="text-slate-400 text-xs">
                  <span className="text-slate-500">Cited Event IDs:</span>{" "}
                  {currentClaim.evidenceIds.map((id) => (
                    <span key={id} className="text-cyber-cyan font-bold mr-1">
                      {id}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-slate-500 text-[11px]">SUPPORTING RAW LOG LINES:</span>
                  {currentClaim.logs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg border border-cyber-cyan/30 bg-cyber-cyan/5 space-y-1 text-[11px]">
                      <div className="text-cyber-cyan font-bold">{log.id}</div>
                      <div className="text-slate-300 break-all">{log.raw}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Citation Linkage: 100% Verified</span>
              <Button asChild size="sm" variant="ghost" className="text-cyber-cyan hover:text-cyber-cyan/80 p-0 h-auto">
                <Link href="/incidents/INC-2026-0841">
                  View Full Incident Receipts <ArrowRight className="ml-1 w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why TRACEBACK Section ────────────────────────────────── */}
      <section className="space-y-8 pt-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="text-xs font-mono border-slate-800 text-slate-400">
            PRODUCT ADVANTAGES
          </Badge>
          <h2 className="text-3xl font-extrabold font-mono text-slate-100">
            Why TRACEBACK Matters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-slate-800 bg-surface/80 hover:border-cyber-cyan/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyber-cyan" />
            </div>
            <h3 className="font-mono font-bold text-slate-100 text-base">INCIDENTS, NOT ALERTS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Security teams don't need another stream of disconnected warnings. They need the full story behind them.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-surface/80 hover:border-cyber-cyan/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-cyber-cyan" />
            </div>
            <h3 className="font-mono font-bold text-slate-100 text-base">EVERY CLAIM HAS RECEIPTS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evidence-linked narratives let analysts inspect the exact raw log events supporting each conclusion.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-surface/80 hover:border-cyber-cyan/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-cyber-cyan" />
            </div>
            <h3 className="font-mono font-bold text-slate-100 text-base">TESTED AGAINST DECOYS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              False positives are part of the evaluation, not something hidden behind a canned demo.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Console Preview Section ──────────────────────────────── */}
      <section className="space-y-8 pt-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="cyan" className="text-xs font-mono">PRODUCT CONSOLE PREVIEW</Badge>
          <h2 className="text-3xl font-extrabold font-mono text-slate-100">
            A Serious Cybersecurity Console
          </h2>
          <p className="text-slate-400 text-sm">
            Switch tabs below to preview the actual security console views.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-surface/90 space-y-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActivePreviewTab("overview")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activePreviewTab === "overview"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview Command Center
            </button>
            <button
              onClick={() => setActivePreviewTab("incidents")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activePreviewTab === "incidents"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Hero Incident Detail
            </button>
            <button
              onClick={() => setActivePreviewTab("replay")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activePreviewTab === "replay"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Attack Replay
            </button>
            <button
              onClick={() => setActivePreviewTab("scorecard")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activePreviewTab === "scorecard"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Scorecard Audit
            </button>
          </div>

          <div className="p-8 rounded-xl border border-slate-800/80 bg-slate-950 text-center space-y-4 font-mono">
            {activePreviewTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-left">
                  <div className="p-4 rounded-lg bg-surface border border-slate-800">
                    <div className="text-[10px] text-slate-500">EVENTS ANALYZED</div>
                    <div className="text-xl font-bold text-slate-100">52,149</div>
                  </div>
                  <div className="p-4 rounded-lg bg-surface border border-slate-800">
                    <div className="text-[10px] text-slate-500">FINDINGS</div>
                    <div className="text-xl font-bold text-cyber-cyan">31</div>
                  </div>
                  <div className="p-4 rounded-lg bg-surface border border-slate-800">
                    <div className="text-[10px] text-slate-500">INCIDENTS</div>
                    <div className="text-xl font-bold text-rose-400">1</div>
                  </div>
                  <div className="p-4 rounded-lg bg-surface border border-slate-800">
                    <div className="text-[10px] text-slate-500">NOISE REDUCTION</div>
                    <div className="text-xl font-bold text-emerald-400">99.93%</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400">SOC Overview Console with real-time funnel and suspect entity tracking.</p>
              </div>
            )}

            {activePreviewTab === "incidents" && (
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">CRITICAL INCIDENT</span>
                    <Badge variant="cyan" className="text-[10px]">7 / 7 CLAIMS VERIFIED</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">APT-29 Lateral Pivot & DNS Exfiltration</h4>
                  <p className="text-xs text-slate-400">Attacker IP 198.51.100.42 → Bastion → DB Cluster → DNS Exfiltration</p>
                </div>
              </div>
            )}

            {activePreviewTab === "replay" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4 text-xs text-cyber-cyan">
                  <span className="p-2 rounded bg-surface border border-slate-800">198.51.100.42</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="p-2 rounded bg-surface border border-slate-800">prod-bastion-01</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="p-2 rounded bg-surface border border-slate-800">prod-db-01</span>
                </div>
                <p className="text-xs text-slate-400">Interactive step-by-step kill-chain graph replay.</p>
              </div>
            )}

            {activePreviewTab === "scorecard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-left text-xs">
                  <div className="p-3 rounded bg-surface border border-slate-800">Citation Linkage Accuracy: 100.0%</div>
                  <div className="p-3 rounded bg-surface border border-slate-800">Detector Precision: 100.0%</div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button asChild className="bg-cyber-cyan text-slate-950 font-mono font-bold hover:bg-cyber-cyan/90">
                <Link href="/overview">
                  Open Security Console <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust / AI Architecture Section ─────────────────────── */}
      <section className="p-8 rounded-2xl border border-slate-800 bg-surface/60 space-y-6 text-center">
        <Badge variant="cyan" className="text-xs font-mono">TRUST & SECURITY ARCHITECTURE</Badge>
        <h2 className="text-3xl font-extrabold font-mono text-slate-100">
          AI writes the explanation.<br />
          <span className="text-cyber-cyan">Code decides the evidence.</span>
        </h2>
        <div className="max-w-3xl mx-auto p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs font-mono text-slate-300 leading-relaxed">
          RAW LOGS <span className="text-rose-400 font-bold">✕ NOT SENT TO LLM</span> → STRUCTURED FINDINGS → GEMINI API → STRUCTURED NARRATIVE → CITATION VALIDATOR → VERIFIED CLAIMS
        </div>
      </section>

      {/* ─── Final CTA & Minimal Footer ───────────────────────────── */}
      <section className="text-center space-y-6 py-12 border-t border-slate-800">
        <h2 className="text-3xl font-extrabold font-mono text-slate-100">
          Stop searching through events.<br />
          <span className="text-cyber-cyan">Start investigating incidents.</span>
        </h2>
        <div>
          <Button asChild size="lg" className="bg-cyber-cyan text-slate-950 font-mono font-bold hover:bg-cyber-cyan/90 shadow-cyan-glow">
            <Link href="/analysis">
              Start an Investigation <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 pt-8 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-slate-300 font-bold">TRACEBACK</span> — Evidence-linked security log investigation platform.
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <Link href="/overview" className="hover:text-slate-300">Overview</Link>
          <Link href="/analysis" className="hover:text-slate-300">Investigate</Link>
          <Link href="/incidents" className="hover:text-slate-300">Incidents</Link>
          <Link href="/replay" className="hover:text-slate-300">Replay</Link>
          <Link href="/scorecard" className="hover:text-slate-300">Scorecard</Link>
          <a href="https://github.com/AmArChOuBeYu2/traceback-security" target="_blank" rel="noreferrer" className="text-cyber-cyan hover:underline">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
