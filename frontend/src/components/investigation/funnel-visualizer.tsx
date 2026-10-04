"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layers, ShieldCheck, Zap, AlertTriangle, CheckCircle } from "lucide-react";

interface FunnelProps {
  rawCount: number;
  normalizedCount: number;
  alertsCount: number;
  incidentsCount: number;
  noiseReductionPct: number;
}

export function FunnelVisualizer({
  rawCount = 52149,
  normalizedCount = 52149,
  alertsCount = 4,
  incidentsCount = 1,
  noiseReductionPct = 99.99,
}: FunnelProps) {
  const steps = [
    { name: "Raw Security Logs", count: rawCount, color: "border-slate-700 bg-slate-900/60 text-slate-300", width: "w-full" },
    { name: "Schema Normalization & Baseline", count: normalizedCount, color: "border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan", width: "w-5/6" },
    { name: "Rule Detectors & Anomaly Engine", count: `${alertsCount} Alerts`, color: "border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber", width: "w-4/6" },
    { name: "Entity Graph Correlation", count: `${incidentsCount} Incident Story`, color: "border-cyber-red/50 bg-cyber-red/20 text-cyber-red font-bold shadow-red-glow", width: "w-3/6" },
  ];

  return (
    <div className="space-y-4 p-6 rounded-xl border border-slate-800 bg-surface/80 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyber-cyan" />
          <h3 className="text-base font-mono font-bold text-slate-100 uppercase tracking-wider">
            52,000 → 1 Noise Reduction Funnel
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-xs font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>{noiseReductionPct}% Noise Filtered</span>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2 py-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`${step.width} p-3.5 rounded-lg border ${step.color} flex items-center justify-between text-xs font-mono shadow-md transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center font-bold text-[10px]">
                {index + 1}
              </span>
              <span>{step.name}</span>
            </div>
            <span className="font-bold tracking-widest text-sm">
              {typeof step.count === "number" ? step.count.toLocaleString() : step.count}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
