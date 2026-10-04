from generator.synthetic_generator import SyntheticLogGenerator


def test_generator_determinism():
    gen1 = SyntheticLogGenerator(seed=42, total_target_events=1000)
    events1, manifest1 = gen1.generate()

    gen2 = SyntheticLogGenerator(seed=42, total_target_events=1000)
    events2, manifest2 = gen2.generate()

    assert len(events1) == 1000
    assert len(events2) == 1000
    assert manifest1.total_events == manifest2.total_events
    assert events1[0].raw == events2[0].raw
    assert events1[100].id == events2[100].id


def test_attack_and_decoy_labels():
    gen = SyntheticLogGenerator(seed=42, total_target_events=2000)
    events, manifest = gen.generate()

    assert manifest.attack_events_count > 0
    assert manifest.decoy_events_count > 0
    assert manifest.benign_events_count > 0

    stages = {stage.stage_name for stage in manifest.attack_stages}
    expected_stages = {
        "1_password_spray",
        "2_successful_auth",
        "3_impossible_travel",
        "4_privilege_escalation",
        "5_data_exfiltration",
    }
    assert expected_stages.issubset(stages)

    decoys = {e.decoy_type for e in events if e.is_decoy}
    assert "forgotten_password" in decoys
    assert "noisy_scanner" in decoys
    assert "nightly_backup" in decoys
    assert "legitimate_vpn" in decoys


def test_heldout_dataset_variant():
    main_gen = SyntheticLogGenerator(seed=42, total_target_events=52149)
    main_events, main_manifest = main_gen.generate()

    heldout_gen = SyntheticLogGenerator(seed=1337, total_target_events=52149)
    heldout_events, heldout_manifest = heldout_gen.generate()

    main_ips = {e.src_ip for e in main_events if e.is_attack}
    heldout_ips = {e.src_ip for e in heldout_events if e.is_attack}

    # 1. Assert distinct IP and entity sets
    assert "198.51.100.42" in main_ips
    assert "203.0.113.199" in heldout_ips
    assert main_ips != heldout_ips

    # 2. Assert distinct attack event counts & decoy distribution
    assert main_manifest.attack_events_count != heldout_manifest.attack_events_count
    assert main_manifest.decoy_events_count != heldout_manifest.decoy_events_count

    # 3. Assert distinct stage event counts
    main_spray_count = next(s.event_count for s in main_manifest.attack_stages if s.stage_name == "1_password_spray")
    heldout_spray_count = next(s.event_count for s in heldout_manifest.attack_stages if s.stage_name == "1_password_spray")
    assert main_spray_count == 400
    assert heldout_spray_count == 120

