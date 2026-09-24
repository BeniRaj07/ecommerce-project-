"""Plain dataclasses for rows, so the rest of the code never deals with raw tuples."""
from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo


@dataclass
class Reminder:
    id: int
    title: str
    next_due_at: datetime        # timezone-aware (UTC)
    timezone: str
    local_time: str
    recurrence: str
    anchor_day: int | None
    status: str
    task_id: int | None

    @property
    def local_due(self) -> datetime:
        return self.next_due_at.astimezone(ZoneInfo(self.timezone))

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Reminder":
        return cls(
            id=row["id"], title=row["title"], next_due_at=datetime.fromisoformat(row["next_due_at"]),
            timezone=row["timezone"], local_time=row["local_time"], recurrence=row["recurrence"],
            anchor_day=row["anchor_day"], status=row["status"], task_id=row["task_id"],
        )


@dataclass
class Task:
    id: int
    title: str
    description: str | None
    month: str
    due_date: str | None
    status: str
    series_id: int | None
    completed_at: str | None

    @property
    def recurring(self) -> bool:
        return self.series_id is not None

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Task":
        return cls(
            id=row["id"], title=row["title"], description=row["description"], month=row["month"],
            due_date=row["due_date"], status=row["status"], series_id=row["series_id"],
            completed_at=row["completed_at"],
        )


@dataclass
class Notification:
    id: int
    reminder_id: int
    title: str
    due_at: datetime
    fired_at: datetime

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Notification":
        return cls(
            id=row["id"], reminder_id=row["reminder_id"], title=row["title"],
            due_at=datetime.fromisoformat(row["due_at"]), fired_at=datetime.fromisoformat(row["fired_at"]),
        )
