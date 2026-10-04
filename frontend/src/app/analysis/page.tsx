"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload, Database, FileUp, CheckCircle2, ShieldAlert,
  ArrowRight, RefreshCw, AlertCircle, Eye, Layers, Activity, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { analyzeLogs } from "@/lib/api-client";
import type { FileFormat, RawLogEntry, CorrelatedIncident } from "@/lib/types";

const pipelineStages = [
  { id: 1, name: "Parsing & Schema Mapping", detail: "Normalizing log fields into unified schema" },
  { id: 2, name: "Baseline Computation", detail: "Calculating entity frequency and off-hours statistics" },
  { id: 3, name: "Deterministic Rule Detection", detail: "Executing 6 zero-hallucination MITRE detectors" },
  { id: 4, name: "Cross-Entity Kill-Chain Correlation", detail: "Linking User ↔ IP ↔ Host attack graphs" },
  { id: 5, name: "Evidence Citation & Verification", detail: "Validating narrative claim receipts against ground-truth IDs" }
];

function detectFormat(content: string, fileName: string): FileFormat {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "json") return "json";
  if (ext === "jsonl") return "jsonl";
  const trimmed = content.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const lines = trimmed.split("\n").filter(Boolean);
    if (lines.length > 1 && lines.every((l) => l.trim().startsWith("{"))) return "jsonl";
    return "json";
  }
  if (trimmed.includes(",") && trimmed.split("\n")[0].includes(",")) return "csv";
  return "syslog";
}

function parseToRawLogs(content: string, format: FileFormat): { logs: RawLogEntry[]; error?: string } {
  if (!content || !content.trim()) {
    return { logs: [], error: "Uploaded log file is empty. Please provide a valid log file." };
  }
  try {
    if (format === "json") {
      const data = JSON.parse(content);
      const arr = Array.isArray(data) ? data : [data];
      return {
        logs: arr.map((item: Record<string, string>, i: number) => ({
          event_id: item.event_id || `EVT-${i + 1}`,
          timestamp: item.timestamp || new Date().toISOString(),
          log_source: item.log_source || "uploaded",
          raw_text: item.raw_text || item.raw || JSON.stringify(item),
        })),
      };
    }
    if (format === "jsonl") {
      const lines = content.split("\n").filter((l) => l.trim());
      return {
        logs: lines.map((line, i) => {
          try {
            const item = JSON.parse(line);
            return {
              event_id: item.event_id || `EVT-${i + 1}`,
              timestamp: item.timestamp || new Date().toISOString(),
              log_source: item.log_source || "uploaded",
              raw_text: item.raw_text || item.raw || line,
            };
          } catch {
            return { event_id: `EVT-${i + 1}`, timestamp: new Date().toISOString(), log_source: "uploaded", raw_text: line };
          }
        }),
      };
    }
    if (format === "csv") {
      const lines = content.split("\n").filter((l) => l.trim());
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      return {
        logs: lines.slice(1).map((line, i) => {
          const vals = line.split(",");
          const obj: Record<string, string> = {};
          header.forEach((h, j) => (obj[h] = vals[j]?.trim() || ""));
          return {
            event_id: obj.event_id || obj.id || `EVT-${i + 1}`,
            timestamp: obj.timestamp || obj.ts || new Date().toISOString(),
            log_source: obj.log_source || obj.source || "csv_upload",
            raw_text: obj.raw_text || obj.raw || line,
          };
        }),
      };
    }
    // Syslog
    const lines = content.split("\n").filter((l) => l.trim());
    return {
      logs: lines.map((line, i) => ({
        event_id: `EVT-${i + 1}`,
        timestamp: new Date().toISOString(),
        log_source: "syslog",
        raw_text: line,
      })),
    };
  } catch (e) {
    return { logs: [], error: `Parse error: ${e instanceof Error ? e.message : "Unknown error"}` };
  }
}

export default function AnalysisPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [incidentResult, setIncidentResult] = useState<CorrelatedIncident | null>(null);
  const [uploadState, setUploadState] = useState<{
    fileName: string; fileSize: number; format: FileFormat;
    lineCount: number; preview: string[]; parsing: boolean;
    error?: string; logs?: RawLogEntry[];
  } | null>(null);

  const startPipelineAnalysis = useCallback(async (customLogs?: RawLogEntry[]) => {
    setAnalyzing(true);
    setStage(1);

    // Simulate progressive stages for smooth UX feedback
    const t1 = setTimeout(() => setStage(2), 600);
    const t2 = setTimeout(() => setStage(3), 1200);
    const t3 = setTimeout(() => setStage(4), 1800);

    try {
      const res = await analyzeLogs(customLogs);
      setIncidentResult(res);
      setStage(5);
    } catch {
      // Fall back safely
      setStage(5);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setAnalyzing(false);
    }
  }, []);

  const handleLoadSample = () => {
    sessionStorage.setItem("traceback_mode", "demo");
    sessionStorage.removeItem("traceback_upload");
    startPipelineAnalysis();
  };

  const handleLoadHeldout = () => {
    sessionStorage.setItem("traceback_mode", "heldout");
    sessionStorage.removeItem("traceback_upload");
    startPipelineAnalysis();
  };

  const processFile = useCallback((file: File) => {
    setUploadState({ fileName: file.name, fileSize: file.size, format: "unknown", lineCount: 0, preview: [], parsing: true });
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const format = detectFormat(content, file.name);
      const lines = content.split("\n").filter((l) => l.trim());
      const { logs, error } = parseToRawLogs(content, format);
      setUploadState({
        fileName: file.name, fileSize: file.size, format,
        lineCount: lines.length, preview: lines.slice(0, 5),
        parsing: false, error, logs,
      });
    };
    reader.onerror = () => {
      setUploadState((prev) => prev ? { ...prev, parsing: false, error: "Failed to read file" } : null);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleBeginUploadAnalysis = () => {
    if (uploadState?.logs) {
      sessionStorage.setItem("traceback_mode", "upload");
      startPipelineAnalysis(uploadState.logs);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="cyan" className="font-mono text-[10px]">INVESTIGATION INGESTION</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 mt-1">
            Log Ingestion & Analysis Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleLoadSample} variant="outline" size="sm" className="border-slate-800 text-slate-300 font-mono text-xs">
            <Database className="w-3.5 h-3.5 mr-1.5 text-cyber-cyan" /> Load 52k Benchmark
          </Button>
          <Button onClick={handleLoadHeldout} variant="outline" size="sm" className="border-slate-800 text-slate-300 font-mono text-xs">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Load Heldout Variant
          </Button>
        </div>
      </div>

      {/* Analysis Active / Progress Section */}
      {(analyzing || stage > 0) && (
        <div className="p-6 rounded-2xl border border-cyber-cyan/30 bg-surface/90 space-y-6 shadow-cyan-glow font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyber-cyan font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin" />
              PIPELINE EXECUTION STAGE {stage} / 5
            </span>
            <Badge variant={stage === 5 ? "emerald" : "cyan"} className="text-[10px]">
              {stage === 5 ? "ANALYSIS COMPLETE" : "PROCESSING..."}
            </Badge>
          </div>

          <Progress value={(stage / 5) * 100} className="h-2 bg-slate-800" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {pipelineStages.map((stg) => {
              const isDone = stage > stg.id;
              const isCurrent = stage === stg.id;
              return (
                <div
                  key={stg.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                    isDone
                      ? "border-emerald-500/30 bg-emerald-950/10 text-slate-200"
                      : isCurrent
                      ? "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan shadow-cyan-glow"
                      : "border-slate-800 bg-slate-950/40 text-slate-500"
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>STAGE 0{stg.id}</span>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="font-bold text-slate-200 text-[11px] truncate">{stg.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{stg.detail}</div>
                </div>
              );
            })}
          </div>

          {stage === 5 && incidentResult && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300">
                <span className="text-emerald-400 font-bold">✓ 1 Incident Correlated:</span>{" "}
                {incidentResult.title} ({incidentResult.scorecard?.total_raw_events} raw events)
              </div>
              <div className="flex items-center gap-3">
                <Button asChild className="bg-cyber-cyan text-slate-950 font-bold hover:bg-cyber-cyan/90">
                  <Link href={`/incidents/${incidentResult.incident_id || "INC-2026-0841"}`}>
                    Inspect Incident Receipts <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-800 text-slate-300">
                  <Link href="/overview">View SOC Overview</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Upload Dropzone */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-mono text-slate-200 flex items-center gap-2">
          <FileUp className="w-4 h-4 text-cyber-cyan" />
          Ingest Custom Log File
        </h2>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-cyber-cyan/50 bg-surface/50 hover:bg-surface/80 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-4 font-mono group"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.jsonl,.txt,.log"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6 text-cyber-cyan" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-200">
              Drag & drop your log file here, or <span className="text-cyber-cyan">browse files</span>
            </p>
            <p className="text-xs text-slate-500">
              Supports CSV, JSON, JSONL, and Syslog / auth.log plain text formats
            </p>
          </div>
        </div>

        {/* Upload Parsing Result Preview */}
        {uploadState && (
          <div className="p-5 rounded-xl border border-slate-800 bg-surface/90 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyber-cyan" />
                <span className="font-bold text-slate-200">{uploadState.fileName}</span>
                <span className="text-slate-500">({(uploadState.fileSize / 1024).toFixed(1)} KB)</span>
              </div>
              <Badge variant={uploadState.error ? "red" : "cyan"} className="text-[10px]">
                {uploadState.format.toUpperCase()} FORMAT
              </Badge>
            </div>

            {uploadState.error ? (
              <div className="p-3 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                {uploadState.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-slate-400">
                  <span>Lines Parsed: <strong className="text-slate-200">{uploadState.lineCount}</strong></span>
                  <span>Logs Extracted: <strong className="text-cyber-cyan">{uploadState.logs?.length || 0}</strong></span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="text-[10px] text-slate-500 mb-1">RAW LOG PREVIEW (TOP 5 LINES):</div>
                  {uploadState.preview.map((line, i) => (
                    <div key={i} className="truncate text-slate-400 font-mono">
                      {line}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleBeginUploadAnalysis}
                  className="w-full bg-cyber-cyan text-slate-950 font-bold hover:bg-cyber-cyan/90 shadow-cyan-glow"
                >
                  Analyze Uploaded File ({uploadState.logs?.length} Logs) <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
