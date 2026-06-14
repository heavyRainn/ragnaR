from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

SyncStatus = Literal["idle", "running", "success", "failed", "skipped"]


@dataclass
class SyncState:
    last_sync_started_at: datetime | None = None
    last_sync_finished_at: datetime | None = None
    last_sync_status: SyncStatus = "idle"
    last_sync_error: str | None = None
    last_successful_sync_at: datetime | None = None
    last_cmc_assets_count: int = 0
    last_snapshots_inserted: int = 0
    last_signals_refreshed: int = 0
    scheduler_running: bool = False
    last_sync_source: Literal["live", "mock"] | None = None

    def mark_started(self, source: Literal["live", "mock"]) -> None:
        self.last_sync_started_at = datetime.now(timezone.utc)
        self.last_sync_status = "running"
        self.last_sync_error = None
        self.last_sync_source = source

    def mark_success(
        self,
        *,
        snapshots_inserted: int,
        assets_count: int,
        signals_refreshed: int,
    ) -> None:
        now = datetime.now(timezone.utc)
        self.last_sync_finished_at = now
        self.last_sync_status = "success"
        self.last_sync_error = None
        self.last_successful_sync_at = now
        self.last_snapshots_inserted = snapshots_inserted
        self.last_cmc_assets_count = assets_count
        self.last_signals_refreshed = signals_refreshed

    def mark_failed(self, error: str) -> None:
        self.last_sync_finished_at = datetime.now(timezone.utc)
        self.last_sync_status = "failed"
        self.last_sync_error = error

    def mark_skipped(self, reason: str) -> None:
        self.last_sync_finished_at = datetime.now(timezone.utc)
        self.last_sync_status = "skipped"
        self.last_sync_error = reason

    def next_sync_in_seconds(self, interval: int) -> int:
        if self.last_sync_status == "running":
            return 0
        anchor = self.last_successful_sync_at or self.last_sync_finished_at
        if anchor is None:
            return interval
        elapsed = (datetime.now(timezone.utc) - anchor).total_seconds()
        return max(0, int(interval - elapsed))


sync_state = SyncState()
