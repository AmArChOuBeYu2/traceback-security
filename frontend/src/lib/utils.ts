import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatStage(raw: string): string {
  return raw
    .replace(/^\d+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function severityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL": return "text-cyber-red";
    case "HIGH": return "text-cyber-amber";
    case "MEDIUM": return "text-cyber-cyan";
    case "LOW": return "text-cyber-emerald";
    default: return "text-slate-400";
  }
}

export function severityBg(severity: string): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL": return "bg-cyber-red/10 border-cyber-red/30 text-cyber-red";
    case "HIGH": return "bg-cyber-amber/10 border-cyber-amber/30 text-cyber-amber";
    case "MEDIUM": return "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan";
    case "LOW": return "bg-cyber-emerald/10 border-cyber-emerald/30 text-cyber-emerald";
    default: return "bg-slate-800 border-slate-700 text-slate-400";
  }
}
