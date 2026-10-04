import pandas as pd
import numpy as np
from typing import List, Dict, Any
from app.models.schemas import NormalizedLog


class BaselineEngine:
    """
    Computes statistical baselines for entity activities and highlights anomaly spikes.
    Calculates z-scores for event frequency and flags rare event types.
    """

    @staticmethod
    def calculate_baselines(logs: List[NormalizedLog]) -> Dict[str, Any]:
        if not logs:
            return {"anomaly_event_ids": []}

        df = pd.DataFrame([log.model_dump() for log in logs])

        # Group by source_ip and event_type frequency
        freq_df = df.groupby(["source_ip", "event_type"]).size().reset_index(name="count")
        
        # Calculate mean & std dev for event counts
        mean_count = np.mean(freq_df["count"])
        std_count = np.std(freq_df["count"]) if len(freq_df) > 1 else 1.0

        # Anomaly threshold: count > mean + 3 * std
        threshold = mean_count + (3.0 * std_count)
        anomalous_rows = freq_df[freq_df["count"] > threshold]

        # Collect event IDs corresponding to anomalous groups
        anom_ips = set(anomalous_rows["source_ip"].dropna())
        anom_events = df[df["source_ip"].isin(anom_ips)]["event_id"].tolist()

        return {
            "mean_frequency": float(mean_count),
            "std_frequency": float(std_count),
            "anomaly_threshold": float(threshold),
            "anom_ips": list(anom_ips),
            "anom_event_ids": anom_events,
        }
