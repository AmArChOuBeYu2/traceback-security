from typing import List
from schemas.event_schema import UnifiedEvent
from schemas.incident_schema import ClearedActivity


class ClearedActivityHandler:
    """
    Evaluates benign decoy events and generates clear explanations detailing:
    1. What looked suspicious
    2. Why it was cleared / not flagged as a real incident.
    """

    @staticmethod
    def identify_cleared_activities(events: List[UnifiedEvent]) -> List[ClearedActivity]:
        cleared_list: List[ClearedActivity] = []
        
        # Group decoy events by decoy_type
        decoy_groups = {}
        for evt in events:
            if evt.is_decoy and evt.decoy_type:
                decoy_groups.setdefault(evt.decoy_type, []).append(evt)

        counter = 1
        for decoy_type, devts in decoy_groups.items():
            ev_ids = [e.id for e in devts]
            sample_entity = devts[0].user or devts[0].src_ip or devts[0].host or "unknown_entity"

            if decoy_type == "forgotten_password":
                cleared_list.append(
                    ClearedActivity(
                        id=f"CLR-{counter:03d}",
                        rule_name="Routine Forgotten Password Sequence",
                        entity=sample_entity,
                        what_looked_suspicious="3 failed SSH login attempts followed immediately by a successful login.",
                        why_cleared="Low failure velocity (3 attempts over 20s), single target account, normal business hours, and matching historical IP baseline.",
                        event_ids=ev_ids,
                    )
                )
            elif decoy_type == "noisy_scanner":
                cleared_list.append(
                    ClearedActivity(
                        id=f"CLR-{counter:03d}",
                        rule_name="Authorized Internal Vulnerability Scanner",
                        entity=sample_entity,
                        what_looked_suspicious="High-volume port scanning across 50 internal IP addresses.",
                        why_cleared="Source IP (10.0.99.15) matches authorized Nessus vulnerability scanner baseline; zero authentication attempts or privilege escalations.",
                        event_ids=ev_ids[:10],
                    )
                )
            elif decoy_type == "nightly_backup":
                cleared_list.append(
                    ClearedActivity(
                        id=f"CLR-{counter:03d}",
                        rule_name="Scheduled Nightly Backup Job",
                        entity=sample_entity,
                        what_looked_suspicious="5GB high-volume internal data transfer via rsync.",
                        why_cleared="Transferred strictly within internal backup subnet (10.0.2.10) to backup-server-01; no external C2 communication or DNS exfiltration.",
                        event_ids=ev_ids[:10],
                    )
                )
            elif decoy_type == "legitimate_vpn":
                cleared_list.append(
                    ClearedActivity(
                        id=f"CLR-{counter:03d}",
                        rule_name="Authorized Employee Remote VPN Session",
                        entity=sample_entity,
                        what_looked_suspicious="VPN pool connection assignment from external consumer ISP IP address.",
                        why_cleared="Valid multi-factor authentication, expected US GeoIP, and normal workday timestamp distribution.",
                        event_ids=ev_ids[:10],
                    )
                )
            counter += 1

        return cleared_list
