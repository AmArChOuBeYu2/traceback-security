import React from "react";
import { ShieldAlert } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-wider ${className}`}>
      <div className="relative flex items-center justify-center p-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan shadow-cyan-glow">
        <ShieldAlert className="w-5 h-5 text-cyber-cyan animate-pulse-slow" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-black tracking-widest text-slate-100 uppercase font-mono">
          TRACE<span className="text-cyber-cyan">BACK</span>
        </span>
        <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
          Evidence Engine
        </span>
      </div>
    </div>
  );
}
