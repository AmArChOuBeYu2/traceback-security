"use client";

import React, { useState, useEffect } from "react";
import { AttackReplayStep } from "@/lib/api-client";
import { Play, Pause, SkipBack, SkipForward, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface ReplayProps {
  steps: AttackReplayStep[];
}

export function AttackReplayGraph({ steps }: ReplayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const activeStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="space-y-6 p-6 rounded-xl border border-slate-800 bg-surface/80 backdrop-blur-md">
      {/* Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyber-red animate-pulse" />
            Animated Kill-Chain Attack Replay
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Step-by-step temporal reconstruction of adversary lateral movement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="cyber"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-2 font-mono"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Play Replay
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
            disabled={currentStepIndex === steps.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((st, idx) => {
          const isActive = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <div
              key={st.step_number}
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlaying(false);
              }}
              className={`p-3 rounded-lg border text-xs font-mono cursor-pointer transition-all space-y-1 ${
                isActive
                  ? "border-cyber-cyan bg-cyber-cyan/15 text-cyber-cyan shadow-cyan-glow font-bold"
                  : isPassed
                  ? "border-cyber-emerald/40 bg-cyber-emerald/5 text-cyber-emerald"
                  : "border-slate-800 bg-background/40 text-slate-500 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>STEP 0{st.step_number}</span>
                <Badge variant="outline" className="text-[9px]">
                  {st.mitre_technique}
                </Badge>
              </div>
              <div className="truncate font-semibold text-slate-200">{st.title}</div>
            </div>
          );
        })}
      </div>

      {/* Active Step Visual Canvas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep.step_number}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-lg border border-slate-800 bg-slate-950 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-cyber-red/20 text-cyber-red font-mono text-xs font-bold border border-cyber-red/40">
                PHASE {activeStep.step_number} OF {steps.length}
              </span>
              <h4 className="text-base font-bold text-slate-100 font-mono">
                {activeStep.title} ({activeStep.mitre_technique})
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              TIMESTAMP: {activeStep.timestamp}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-6 bg-background/60 rounded-lg border border-slate-800/80">
            {/* Source Entity Node */}
            <div className="flex flex-col items-center space-y-2 p-4 rounded-xl border border-cyber-amber/40 bg-cyber-amber/10 w-48 text-center shadow-amber-glow">
              <span className="text-[10px] font-mono uppercase text-cyber-amber font-bold">
                SOURCE ENTITY
              </span>
              <span className="font-mono text-sm font-bold text-slate-100">
                {activeStep.source_entity}
              </span>
            </div>

            {/* Connection Animated Arrow */}
            <div className="flex flex-col items-center space-y-1 text-cyber-cyan font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                {activeStep.action_summary}
              </span>
              <div className="flex items-center gap-1 text-cyber-cyan animate-pulse">
                <span>━━━━━━▶</span>
              </div>
            </div>

            {/* Target Entity Node */}
            <div className="flex flex-col items-center space-y-2 p-4 rounded-xl border border-cyber-red/40 bg-cyber-red/10 w-48 text-center shadow-red-glow">
              <span className="text-[10px] font-mono uppercase text-cyber-red font-bold">
                TARGET COMPROMISED
              </span>
              <span className="font-mono text-sm font-bold text-slate-100">
                {activeStep.target_entity}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
