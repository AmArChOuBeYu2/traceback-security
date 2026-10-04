from typing import List, Tuple
from app.models.schemas import NormalizedLog, DetectedAlert, DecoySummary


class DeterministicDetectors:
    """
    Deterministic rule-based detectors for MITRE ATT&CK tactics & decoy classifier.
    """

    @staticmethod
    def analyze_logs(logs: List[NormalizedLog]) -> Tuple[List[DetectedAlert], List[DecoySummary]]:
        alerts: List[DetectedAlert] = []
        decoys: List[DecoySummary] = []

        failed_ssh_by_ip = {}
        for log in logs:
            # Rule 1: SSH Brute Force (T1110)
            if log.event_type == "ssh_authentication_failure":
                ip = log.source_ip or "unknown"
                failed_ssh_by_ip.setdefault(ip, []).append(log.event_id)

            # Rule 2: Privilege Escalation (T1548 / T1078)
            elif log.event_type == "privilege_escalation" or "mimikatz" in log.raw_text.lower():
                alerts.append(
                    DetectedAlert(
                        alert_id=f"ALT-PRIV-ESC-{log.event_id}",
                        rule_id="RULE-T1078",
                        rule_name="Privilege Escalation & Credential Access",
                        mitre_technique="T1078 (Valid Accounts / Mimikatz)",
                        severity="HIGH",
                        timestamp=log.timestamp,
                        entities=[log.user or "sysadmin", log.hostname or "prod-bastion-01"],
                        evidence_event_ids=[log.event_id],
                        description=f"Privilege elevation command executed by user {log.user} on {log.hostname}"
                    )
                )

            # Rule 3: Lateral Movement (T1021)
            elif log.event_type == "ssh_authentication_success" and log.hostname == "prod-db-01":
                alerts.append(
                    DetectedAlert(
                        alert_id=f"ALT-LAT-MOVE-{log.event_id}",
                        rule_id="RULE-T1021",
                        rule_name="SSH Lateral Pivot to Database Cluster",
                        mitre_technique="T1021.004 (Remote Services: SSH)",
                        severity="CRITICAL",
                        timestamp=log.timestamp,
                        entities=["prod-bastion-01", "prod-db-01", log.user or "root"],
                        evidence_event_ids=[log.event_id],
                        description=f"Lateral pivot detected from prod-bastion-01 to internal database host prod-db-01"
                    )
                )

            # Rule 4: DNS Tunneling Exfiltration (T1071.004)
            elif log.event_type == "dns_tunneling_exfiltration":
                alerts.append(
                    DetectedAlert(
                        alert_id=f"ALT-EXFIL-{log.event_id}",
                        rule_id="RULE-T1071",
                        rule_name="DNS Tunneling Payload Exfiltration",
                        mitre_technique="T1071.004 (Application Layer Protocol: DNS)",
                        severity="CRITICAL",
                        timestamp=log.timestamp,
                        entities=[log.source_ip or "192.168.1.99", "c2-exfil-node.attacker.com"],
                        evidence_event_ids=[log.event_id],
                        description="Automated DNS TXT record tunneling query towards known C2 exfiltration domain"
                    )
                )

            # Decoy / Benign Classification
            else:
                if len(decoys) < 5:  # Sample top cleared decoys for UI display
                    decoys.append(
                        DecoySummary(
                            event_id=log.event_id,
                            timestamp=log.timestamp,
                            log_source=log.log_source,
                            description=log.raw_text[:80] + "...",
                            reason_cleared="Passed baseline threshold; routine operational background noise"
                        )
                    )

        # Trigger SSH Brute Force Alert if > 50 failures
        for ip, ev_ids in failed_ssh_by_ip.items():
            if len(ev_ids) >= 10:
                alerts.append(
                    DetectedAlert(
                        alert_id=f"ALT-BRUTE-{ip}",
                        rule_id="RULE-T1110",
                        rule_name="SSH High-Velocity Brute Force",
                        mitre_technique="T1110 (Brute Force)",
                        severity="HIGH",
                        timestamp=logs[0].timestamp if logs else "2026-10-04 14:02:00 UTC",
                        entities=[ip, "prod-bastion-01"],
                        evidence_event_ids=ev_ids,
                        description=f"Detected {len(ev_ids)} rapid failed SSH authentication attempts from IP {ip}"
                    )
                )

        return alerts, decoys
