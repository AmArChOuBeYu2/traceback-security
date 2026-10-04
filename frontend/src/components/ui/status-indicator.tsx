"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "ok" | "error" | "loading" | "idle";
  label?: string;
  className?: string;
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const isOk = status === "ok";
  const isErr = status === "error";
  const isLoad = status === "loading";

  return (
    <div className={cn("inline-flex items-center gap-2 font-mono text-xs", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {isOk && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-emerald opacity-75" />
        )}
        {isErr && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-red opacity-75" />
        )}
        {isLoad && (
          <span className="animate-spin absolute inline-flex h-full w-full rounded-full border-2 border-cyber-cyan border-t-transparent" />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2.5 w-2.5",
            isOk && "bg-cyber-emerald shadow-[0_0_8px_#02c39a]",
            isErr && "bg-cyber-red shadow-[0_0_8px_#ff0055]",
            isLoad && "bg-cyber-cyan shadow-[0_0_8px_#00f3ff]",
            status === "idle" && "bg-slate-600"
          )}
        />
      </span>
      {label && (
        <span
          className={cn(
            "tracking-wider uppercase font-semibold",
            isOk && "text-cyber-emerald",
            isErr && "text-cyber-red",
            isLoad && "text-cyber-cyan",
            status === "idle" && "text-slate-400"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
