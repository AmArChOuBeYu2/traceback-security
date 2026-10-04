import csv
import json
import os
from typing import List
from schemas.event_schema import UnifiedEvent
from schemas.ground_truth import GroundTruthManifest


class MultiFormatExporter:
    """
    Exports generated UnifiedEvent collections to CSV, JSONL, auth.log text,
    and Ground Truth JSON formats.
    """

    @staticmethod
    def export_all(events: List[UnifiedEvent], manifest: GroundTruthManifest, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)

        MultiFormatExporter.export_csv(events, os.path.join(output_dir, "events.csv"))
        MultiFormatExporter.export_jsonl(events, os.path.join(output_dir, "events.jsonl"))
        MultiFormatExporter.export_auth_log(events, os.path.join(output_dir, "auth.log"))
        MultiFormatExporter.export_ground_truth(manifest, os.path.join(output_dir, "ground_truth.json"))

    @staticmethod
    def export_csv(events: List[UnifiedEvent], filepath: str):
        if not events:
            return

        headers = ["id", "ts", "user", "src_ip", "host", "action", "outcome", "resource", "bytes_out", "country", "raw", "line_no"]
        with open(filepath, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            for evt in events:
                writer.writerow([
                    evt.id,
                    evt.ts,
                    evt.user or "",
                    evt.src_ip or "",
                    evt.host or "",
                    evt.action,
                    evt.outcome,
                    evt.resource or "",
                    evt.bytes_out,
                    evt.country or "",
                    evt.raw,
                    evt.line_no,
                ])

    @staticmethod
    def export_jsonl(events: List[UnifiedEvent], filepath: str):
        with open(filepath, mode="w", encoding="utf-8") as f:
            for evt in events:
                f.write(json.dumps(evt.model_dump()) + "\n")

    @staticmethod
    def export_auth_log(events: List[UnifiedEvent], filepath: str):
        with open(filepath, mode="w", encoding="utf-8") as f:
            for evt in events:
                f.write(f"Line {evt.line_no} [{evt.ts}] {evt.raw}\n")

    @staticmethod
    def export_ground_truth(manifest: GroundTruthManifest, filepath: str):
        with open(filepath, mode="w", encoding="utf-8") as f:
            json.dump(manifest.model_dump(), f, indent=2)
