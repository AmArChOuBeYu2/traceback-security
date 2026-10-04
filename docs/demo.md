# TRACEBACK Demonstration Guide 🎬

## Objective
Demonstrate how TRACEBACK transforms 50,000+ noisy raw security log lines into a single, evidence-locked attack chain story with interactive replay and receipt verification.

---

## Intended Walkthrough Steps

### Step 1: Landing & Log Ingestion (`/`)
1. Open TRACEBACK in the browser (`http://localhost:3000`).
2. Observe the tagline: *"50,000 log lines. One attacker. Every claim proven."*
3. Click **"Load 52k Sample Attack"** (or drag & drop a `.csv`, `.json`, `.jsonl`, or `auth.log` file into the upload dropzone).
4. Option: Click **"Held-Out Variant 2"** to test blind data evaluation.

### Step 2: Pipeline Visualizer (`/analysis`)
1. Watch the live 5-stage progress visualizer:
   `Ingestion Parsing → Baseline Calculation → Deterministic Detection → Incident Correlation → Evidence Narrative Generation`
2. Observe real-time log event ticker and streaming noise reduction metrics.

### Step 3: Incident Overview & Funnel (`/incidents`)
1. Inspect the top header metric cards:
   - Incident Severity: `CRITICAL`
   - Confidence: `99%`
   - Total Raw Events: `52,410`
   - Noise Reduction: `99.93%` (52,410 events compressed to 34 evidence events)
2. View the **52k→1 Noise Reduction Funnel**.
3. Inspect Key Entities:
   - Attacker IP: `198.51.100.42`
   - Compromised Users: `sysadmin`, `root`
   - Compromised Hosts: `prod-bastion-01`, `prod-db-01`

### Step 4: Central Demo Moment — Evidence Receipts (`/incidents`)
1. In the **Evidence-Locked Narrative** panel, click any sentence/claim (e.g., *"At 14:02:01 UTC, external threat actor IP 198.51.100.42 launched SSH brute force..."*).
2. Watch the **Evidence Log Line Viewer** immediately highlight the exact raw supporting log lines (`EV-10001` through `EV-10100`).
3. View line numbers, raw vs. normalized text, timestamp, and click **Copy Line** or **Copy JSON**.

### Step 5: Interactive Attack Replay (`/replay`)
1. Navigate to the **Attack Replay & Graph** view.
2. Click **Play** on the scrubber bar to animate the attack step-by-step across graph nodes (IP → Bastion → DB Cluster → DNS Exfil).

### Step 6: Cleared Decoys Audit (`/incidents`)
1. Expand the **"Cleared Decoys Panel"**.
2. Review rationale for why non-malicious background noise (cron jobs, routine health checks) was filtered out.

### Step 7: Scorecard Audit Modal (`/incidents`)
1. Click **"Verify Receipts"** in the top navigation bar.
2. Inspect the judge verification scorecard:
   - Evidence Linkage Accuracy: `100.0%`
   - Detector Precision: `100.0%`
   - Deterministic Rule Coverage: `6 / 6`
   - Zero Hallucination Score: `100%`
