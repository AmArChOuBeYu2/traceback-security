import type {
  HealthResponse,
  CorrelatedIncident,
  DetectionResponse,
  RawLogEntry,
  Scorecard,
} from "./types";

export type {
  HealthResponse,
  CorrelatedIncident,
  DetectionResponse,
  RawLogEntry,
  Scorecard,
};
export * from "./types";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000";

// ─── Demo fallback helpers ──────────────────────────────────────
let _demoIncident: CorrelatedIncident | null = null;
let _demoEngine: DetectionResponse | null = null;
let _demoLogs: { total_matched: number; logs: RawLogEntry[] } | null = null;

async function loadDemoIncident(): Promise<CorrelatedIncident> {
  const mode = typeof window !== "undefined" ? sessionStorage.getItem("traceback_mode") : "demo";
  const path = mode === "heldout" ? "/demo/heldout_incident.json" : "/demo/incident.json";
  try {
    const res = await fetch(path);
    return await res.json();
  } catch {
    if (_demoIncident) return _demoIncident;
    const res = await fetch("/demo/incident.json");
    _demoIncident = await res.json();
    return _demoIncident!;
  }
}

async function loadDemoEngine(): Promise<DetectionResponse> {
  if (_demoEngine) return _demoEngine;
  const res = await fetch("/demo/engine_response.json");
  _demoEngine = await res.json();
  return _demoEngine!;
}

async function loadDemoLogs(): Promise<{ total_matched: number; logs: RawLogEntry[] }> {
  if (_demoLogs) return _demoLogs;
  const res = await fetch("/demo/sample_logs.json");
  _demoLogs = await res.json();
  return _demoLogs!;
}

// ─── Backend connectivity ───────────────────────────────────────
let _backendAvailable: boolean | null = null;

export async function isBackendAvailable(): Promise<boolean> {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const res = await fetch(`${ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    _backendAvailable = res.ok;
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

export function resetBackendCache() {
  _backendAvailable = null;
}

// ─── Health ─────────────────────────────────────────────────────
export async function fetchEngineHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch {
    return { status: "demo", service: "TRACEBACK Engine (Demo Mode)" };
  }
}

// ─── Analyze Logs ───────────────────────────────────────────────
export async function analyzeLogs(
  rawLogs?: RawLogEntry[]
): Promise<CorrelatedIncident> {
  const live = await isBackendAvailable();
  if (live) {
    try {
      const body: Record<string, unknown> = {};
      if (rawLogs && rawLogs.length > 0) {
        body.raw_logs = rawLogs;
      } else {
        body.dataset_name = "benchmark_52k";
      }
      const res = await fetch(`${ENGINE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch {
      return loadDemoIncident();
    }
  }
  return loadDemoIncident();
}

// ─── Engine Detect & Correlate ──────────────────────────────────
export async function detectAndCorrelate(
  datasetType: string = "main"
): Promise<DetectionResponse> {
  const live = await isBackendAvailable();
  if (live) {
    try {
      const res = await fetch(`${ENGINE_URL}/api/engine/detect-and-correlate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_type: datasetType }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch {
      return loadDemoEngine();
    }
  }
  return loadDemoEngine();
}

// ─── Raw Logs ───────────────────────────────────────────────────
export async function fetchRawLogs(
  eventIds?: string[],
  limit: number = 50
): Promise<{ total_matched: number; logs: RawLogEntry[] }> {
  const live = await isBackendAvailable();
  if (live) {
    try {
      const params = new URLSearchParams();
      if (eventIds && eventIds.length > 0) {
        params.set("event_ids", eventIds.join(","));
      }
      params.set("limit", String(limit));
      const res = await fetch(`${ENGINE_URL}/api/logs/raw?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch {
      return loadDemoLogs();
    }
  }

  // Demo mode: filter by eventIds if provided
  const demo = await loadDemoLogs();
  if (eventIds && eventIds.length > 0) {
    const idSet = new Set(eventIds);
    const filtered = demo.logs.filter((l) => idSet.has(l.event_id));
    return { total_matched: filtered.length, logs: filtered.slice(0, limit) };
  }
  return { total_matched: demo.logs.length, logs: demo.logs.slice(0, limit) };
}

// ─── Scorecard ──────────────────────────────────────────────────
export async function fetchScorecard(): Promise<Scorecard | null> {
  const live = await isBackendAvailable();
  if (live) {
    try {
      const res = await fetch(`${ENGINE_URL}/api/scorecard`, { cache: "no-store" });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch {
      /* fall through */
    }
  }
  const demo = await loadDemoIncident();
  return demo.scorecard;
}
