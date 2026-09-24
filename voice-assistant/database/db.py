"""SQLite connection handling and automatic schema creation.

Timestamps are stored as ISO-8601 strings in UTC (e.g. 2026-09-25T02:15:00+00:00)
together with the IANA timezone the user meant, so they can always be shown back
in the user's local time without ambiguity.
"""
from __future__ import annotations

import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS task_series (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT,
    day_of_month  INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    start_month   TEXT    NOT NULL,                 -- YYYY-MM
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT,
    month         TEXT    NOT NULL,                 -- YYYY-MM the task belongs to
    due_date      TEXT,                             -- YYYY-MM-DD (optional)
    status        TEXT    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'deleted')),
    series_id     INTEGER REFERENCES task_series(id) ON DELETE SET NULL,
    created_at    TEXT    NOT NULL,
    completed_at  TEXT,
    UNIQUE (series_id, month)                       -- a recurring task appears once per month
);
CREATE INDEX IF NOT EXISTS idx_tasks_month ON tasks(month, status);

CREATE TABLE IF NOT EXISTS reminders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    next_due_at   TEXT    NOT NULL,                 -- UTC ISO-8601
    timezone      TEXT    NOT NULL,                 -- IANA name, e.g. Asia/Kathmandu
    local_time    TEXT    NOT NULL,                 -- HH:MM wall-clock time in that timezone
    recurrence    TEXT    NOT NULL DEFAULT 'none'
                  CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
    anchor_day    INTEGER,                          -- day of month for monthly reminders
    status        TEXT    NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'done', 'cancelled')),
    task_id       INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    created_at    TEXT    NOT NULL,
    updated_at    TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(status, next_due_at);

CREATE TABLE IF NOT EXISTS reminder_notifications (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id   INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    title         TEXT    NOT NULL,
    due_at        TEXT    NOT NULL,                 -- the occurrence that fired (UTC)
    fired_at      TEXT    NOT NULL,
    seen          INTEGER NOT NULL DEFAULT 0,
    UNIQUE (reminder_id, due_at)                    -- never notify the same occurrence twice
);

CREATE TABLE IF NOT EXISTS chat_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    role          TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
    content       TEXT    NOT NULL,
    channel       TEXT    NOT NULL DEFAULT 'chat',  -- chat | voice
    created_at    TEXT    NOT NULL
);
"""

_db_path: Path = settings.db_path
_init_lock = threading.Lock()


def set_db_path(path: str | Path) -> None:
    """Point the app at another database file (used by the tests)."""
    global _db_path
    _db_path = Path(path)


def get_db_path() -> Path:
    return _db_path


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Short-lived connection per operation: safe with Gradio's worker threads and the scheduler."""
    _db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_db_path, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with _init_lock, get_connection() as conn:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript(SCHEMA)
