import random
from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Dict
from schemas.event_schema import UnifiedEvent
from schemas.ground_truth import (
    GroundTruthManifest,
    GroundTruthLabel,
    AttackStageSummary,
)


class SyntheticLogGenerator:
    """
    Deterministic, seed-driven synthetic log generator for TRACEBACK.
    Generates multi-stage attack scenarios, intentional decoys, and background traffic.
    """

    def __init__(self, seed: int = 42, total_target_events: int = 52149, dataset_name: str = "benchmark_main"):
        self.seed = seed
        self.total_target_events = total_target_events
        self.dataset_name = dataset_name
        self.rng = random.Random(seed)

    def generate(self) -> Tuple[List[UnifiedEvent], GroundTruthManifest]:
        events: List[UnifiedEvent] = []
        labels: Dict[str, GroundTruthLabel] = {}
        attack_stages_summary: Dict[str, AttackStageSummary] = {}

        base_time = datetime(2026, 10, 4, 14, 0, 0, tzinfo=timezone.utc)
        current_line = 1

        # Configuration parameters driven by seed variant
        if self.seed == 42:
            # Main Dataset Attack Parameters
            attacker_ip = "198.51.100.42"
            attacker_country = "RU"
            victim_user = "sysadmin"
            target_host = "prod-bastion-01"
            db_host = "prod-db-01"
            scanner_ip = "10.0.99.15"

            # STAGE 1: Password Spray / Brute Force (400 Events)
            stage1_events: List[UnifiedEvent] = []
            for i in range(400):
                ts_str = (base_time + timedelta(seconds=i * 0.5)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                raw = f"sshd[4912]: Failed password for invalid user admin from {attacker_ip} port {50000 + i} ssh2"
                
                evt = UnifiedEvent(
                    id=evt_id, ts=ts_str, user="admin" if i % 2 == 0 else victim_user, src_ip=attacker_ip,
                    host=target_host, action="LOGIN", outcome="FAILURE", resource="ssh2", bytes_out=0,
                    country=attacker_country, raw=raw, line_no=current_line, is_attack=True,
                    attack_stage="1_password_spray", is_decoy=False,
                )
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="1_password_spray", is_decoy=False)
                stage1_events.append(evt)
                current_line += 1

            attack_stages_summary["1_password_spray"] = AttackStageSummary(
                stage_name="1_password_spray", mitre_id="T1110", event_count=len(stage1_events),
                first_event_id=stage1_events[0].id, last_event_id=stage1_events[-1].id,
                description=f"High-velocity password spray (400 attempts) from IP {attacker_ip}",
            )

            # STAGE 2: Successful Auth (1 Event)
            ts_str = (base_time + timedelta(seconds=210)).strftime("%Y-%m-%d %H:%M:%S UTC")
            evt_id = f"EVT-{current_line:06d}"
            raw = f"sshd[4915]: Accepted password for {victim_user} from {attacker_ip} port 50401 ssh2 on host {target_host}"
            evt = UnifiedEvent(
                id=evt_id, ts=ts_str, user=victim_user, src_ip=attacker_ip, host=target_host,
                action="LOGIN", outcome="SUCCESS", resource="ssh2", bytes_out=1420, country=attacker_country,
                raw=raw, line_no=current_line, is_attack=True, attack_stage="2_successful_auth", is_decoy=False,
            )
            events.append(evt)
            labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="2_successful_auth", is_decoy=False)
            current_line += 1
            attack_stages_summary["2_successful_auth"] = AttackStageSummary(
                stage_name="2_successful_auth", mitre_id="T1078", event_count=1, first_event_id=evt.id, last_event_id=evt.id,
                description=f"Successful authentication transition for {victim_user} from {attacker_ip}",
            )

            # STAGE 3: Impossible Travel (1 Event)
            ts_str = (base_time + timedelta(seconds=215)).strftime("%Y-%m-%d %H:%M:%S UTC")
            evt_id = f"EVT-{current_line:06d}"
            raw = f"geoip_alert: Impossible travel detected for user {victim_user} from {attacker_country} ({attacker_ip}) within 5 mins of US login"
            evt = UnifiedEvent(
                id=evt_id, ts=ts_str, user=victim_user, src_ip=attacker_ip, host=target_host,
                action="GEOIP_CHECK", outcome="ANOMALY", resource="vpn_session", bytes_out=0, country=attacker_country,
                raw=raw, line_no=current_line, is_attack=True, attack_stage="3_impossible_travel", is_decoy=False,
            )
            events.append(evt)
            labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="3_impossible_travel", is_decoy=False)
            current_line += 1
            attack_stages_summary["3_impossible_travel"] = AttackStageSummary(
                stage_name="3_impossible_travel", mitre_id="T1078.004", event_count=1, first_event_id=evt.id, last_event_id=evt.id,
                description=f"Geographical anomaly: Impossible travel login for {victim_user} originating from country {attacker_country}",
            )

            # STAGE 4: Privilege Escalation (2 Events)
            stage4_events: List[UnifiedEvent] = []
            for i, cmd in enumerate(["sudo /bin/bash", "mimikatz.exe securlsa::logonpasswords"]):
                ts_str = (base_time + timedelta(seconds=240 + (i * 10))).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                raw = f"sudo: {victim_user} : TTY=pts/0 ; PWD=/home/{victim_user} ; USER=root ; COMMAND={cmd}"
                evt = UnifiedEvent(
                    id=evt_id, ts=ts_str, user=victim_user, src_ip="127.0.0.1", host=target_host,
                    action="SUDO_EXECUTE", outcome="SUCCESS", resource=cmd.split()[0], bytes_out=0, country="US",
                    raw=raw, line_no=current_line, is_attack=True, attack_stage="4_privilege_escalation", is_decoy=False,
                )
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="4_privilege_escalation", is_decoy=False)
                stage4_events.append(evt)
                current_line += 1
            attack_stages_summary["4_privilege_escalation"] = AttackStageSummary(
                stage_name="4_privilege_escalation", mitre_id="T1548", event_count=len(stage4_events),
                first_event_id=stage4_events[0].id, last_event_id=stage4_events[-1].id,
                description=f"Privilege escalation via sudo elevation on host {target_host}",
            )

            # STAGE 5: Exfiltration (50 Events)
            stage5_events: List[UnifiedEvent] = []
            for i in range(50):
                ts_str = (base_time + timedelta(seconds=300 + (i * 2))).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                bytes_chunk = 10485760
                raw = f"dns_query client=192.168.1.99 query=chunk-{i:03d}.vault-exfil.attacker.com record_type=TXT response=NOERROR bytes={bytes_chunk}"
                evt = UnifiedEvent(
                    id=evt_id, ts=ts_str, user=victim_user, src_ip="192.168.1.99", host=db_host,
                    action="EXFILTRATE", outcome="SUCCESS", resource="vault-exfil.attacker.com", bytes_out=bytes_chunk,
                    country=attacker_country, raw=raw, line_no=current_line, is_attack=True, attack_stage="5_data_exfiltration", is_decoy=False,
                )
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="5_data_exfiltration", is_decoy=False)
                stage5_events.append(evt)
                current_line += 1
            attack_stages_summary["5_data_exfiltration"] = AttackStageSummary(
                stage_name="5_data_exfiltration", mitre_id="T1048", event_count=len(stage5_events),
                first_event_id=stage5_events[0].id, last_event_id=stage5_events[-1].id,
                description=f"Large outbound data exfiltration over DNS tunneling to C2 server",
            )

            # DECOY ACTIVITIES (354 Decoys for Seed 42)
            # Decoy 1: 4 events
            for i in range(4):
                ts_str = (base_time + timedelta(seconds=100 + i * 5)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                outcome = "FAILURE" if i < 3 else "SUCCESS"
                raw = f"sshd[3010]: {'Failed' if outcome == 'FAILURE' else 'Accepted'} password for alice from 10.0.1.55 port {41000 + i} ssh2"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user="alice", src_ip="10.0.1.55", host="workstation-alice", action="LOGIN", outcome=outcome, resource="ssh2", bytes_out=0 if outcome == "FAILURE" else 1200, country="US", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="forgotten_password")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="forgotten_password")
                current_line += 1

            # Decoy 2: 200 events
            for i in range(200):
                ts_str = (base_time + timedelta(seconds=50 + i)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                raw = f"firewall_alert DENY src={scanner_ip} dst=10.0.1.{i % 50} dst_port={80 + i} proto=TCP"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user=None, src_ip=scanner_ip, host=f"internal-host-{i % 50}", action="PORT_SCAN", outcome="DENIED", resource=f"port:{80 + i}", bytes_out=0, country="US", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="noisy_scanner")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="noisy_scanner")
                current_line += 1

            # Decoy 3: 100 events
            for i in range(100):
                ts_str = (base_time + timedelta(seconds=600 + i * 3)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                bytes_transferred = 52428800
                raw = f"backup_agent rsync host=backup-server-01 src=prod-db-01 bytes={bytes_transferred} status=COMPLETED"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user="backup_service", src_ip="10.0.2.10", host="backup-server-01", action="BACKUP_TRANSFER", outcome="SUCCESS", resource="prod-db-01.snap", bytes_out=bytes_transferred, country="US", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="nightly_backup")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="nightly_backup")
                current_line += 1

            # Decoy 4: 50 events
            for i in range(50):
                ts_str = (base_time + timedelta(seconds=150 + i * 10)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                raw = f"vpn_gateway ASSIGN_IP user=remote_employee_{i % 5} vpn_ip=10.8.0.{i + 1} src_ip=72.14.201.{i % 255} country=US"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user=f"remote_employee_{i % 5}", src_ip=f"72.14.201.{i % 255}", host="vpn-gateway-01", action="VPN_CONNECT", outcome="ALLOWED", resource="vpn_pool", bytes_out=4096, country="US", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="legitimate_vpn")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="legitimate_vpn")
                current_line += 1

        else:
            # ---------------------------------------------------------
            # HELD-OUT VARIANT (Seed 1337 or other seeds): Distinct Attack Pattern
            # ---------------------------------------------------------
            attacker_ip = "203.0.113.199"
            attacker_country = "CN"
            victim_user = "devops_lead"
            target_host = "app-gateway-02"
            db_host = "vault-cluster-01"
            scanner_ip = "10.0.99.88"

            # STAGE 1: Low-and-Slow Multi-Account Password Spray (120 Events)
            stage1_events: List[UnifiedEvent] = []
            target_accounts = ["service_acct", "jenkins_runner", "api_admin", "deploy_user", "devops_lead", "ci_bot"]
            for i in range(120):
                ts_str = (base_time + timedelta(seconds=i * 2.5)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                target_acct = target_accounts[i % len(target_accounts)]
                raw = f"sshd[8192]: Failed password for user {target_acct} from {attacker_ip} port {40000 + i} ssh2"
                
                evt = UnifiedEvent(
                    id=evt_id, ts=ts_str, user=target_acct, src_ip=attacker_ip, host=target_host,
                    action="LOGIN", outcome="FAILURE", resource="ssh2", bytes_out=0, country=attacker_country,
                    raw=raw, line_no=current_line, is_attack=True, attack_stage="1_password_spray", is_decoy=False,
                )
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="1_password_spray", is_decoy=False)
                stage1_events.append(evt)
                current_line += 1

            attack_stages_summary["1_password_spray"] = AttackStageSummary(
                stage_name="1_password_spray", mitre_id="T1110", event_count=len(stage1_events),
                first_event_id=stage1_events[0].id, last_event_id=stage1_events[-1].id,
                description=f"Low-and-slow multi-account password spray (120 attempts) from IP {attacker_ip}",
            )

            # STAGE 2: Successful Auth Transition (1 Event)
            ts_str = (base_time + timedelta(seconds=310)).strftime("%Y-%m-%d %H:%M:%S UTC")
            evt_id = f"EVT-{current_line:06d}"
            raw = f"sshd[8200]: Accepted publickey for {victim_user} from {attacker_ip} port 40121 ssh2 on host {target_host}"
            evt = UnifiedEvent(
                id=evt_id, ts=ts_str, user=victim_user, src_ip=attacker_ip, host=target_host,
                action="LOGIN", outcome="SUCCESS", resource="ssh2_publickey", bytes_out=2048, country=attacker_country,
                raw=raw, line_no=current_line, is_attack=True, attack_stage="2_successful_auth", is_decoy=False,
            )
            events.append(evt)
            labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="2_successful_auth", is_decoy=False)
            current_line += 1
            attack_stages_summary["2_successful_auth"] = AttackStageSummary(
                stage_name="2_successful_auth", mitre_id="T1078", event_count=1, first_event_id=evt.id, last_event_id=evt.id,
                description=f"Successful SSH key auth transition for {victim_user} from {attacker_ip}",
            )

            # STAGE 3: Impossible Travel Anomaly (1 Event)
            ts_str = (base_time + timedelta(seconds=325)).strftime("%Y-%m-%d %H:%M:%S UTC")
            evt_id = f"EVT-{current_line:06d}"
            raw = f"geoip_alert: Impossible travel detected for user {victim_user} from CN ({attacker_ip}) to DE (198.51.100.200) within 30s"
            evt = UnifiedEvent(
                id=evt_id, ts=ts_str, user=victim_user, src_ip=attacker_ip, host=target_host,
                action="GEOIP_CHECK", outcome="ANOMALY", resource="cloud_session", bytes_out=0, country=attacker_country,
                raw=raw, line_no=current_line, is_attack=True, attack_stage="3_impossible_travel", is_decoy=False,
            )
            events.append(evt)
            labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="3_impossible_travel", is_decoy=False)
            current_line += 1
            attack_stages_summary["3_impossible_travel"] = AttackStageSummary(
                stage_name="3_impossible_travel", mitre_id="T1078.004", event_count=1, first_event_id=evt.id, last_event_id=evt.id,
                description=f"Cloud login geographical anomaly from {attacker_country} for user {victim_user}",
            )

            # STAGE 4: Privilege Escalation (3 Events - systemctl, chmod, gpasswd)
            stage4_events: List[UnifiedEvent] = []
            for i, cmd in enumerate([
                "sudo /usr/bin/systemctl start mal_service",
                "sudo /bin/chmod +s /bin/bash",
                "gpasswd -a devops_lead wheel"
            ]):
                ts_str = (base_time + timedelta(seconds=350 + (i * 15))).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                raw = f"sudo: {victim_user} : TTY=pts/2 ; PWD=/etc/systemd ; USER=root ; COMMAND={cmd}"
                evt = UnifiedEvent(
                    id=evt_id, ts=ts_str, user=victim_user, src_ip="127.0.0.1", host=target_host,
                    action="SUDO_EXECUTE", outcome="SUCCESS", resource=cmd.split()[0], bytes_out=0, country="US",
                    raw=raw, line_no=current_line, is_attack=True, attack_stage="4_privilege_escalation", is_decoy=False,
                )
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="4_privilege_escalation", is_decoy=False)
                stage4_events.append(evt)
                current_line += 1
            attack_stages_summary["4_privilege_escalation"] = AttackStageSummary(
                stage_name="4_privilege_escalation", mitre_id="T1548", event_count=len(stage4_events),
                first_event_id=stage4_events[0].id, last_event_id=stage4_events[-1].id,
                description=f"Multi-command privilege escalation via systemctl & SUID set on host {target_host}",
            )

            # STAGE 5: Large Outbound Exfiltration (25 Events - 20MB chunks over HTTPS POST)
            stage5_events: List[UnifiedEvent] = []
            for i in range(25):
                ts_str = (base_time + timedelta(seconds=420 + (i * 4))).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                bytes_chunk = 20971520 # 20MB chunk
                raw = f"http_outbound src=10.0.4.15 dst=c2-vault-exfil.attacker.net method=POST bytes={bytes_chunk} path=/api/v2/stream status=200"
                evt = UnifiedEvent(
                    id=evt_id, ts=ts_str, user=victim_user, src_ip="10.0.4.15", host=db_host,
                    action="EXFILTRATE", outcome="SUCCESS", resource="c2-vault-exfil.attacker.net", bytes_out=bytes_chunk,
                    country=attacker_country, raw=raw, line_no=current_line, is_attack=True, attack_stage="5_data_exfiltration", is_decoy=False,
                )
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=True, attack_stage="5_data_exfiltration", is_decoy=False)
                stage5_events.append(evt)
                current_line += 1
            attack_stages_summary["5_data_exfiltration"] = AttackStageSummary(
                stage_name="5_data_exfiltration", mitre_id="T1048", event_count=len(stage5_events),
                first_event_id=stage5_events[0].id, last_event_id=stage5_events[-1].id,
                description=f"HTTPS POST secret exfiltration (500MB total) to external C2 endpoint",
            )

            # DECOY ACTIVITIES (587 Decoys for Held-Out Seed 1337)
            # Decoy 1: 7 events
            for i in range(7):
                ts_str = (base_time + timedelta(seconds=80 + i * 4)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                outcome = "FAILURE" if i < 6 else "SUCCESS"
                raw = f"sshd[4102]: {'Failed' if outcome == 'FAILURE' else 'Accepted'} password for charlie from 10.0.3.10 port {32000 + i} ssh2"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user="charlie", src_ip="10.0.3.10", host="workstation-charlie", action="LOGIN", outcome=outcome, resource="ssh2", bytes_out=0 if outcome == "FAILURE" else 1500, country="US", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="forgotten_password")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="forgotten_password")
                current_line += 1

            # Decoy 2: 350 events
            for i in range(350):
                ts_str = (base_time + timedelta(seconds=20 + i)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                raw = f"firewall_alert DENY src={scanner_ip} dst=10.0.2.{i % 100} dst_port={443 + i} proto=TCP"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user=None, src_ip=scanner_ip, host=f"cluster-node-{i % 100}", action="PORT_SCAN", outcome="DENIED", resource=f"port:{443 + i}", bytes_out=0, country="US", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="noisy_scanner")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="noisy_scanner")
                current_line += 1

            # Decoy 3: 150 events
            for i in range(150):
                ts_str = (base_time + timedelta(seconds=500 + i * 2)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                bytes_transferred = 104857600
                raw = f"backup_agent rsync host=storage-cluster-01 src=vault-cluster-01 bytes={bytes_transferred} status=COMPLETED"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user="backup_service", src_ip="10.0.4.20", host="storage-cluster-01", action="BACKUP_TRANSFER", outcome="SUCCESS", resource="vault-cluster-01.snap", bytes_out=bytes_transferred, country="US", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="nightly_backup")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="nightly_backup")
                current_line += 1

            # Decoy 4: 80 events
            for i in range(80):
                ts_str = (base_time + timedelta(seconds=120 + i * 8)).strftime("%Y-%m-%d %H:%M:%S UTC")
                evt_id = f"EVT-{current_line:06d}"
                raw = f"vpn_gateway ASSIGN_IP user=contractor_{i % 10} vpn_ip=10.9.0.{i + 1} src_ip=198.51.100.{i % 255} country=DE"
                evt = UnifiedEvent(id=evt_id, ts=ts_str, user=f"contractor_{i % 10}", src_ip=f"198.51.100.{i % 255}", host="vpn-gateway-02", action="VPN_CONNECT", outcome="ALLOWED", resource="vpn_pool", bytes_out=8192, country="DE", raw=raw, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="legitimate_vpn")
                events.append(evt)
                labels[evt_id] = GroundTruthLabel(event_id=evt_id, line_no=current_line, is_attack=False, is_decoy=True, decoy_type="legitimate_vpn")
                current_line += 1

        # ---------------------------------------------------------
        # BENIGN BACKGROUND NOISE (to reach target total event count ~52,149)
        # ---------------------------------------------------------
        remaining_needed = self.total_target_events - len(events)
        
        user_pool = ["developer_bob", "qa_charlie", "ops_diana", "api_service", "monitor_agent"]
        host_pool = ["web-node-01", "web-node-02", "api-gateway", "k8s-worker-01", "internal-proxy"]
        
        for i in range(remaining_needed):
            sec_offset = self.rng.randint(0, 1800)
            ts_str = (base_time + timedelta(seconds=sec_offset)).strftime("%Y-%m-%d %H:%M:%S UTC")
            evt_id = f"EVT-{current_line:06d}"
            
            u = self.rng.choice(user_pool)
            h = self.rng.choice(host_pool)
            ip = f"10.0.{self.rng.randint(1, 10)}.{self.rng.randint(1, 254)}"
            
            raw = f"10.0.1.{i % 255} - {u} [{ts_str}] \"GET /api/v1/resource/{i % 100} HTTP/1.1\" 200 142 border=0"
            
            evt = UnifiedEvent(
                id=evt_id,
                ts=ts_str,
                user=u,
                src_ip=ip,
                host=h,
                action="HTTP_GET",
                outcome="ALLOWED",
                resource=f"/api/v1/resource/{i % 100}",
                bytes_out=1420,
                country="US",
                raw=raw,
                line_no=current_line,
                is_attack=False,
                is_decoy=False,
            )
            events.append(evt)
            labels[evt_id] = GroundTruthLabel(
                event_id=evt_id,
                line_no=current_line,
                is_attack=False,
                is_decoy=False,
            )
            current_line += 1

        # Sort events deterministically by line_no
        events.sort(key=lambda x: x.line_no)

        attack_count = sum(1 for e in events if e.is_attack)
        decoy_count = sum(1 for e in events if e.is_decoy)
        benign_count = sum(1 for e in events if not e.is_attack and not e.is_decoy)

        manifest = GroundTruthManifest(
            dataset_name=self.dataset_name,
            generator_seed=self.seed,
            total_events=len(events),
            attack_events_count=attack_count,
            decoy_events_count=decoy_count,
            benign_events_count=benign_count,
            attack_stages=list(attack_stages_summary.values()),
            event_labels=labels,
        )

        return events, manifest
