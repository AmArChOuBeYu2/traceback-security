import os
import sys
from generator.synthetic_generator import SyntheticLogGenerator
from generator.exporter import MultiFormatExporter


def generate_all_datasets():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    datasets_dir = os.path.join(base_dir, "datasets")

    # 1. Main Dataset (seed=42)
    print("Generating main benchmark dataset (seed=42, ~52,149 events)...")
    main_gen = SyntheticLogGenerator(seed=42, total_target_events=52149, dataset_name="benchmark_main")
    main_events, main_manifest = main_gen.generate()
    main_out_dir = os.path.join(datasets_dir, "benchmark_main")
    MultiFormatExporter.export_all(main_events, main_manifest, main_out_dir)
    print(f"Main dataset exported to {main_out_dir} ({len(main_events)} events)")

    # 2. Held-out Dataset (seed=1337)
    print("Generating held-out benchmark dataset (seed=1337, ~52,149 events)...")
    heldout_gen = SyntheticLogGenerator(seed=1337, total_target_events=52149, dataset_name="benchmark_heldout")
    heldout_events, heldout_manifest = heldout_gen.generate()
    heldout_out_dir = os.path.join(datasets_dir, "benchmark_heldout")
    MultiFormatExporter.export_all(heldout_events, heldout_manifest, heldout_out_dir)
    print(f"Held-out dataset exported to {heldout_out_dir} ({len(heldout_events)} events)")


if __name__ == "__main__":
    generate_all_datasets()
