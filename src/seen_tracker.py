"""Seen Jobs Tracker & Deduplication Storage (Prevents duplicate alerts across hourly runs)."""

import json
from pathlib import Path
from typing import Set, List, Dict, Any


class SeenTracker:
    """Maintains a persistent set of already-seen and alerted job IDs."""

    def __init__(self, storage_path: str = "data/seen_jobs.json"):
        self.path = Path(storage_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.seen_ids: Set[str] = self._load()

    def _load(self) -> Set[str]:
        if self.path.exists():
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return set(data.get("seen_ids", []))
            except Exception:
                return set()
        return set()

    def save(self):
        try:
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump({"seen_ids": list(self.seen_ids)}, f, indent=2)
        except Exception as e:
            print(f"[Warning] Failed to save seen_jobs: {e}")

    def filter_unseen(self, jobs: List[Any]) -> List[Any]:
        """Returns ONLY new jobs that have not been emailed previously."""
        new_jobs = []
        for job in jobs:
            job_id = getattr(job, "id", None) or job.get("id") if isinstance(job, dict) else str(job)
            if job_id not in self.seen_ids:
                new_jobs.append(job)
        return new_jobs

    def mark_seen(self, jobs: List[Any]):
        """Marks a list of jobs as seen and persists to disk."""
        for job in jobs:
            job_id = getattr(job, "id", None) or job.get("id") if isinstance(job, dict) else str(job)
            if job_id:
                self.seen_ids.add(job_id)
        self.save()
