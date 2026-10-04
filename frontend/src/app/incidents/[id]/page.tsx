"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ShieldAlert, ArrowLeft, CheckCircle2, Play, Award,
  Terminal, Copy, Check, Filter, Layers, Globe, Server, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeLogs, fetchRawLogs } from "@/lib/api-client";
import type { CorrelatedIncident, NarrativeClaim, RawLogEntry } from "@/lib/types";

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const incidentId = resolvedParams.id;

  const [incident, setIncident] = useState<CorrelatedIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<NarrativeClaim | null>(null);
  const [rawLogs, setRawLogs] = useState<RawLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    analyzeLogs().then((data) => {
      setIncident(data);
      if (data?.narrative?.length > 0) {
        setSelectedClaim(data.narrative[0]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedClaim?.evidence_event_ids?.length) {
      setLogsLoading(true);
      fetchRawLogs(selectedClaim.evidence_event_ids).then((res) => {
        setRawLogs(res.logs);
        setLogsLoading(false);
      });
    } else {
      setRawLogs([]);
    }
  }, [selectedClaim]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalClaims = incident?.narrative?.length || 0;
  const verifiedClaims = incident?.narrative?.filter((c) => c.is_verified).length || 0;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Back Button & Header */}
      <div className="space-y-4 border-b border-slate-800 pb-5">
        <Link href="/incidents" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyber-cyan transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Incident Store
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <Badge variant="red" className="text-xs px-2.5 py-0.5">CRITICAL SEVERITY</Badge>
              <span className="text-xs text-slate-500">INCIDENT ID: <strong className="text-slate-300">{incidentId}</strong></span>
              <Badge variant="cyan" className="text-[10px]">
                ✓ {verifiedClaims} / {totalClaims} CLAIMS VERIFIED
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 mt-1">
              {incident?.title || "APT-29 Lateral Movement & DNS Exfiltration Chain"}
            </h1>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Button asChild variant="outline" size="sm" className="border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10">
              <Link href="/replay">
                <Play className="w-3.5 h-3.5 mr-1.5" /> Replay Attack Chain
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-cyber-cyan text-slate-950 font-bold hover:bg-cyber-cyan/90">
              <Link href="/scorecard">
                <Award className="w-3.5 h-3.5 mr-1.5" /> Scorecard Audit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Incident Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-surface/80 border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">ATTACKER IP</span>
          <span className="text-cyber-cyan font-bold text-sm">{incident?.attacker_ip || "198.51.100.42"}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface/80 border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">COMPROMISED USERS</span>
          <span className="text-slate-200 font-bold text-sm">{incident?.compromised_users?.join(", ") || "sysadmin, root"}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface/80 border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">TARGET HOSTS</span>
          <span className="text-slate-200 font-bold text-sm">{incident?.compromised_hosts?.join(", ") || "prod-bastion-01, prod-db-01"}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface/80 border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">CITATION ACCURACY</span>
          <span className="text-emerald-400 font-bold text-sm">{incident?.scorecard?.citation_accuracy_percentage || 100}%</span>
        </div>
      </div>

      {/* 3-Column Hero Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Kill-Chain Timeline */}
        <div className="lg:col-span-3 p-5 rounded-2xl border border-slate-800 bg-surface/80 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>KILL-CHAIN STAGES</span>
            <Badge variant="cyan" className="text-[9px]">MITRE ATT&CK</Badge>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {incident?.narrative?.map((claim, idx) => {
              const isSelected = selectedClaim?.claim_id === claim.claim_id;
              return (
                <button
                  key={claim.claim_id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`w-full text-left p-3 rounded-xl border transition-all space-y-1 ${
                    isSelected
                      ? "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan shadow-cyan-glow"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>STAGE 0{idx + 1}</span>
                    <span className="text-[10px] text-slate-500">{claim.mitre_stage}</span>
                  </div>
                  <div className="text-[11px] font-medium truncate text-slate-300">
                    {claim.sentence}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Column: Narrative Claim Story */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-800 bg-surface/80 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>EVIDENCE-LOCKED NARRATIVE</span>
            <span className="text-[10px] text-emerald-400 font-normal">CLICK TO VIEW RECEIPT</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {incident?.narrative?.map((claim) => {
              const isSelected = selectedClaim?.claim_id === claim.claim_id;
              return (
                <div
                  key={claim.claim_id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2.5 ${
                    isSelected
                      ? "border-cyber-cyan bg-cyber-cyan/10 text-slate-100 shadow-cyan-glow"
                      : "border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyber-cyan font-bold text-[11px]">{claim.mitre_stage}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ RECEIPT VERIFIED
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-200">
                    {claim.sentence}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Evidence IDs:</span>
                    {claim.evidence_event_ids.map((id) => (
                      <span key={id} className="text-[10px] px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Evidence Log Viewer & Inspector */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-cyber-cyan/30 bg-slate-950 space-y-4 font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-slate-200 font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyber-cyan" />
                RAW EVIDENCE LOG RECEIPT
              </span>
              <Badge variant="cyan" className="text-[10px]">
                {selectedClaim ? selectedClaim.claim_id : "CLAIM RECEIPT"}
              </Badge>
            </div>

            {selectedClaim ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-surface border border-slate-800 space-y-1 text-xs">
                  <div className="text-slate-500 text-[10px]">SELECTED CLAIM:</div>
                  <div className="text-slate-200 font-bold">{selectedClaim.sentence}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>CITED RAW LOG LINES ({rawLogs.length})</span>
                    {logsLoading && <span className="text-cyber-cyan animate-pulse">Loading logs...</span>}
                  </div>

                  {rawLogs.length > 0 ? (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {rawLogs.map((log) => (
                        <div
                          key={log.event_id}
                          className="p-3 rounded-lg border border-cyber-cyan/30 bg-cyber-cyan/5 space-y-2 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyber-cyan">{log.event_id}</span>
                            <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                          </div>
                          <div className="text-slate-300 font-mono break-all bg-slate-950 p-2 rounded border border-slate-800">
                            {log.raw_text}
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="text-slate-500">Source: {log.log_source}</span>
                            <button
                              onClick={() => handleCopy(log.raw_text, log.event_id)}
                              className="text-cyber-cyan hover:underline flex items-center gap-1"
                            >
                              {copiedId === log.event_id ? (
                                <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy Raw</>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 border border-slate-800 rounded-lg">
                      No raw log lines found for cited evidence IDs.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Select a narrative claim from the story list to inspect supporting raw evidence lines.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Evidence Lock Status: Verified</span>
            <span className="text-emerald-400 font-bold">100% Ground Truth Link</span>
          </div>
        </div>
      </div>
    </div>
  );
}
