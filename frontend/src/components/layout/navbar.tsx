"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, BarChart3, ShieldAlert, Play, Award, Menu, X } from "lucide-react";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isBackendAvailable } from "@/lib/api-client";

const navLinks = [
  { href: "/", label: "Home", icon: Shield },
  { href: "/overview", label: "Overview", icon: BarChart3 },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/replay", label: "Replay", icon: Play },
  { href: "/scorecard", label: "Scorecard", icon: Award },
];

export function Navbar() {
  const pathname = usePathname();
  const [engineStatus, setEngineStatus] = useState<"loading" | "ok" | "demo">("loading");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    isBackendAvailable().then((ok) => setEngineStatus(ok ? "ok" : "demo"));
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-background/90 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyber-cyan" />
            </div>
            <span className="font-mono font-bold text-sm tracking-wider text-slate-100">
              TRACEBACK
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all",
                    isActive
                      ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Status */}
          <div className="hidden md:flex items-center gap-3">
            {engineStatus === "demo" && (
              <Badge variant="amber" className="text-[10px] py-0.5">
                DEMO MODE
              </Badge>
            )}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-800 bg-surface/60">
              <span className="text-[10px] font-mono text-slate-500">ENGINE</span>
              <StatusIndicator
                status={engineStatus === "ok" ? "ok" : engineStatus === "demo" ? "idle" : "loading"}
                label={engineStatus === "ok" ? "LIVE" : engineStatus === "demo" ? "DEMO" : ""}
              />
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-slate-800 pt-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-mono",
                    isActive
                      ? "bg-cyber-cyan/10 text-cyber-cyan"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            {engineStatus === "demo" && (
              <div className="px-3 pt-2">
                <Badge variant="amber" className="text-[10px]">DEMO MODE</Badge>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
