"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressProps {
  value: number;
  variant?: "cyan" | "emerald" | "amber" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const variantClasses = {
  cyan: "bg-cyber-cyan shadow-cyan-glow",
  emerald: "bg-cyber-emerald shadow-emerald-glow",
  amber: "bg-cyber-amber shadow-amber-glow",
  red: "bg-cyber-red shadow-red-glow",
};

const sizeClasses = { sm: "h-1", md: "h-2", lg: "h-3" };

export function Progress({ value, variant = "cyan", size = "md", className, showLabel }: ProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-slate-800/80 overflow-hidden", sizeClasses[size])}>
        <motion.div
          className={cn("h-full rounded-full", variantClasses[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
