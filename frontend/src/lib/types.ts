// ─── Raw Log Types ───────────────────────────────────────────────
export interface RawLogEntry {
  event_id: string;
  timestamp: string;
  log_source: string;
  raw_text: string;
}

// ─── Narrative & Evidence ────────────────────────────────────────
export interface NarrativeClaim {
  claim_id: string;
  sentence: string;
  evidence_event_ids: string[];
  is_verified: boolean;
  mitre_stage: string;
}

export interface AttackReplayStep {
  step_number: number;
  title: string;
  mitre_technique: string;
  timestamp: string;
  source_entity: string;
  target_entity: string;
  action_summary: string;
  evidence_event_ids: string[];
}

// ─── Decoy / Cleared ────────────────────────────────────────────
export interface DecoySummary {
  event_id: string;
  timestamp: string;
  log_source: string;
  description: string;
  reason_cleared: string;
}

// ─── Scorecard ──────────────────────────────────────────────────
export interface Scorecard {
  total_raw_events: number;
  normalized_events: number;
  alerts_detected: number;
  incidents_correlated: number;
  decoys_cleared: number;
  noise_reduction_percentage: number;
  citation_accuracy_percentage: number;
  estimated_triage_minutes_saved: number;
}

// ─── Correlated Incident (from /api/analyze) ────────────────────
export interface CorrelatedIncident {
  incident_id: string;
  title: string;
  severity: string;
  confidence: number;
  start_time: string;
  end_time: string;
  attacker_ip: string;
  compromised_hosts: string[];
  compromised_users: string[];
  narrative: NarrativeClaim[];
  replay_steps: AttackReplayStep[];
  alert_ids: string[];
  evidence_event_ids: string[];
  cleared_decoys: DecoySummary[];
  scorecard: Scorecard;
}

// ─── Engine Detection Response (from /api/engine/detect-and-correlate) ─
export interface Finding {
  id: string;
  rule: string;
  rule_name: string;
  entity_type: string;
  entity: string;
  severity: string;
  stage: string;
  event_ids: string[];
  detail: string;
}

export interface ScoreBreakdown {
  base_severity_score: number;
  stage_multiplier: number;
  entity_boost: number;
  temporal_progression_bonus: number;
  final_score: number;
  explanation: string;
}

export interface IncidentTimeline {
  start_time: string;
  end_time: string;
  duration_seconds: number;
}

export interface Incident {
  id: string;
  title: string;
  score: number;
  score_breakdown: ScoreBreakdown;
  stages: string[];
  entities: string[];
  finding_ids: string[];
  findings: Finding[];
  narrative_json: Record<string, unknown> | null;
  verified_ratio: number;
  timeline: IncidentTimeline;
}

export interface ClearedActivity {
  id: string;
  rule_name: string;
  entity: string;
  what_looked_suspicious: string;
  why_cleared: string;
  event_ids: string[];
}

export interface EvaluationMetrics {
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
  time_to_detect_seconds: number;
}

export interface DetectionResponse {
  findings_count: number;
  incidents_count: number;
  findings: Finding[];
  incidents: Incident[];
  cleared_activities: ClearedActivity[];
  evaluation_metrics: EvaluationMetrics;
}

// ─── Health ─────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  service: string;
}

// ─── Pipeline State ─────────────────────────────────────────────
export type PipelineStage = "parse" | "baseline" | "detect" | "correlate" | "narrate";

export interface PipelineState {
  currentStage: PipelineStage;
  completedStages: PipelineStage[];
  progress: number; // 0-100
  error?: string;
}

// ─── Upload State ───────────────────────────────────────────────
export type FileFormat = "csv" | "json" | "jsonl" | "syslog" | "unknown";

export interface UploadState {
  fileName: string;
  fileSize: number;
  format: FileFormat;
  lineCount: number;
  previewLines: string[];
  parsing: boolean;
  error?: string;
}

// ─── App Mode ───────────────────────────────────────────────────
export type AppMode = "idle" | "demo" | "live" | "upload";
