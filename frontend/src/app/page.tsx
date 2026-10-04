"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, Database, FileUp, ArrowRight, Upload, AlertCircle,
  CheckCircle2, Layers, X, FileText, Eye, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FileFormat, RawLogEntry } from "@/lib/types";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

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
    // syslog
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

export default function LandingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<{
    fileName: string; fileSize: number; format: FileFormat;
    lineCount: number; preview: string[]; parsing: boolean;
    error?: string; logs?: RawLogEntry[];
  } | null>(null);

  const handleLoadSample = () => {
    sessionStorage.setItem("traceback_mode", "demo");
    sessionStorage.removeItem("traceback_upload");
    router.push("/analysis");
  };

  const handleLoadHeldout = () => {
    sessionStorage.setItem("traceback_mode", "heldout");
    sessionStorage.removeItem("traceback_upload");
    router.push("/analysis");
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
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleBeginAnalysis = () => {
    if (uploadState?.logs) {
      sessionStorage.setItem("traceback_mode", "upload");
      sessionStorage.setItem("traceback_upload", JSON.stringify(uploadState.logs));
      router.push("/analysis");
    }
  };

  const formatLabels: Record<FileFormat, string> = {
    csv: "CSV (Comma-Separated)", json: "JSON", jsonl: "JSON Lines",
    syslog: "Syslog / Plain Text", unknown: "Detecting...",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pt-4">
      {/* Hero */}
      <motion.div className="text-center space-y-5" {...fadeUp} transition={{ duration: 0.5 }}>
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shadow-cyan-glow">
            <Shield className="w-8 h-8 text-cyber-cyan" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-mono">
          <span className="text-slate-100">TRACE</span>
          <span className="text-cyber-cyan">BACK</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
          50,000 log lines. <span className="text-cyber-cyan font-semibold">One attacker.</span>{" "}
          Every claim proven.
        </p>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Evidence-linked security log investigation. Deterministic detection with kill-chain
          correlation. Click any claim — the raw logs light up.
        </p>
      </motion.div>

      {/* Action Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial="initial" animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Load Sample — Primary CTA */}
        <motion.button
          variants={fadeUp}
          onClick={handleLoadSample}
          className="group p-6 rounded-xl border-2 border-cyber-cyan/30 bg-cyber-cyan/5 hover:bg-cyber-cyan/10 hover:border-cyber-cyan/50 transition-all text-left space-y-3 shadow-cyan-glow hover:shadow-[0_0_40px_rgba(0,243,255,0.2)]"
        >
          <div className="w-10 h-10 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-cyber-cyan" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-base text-slate-100">Load Sample Dataset</h3>
            <p className="text-xs text-slate-400 mt-1">52,149 benchmark events with embedded APT attack chain</p>
          </div>
          <div className="flex items-center gap-1.5 text-cyber-cyan text-xs font-mono font-semibold group-hover:gap-2.5 transition-all">
            <span>Begin Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.button>

        {/* Upload File */}
        <motion.button
          variants={fadeUp}
          onClick={() => setShowUpload(!showUpload)}
          className={cn(
            "group p-6 rounded-xl border transition-all text-left space-y-3",
            showUpload
              ? "border-cyber-amber/40 bg-cyber-amber/5"
              : "border-slate-800 bg-surface/60 hover:bg-surface/80 hover:border-slate-700"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <FileUp className="w-5 h-5 text-cyber-amber" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-base text-slate-100">Upload Log File</h3>
            <p className="text-xs text-slate-400 mt-1">CSV, JSON, JSONL, or syslog format</p>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-cyber-amber text-xs font-mono transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Select or drop file</span>
          </div>
        </motion.button>

        {/* Load Unseen */}
        <motion.button
          variants={fadeUp}
          onClick={handleLoadHeldout}
          className="group p-6 rounded-xl border border-slate-800 bg-surface/60 hover:bg-surface/80 hover:border-slate-700 transition-all text-left space-y-3"
        >
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <Eye className="w-5 h-5 text-cyber-purple" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-base text-slate-100">Load Unseen Logs</h3>
            <p className="text-xs text-slate-400 mt-1">Held-out variant (seed 1337) for blind evaluation</p>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-cyber-purple text-xs font-mono transition-colors">
            <Zap className="w-3.5 h-3.5" />
            <span>Run blind test</span>
          </div>
        </motion.button>
      </motion.div>

      {/* Upload Zone */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-slate-800 bg-surface/80 p-6 space-y-4"
        >
          {!uploadState ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
                dragOver
                  ? "border-cyber-cyan bg-cyber-cyan/5"
                  : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30"
              )}
            >
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">
                Drop your log file here or <span className="text-cyber-cyan">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">.csv, .json, .jsonl, .log, .txt</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json,.jsonl,.log,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyber-amber" />
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-100">{uploadState.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {(uploadState.fileSize / 1024).toFixed(1)} KB · {uploadState.lineCount.toLocaleString()} lines
                    </p>
                  </div>
                </div>
                <button onClick={() => setUploadState(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={uploadState.format !== "unknown" ? "cyan" : "amber"}>
                  {formatLabels[uploadState.format]}
                </Badge>
                {uploadState.logs && !uploadState.error && (
                  <Badge variant="emerald">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {uploadState.logs.length} events parsed
                  </Badge>
                )}
              </div>

              {uploadState.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-xs text-cyber-red">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {uploadState.error}
                </div>
              )}

              {uploadState.preview.length > 0 && (
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 max-h-40 overflow-auto">
                  <p className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Preview</p>
                  {uploadState.preview.map((line, i) => (
                    <p key={i} className="text-[11px] font-mono text-slate-400 truncate leading-relaxed">{line}</p>
                  ))}
                </div>
              )}

              {uploadState.logs && uploadState.logs.length > 0 && !uploadState.error && (
                <Button variant="cyber" onClick={handleBeginAnalysis} className="w-full gap-2">
                  <Zap className="w-4 h-4" />
                  Begin Analysis ({uploadState.logs.length.toLocaleString()} events)
                </Button>
              )}

              {uploadState.parsing && (
                <div className="text-center text-xs text-cyber-cyan font-mono animate-pulse py-4">
                  Parsing file...
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Pipeline Overview */}
      <motion.div
        className="rounded-xl border border-slate-800 bg-surface/60 p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-cyber-cyan" />
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Investigation Pipeline
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {["Parse", "Baseline", "Detect", "Correlate", "Narrate"].map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex-1 text-center py-2.5 px-2 rounded-lg border border-slate-800 bg-background/60">
                <span className="text-[10px] font-mono text-cyber-cyan block font-bold">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs font-mono text-slate-300 font-medium">{step}</span>
              </div>
              {i < 4 && <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
