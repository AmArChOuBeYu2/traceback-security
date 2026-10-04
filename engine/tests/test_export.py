import os
import json
import csv
import tempfile
from generator.synthetic_generator import SyntheticLogGenerator
from generator.exporter import MultiFormatExporter


def test_multiformat_export():
    gen = SyntheticLogGenerator(seed=42, total_target_events=500)
    events, manifest = gen.generate()

    with tempfile.TemporaryDirectory() as tmpdir:
        MultiFormatExporter.export_all(events, manifest, tmpdir)

        csv_path = os.path.join(tmpdir, "events.csv")
        jsonl_path = os.path.join(tmpdir, "events.jsonl")
        auth_log_path = os.path.join(tmpdir, "auth.log")
        gt_path = os.path.join(tmpdir, "ground_truth.json")

        assert os.path.exists(csv_path)
        assert os.path.exists(jsonl_path)
        assert os.path.exists(auth_log_path)
        assert os.path.exists(gt_path)

        # Verify CSV
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            rows = list(reader)
            assert len(rows) == manifest.total_events + 1  # header + total events

        # Verify JSONL
        with open(jsonl_path, "r", encoding="utf-8") as f:
            jsonl_lines = f.readlines()
            assert len(jsonl_lines) == manifest.total_events
            first_obj = json.loads(jsonl_lines[0])
            assert "id" in first_obj

        # Verify auth.log
        with open(auth_log_path, "r", encoding="utf-8") as f:
            log_lines = f.readlines()
            assert len(log_lines) == manifest.total_events

        # Verify ground_truth.json
        with open(gt_path, "r", encoding="utf-8") as f:
            gt_obj = json.load(f)
            assert gt_obj["total_events"] == manifest.total_events
            assert "event_labels" in gt_obj
