import random
from typing import List
from app.models.schemas import RawLogEntry


def generate_benchmark_52k_dataset() -> List[RawLogEntry]:
    """
    Generates a benchmark dataset containing 52,149 log lines.
    Includes 52,000 benign background logs (routine web traffic, cron jobs, internal health pings)
    and an embedded 5-phase APT attack chain (149 critical attack events).
    """
    logs: List[RawLogEntry] = []
    
    # 1. Embedded Multi-Stage APT Attack Events (149 total critical events)
    attack_events = [
        # Phase 1: SSH Brute Force (Events EV-10001 to EV-10100)
        *[
            RawLogEntry(
                event_id=f"EV-100{i:03d}",
                timestamp=f"2026-10-04 14:02:{i % 60:02d}.{i * 10:03d} UTC",
                log_source="auth_syslog",
                raw_text=f"sshd[4912]: Failed password for invalid user admin from 198.51.100.42 port {50000 + i} ssh2"
            ) for i in range(1, 101)
        ],
        # Successful SSH Login
        RawLogEntry(
            event_id="EV-10101",
            timestamp="2026-10-04 14:03:15.102 UTC",
            log_source="auth_syslog",
            raw_text="sshd[4915]: Accepted password for sysadmin from 198.51.100.42 port 50101 ssh2 on host prod-bastion-01"
        ),

        # Phase 2: Privilege Escalation (Sudo elevation)
        RawLogEntry(
            event_id="EV-10102",
            timestamp="2026-10-04 14:04:02.441 UTC",
            log_source="auth_syslog",
            raw_text="sudo: sysadmin : TTY=pts/0 ; PWD=/home/sysadmin ; USER=root ; COMMAND=/bin/bash"
        ),
        RawLogEntry(
            event_id="EV-10103",
            timestamp="2026-10-04 14:04:12.890 UTC",
            log_source="edr",
            raw_text="process_creation host=prod-bastion-01 parent=/bin/bash process=/usr/bin/mimikatz cmd='mimikatz.exe securlsa::logonpasswords' pid=10492"
        ),

        # Phase 3: Pass-the-Hash / Lateral Movement to DB Cluster
        RawLogEntry(
            event_id="EV-10104",
            timestamp="2026-10-04 14:06:22.115 UTC",
            log_source="auth_syslog",
            raw_text="sshd[8812]: Accepted publickey for root from 192.168.1.45 (prod-bastion-01) port 42100 ssh2 on host prod-db-01"
        ),
        RawLogEntry(
            event_id="EV-10105",
            timestamp="2026-10-04 14:07:05.330 UTC",
            log_source="edr",
            raw_text="process_creation host=prod-db-01 parent=sshd process=/usr/bin/mysqldump cmd='mysqldump -u root --all-databases > /tmp/customer_vault.dump' pid=8890"
        ),

        # Phase 4: Staging Data
        RawLogEntry(
            event_id="EV-10106",
            timestamp="2026-10-04 14:08:11.901 UTC",
            log_source="edr",
            raw_text="file_creation host=prod-db-01 filepath=/tmp/customer_vault.dump size=419430400 sha256=a4f102c98b..."
        ),

        # Phase 5: DNS Exfiltration (Events EV-10107 to EV-10149)
        *[
            RawLogEntry(
                event_id=f"EV-101{i:02d}",
                timestamp=f"2026-10-04 14:10:{i % 60:02d}.{i * 15:03d} UTC",
                log_source="dns",
                raw_text=f"dns_query client=192.168.1.99 query=chunk-{i:03d}.a4f102c9.c2-exfil-node.attacker.com record_type=TXT response=NOERROR"
            ) for i in range(7, 50)
        ]
    ]

    # 2. Benign Background Logs (to reach total 52,149 events)
    benign_count = 52149 - len(attack_events)
    benign_sources = ["firewall", "web_nginx", "k8s_audit", "dns", "auth_syslog"]
    
    benign_logs: List[RawLogEntry] = []
    for i in range(1, benign_count + 1):
        src = benign_sources[i % len(benign_sources)]
        if src == "firewall":
            txt = f"firewall_action ALLOW src=10.0.{i % 255}.{i % 100} dst=10.0.1.50 dst_port=443 proto=TCP bytes=1420"
        elif src == "web_nginx":
            txt = f"10.0.{i % 255}.{i % 100} - - [04/Oct/2026:14:00:{i % 60:02d}] \"GET /api/v1/health HTTP/1.1\" 200 64"
        elif src == "k8s_audit":
            txt = f"k8s_event user=system:kube-scheduler verb=get resource=pods namespace=default status=200"
        elif src == "dns":
            txt = f"dns_query client=10.0.1.12 query=api.internal.service record_type=A response=10.0.1.20"
        else:
            txt = f"cron[1029]: (root) CMD (/usr/local/bin/check_disk_space.sh > /dev/null 2>&1)"

        benign_logs.append(
            RawLogEntry(
                event_id=f"EV-BG-{i:06d}",
                timestamp=f"2026-10-04 14:00:{i % 60:02d}.{i % 1000:03d} UTC",
                log_source=src,
                raw_text=txt
            )
        )

    # Combine and return
    logs.extend(attack_events)
    logs.extend(benign_logs)
    return logs


def generate_heldout_dataset() -> List[RawLogEntry]:
    """
    Generates a held-out secondary attack dataset (Variant 2).
    Includes Impossible Travel + New Geo authentication followed by API Credential Theft & Data Exfiltration.
    """
    logs: List[RawLogEntry] = []
    
    attack_events = [
        # Stage 1: Impossible Travel / New Geo login
        RawLogEntry(
            event_id="EV-HELD-001",
            timestamp="2026-10-04 15:00:10.000 UTC",
            log_source="auth_syslog",
            raw_text="sshd[9012]: Accepted password for secops_admin from 203.0.113.195 (country: RO) port 54321 ssh2 on host cloud-mgmt-01"
        ),
        # Stage 2: Failed password spray sequence from same IP
        *[
            RawLogEntry(
                event_id=f"EV-HELD-{i:03d}",
                timestamp=f"2026-10-04 15:01:{i % 60:02d}.000 UTC",
                log_source="auth_syslog",
                raw_text=f"sshd[9015]: Failed password for user user_{i} from 203.0.113.195 port {54000 + i} ssh2"
            ) for i in range(2, 25)
        ],
        # Stage 3: AWS IAM Key Creation
        RawLogEntry(
            event_id="EV-HELD-025",
            timestamp="2026-10-04 15:05:00.000 UTC",
            log_source="cloudtrail",
            raw_text="cloudtrail event=CreateAccessKey user=secops_admin src_ip=203.0.113.195 key_id=AKIAIOSFODNN7EXAMPLE status=Success"
        ),
        # Stage 4: S3 Bucket Exfiltration
        RawLogEntry(
            event_id="EV-HELD-026",
            timestamp="2026-10-04 15:08:30.000 UTC",
            log_source="cloudtrail",
            raw_text="cloudtrail event=GetObject bucket=company-financial-vault key=q3_reports.tar.gz bytes_sent=8589934592 src_ip=203.0.113.195 status=Success"
        ),
    ]

    benign_count = 10000
    benign_logs = [
        RawLogEntry(
            event_id=f"EV-HELD-BG-{i:05d}",
            timestamp=f"2026-10-04 15:00:{i % 60:02d}.000 UTC",
            log_source="firewall",
            raw_text=f"firewall_action ALLOW src=10.0.0.{i % 250} dst=10.0.1.1 dst_port=80 proto=TCP"
        ) for i in range(1, benign_count + 1)
    ]

    logs.extend(attack_events)
    logs.extend(benign_logs)
    return logs

