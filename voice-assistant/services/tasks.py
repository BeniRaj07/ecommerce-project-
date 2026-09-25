"""Monthly task manager (SQLite).

Tasks belong to a month (YYYY-MM). Recurring monthly tasks are stored once as a *series*;
ensure_recurring_for_month() materialises one task per month with INSERT OR IGNORE on
UNIQUE(series_id, month), so viewing a month any number of times never creates duplicates.
Deleted tasks are soft-deleted (status='deleted') so a recurring instance is not re-created.
"""
from __future__ import annotations

import calendar
import difflib
import logging
import re
from dataclasses import dataclass
from datetime import date, datetime, timezone

from config import settings
from database.db import get_connection
from database.models import Task

log = logging.getLogger(__name__)
MAX_TITLE = 200
_MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


class TaskError(ValueError):
    """Validation problem that should be shown to the user."""


def today_local() -> date:
    return datetime.now(settings.tz).date()


def month_key(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def validate_month(month: str | None) -> str:
    month = (month or "").strip() or month_key(today_local())
    if not _MONTH_RE.match(month):
        raise TaskError(f"'{month}' is not a valid month (expected YYYY-MM)")
    return month


def _clean_title(title: str) -> str:
    title = (title or "").strip()
    if not title:
        raise TaskError("the task needs a title")
    if len(title) > MAX_TITLE:
        raise TaskError(f"the task title is too long (max {MAX_TITLE} characters)")
    return title


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _due_in_month(month: str, day: int | None) -> str | None:
    if not day:
        return None
    y, m = map(int, month.split("-"))
    return date(y, m, min(day, calendar.monthrange(y, m)[1])).isoformat()


def get_task(task_id: int) -> Task | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ? AND status != 'deleted'", (task_id,)).fetchone()
    return Task.from_row(row) if row else None


def create_task(title: str, *, month: str | None = None, due_date: date | None = None,
                description: str | None = None, recurring_monthly: bool = False) -> Task:
    title = _clean_title(title)
    month = validate_month(month_key(due_date) if due_date else month)
    description = (description or "").strip() or None
    with get_connection() as conn:
        if recurring_monthly:
            cur = conn.execute(
                "INSERT INTO task_series (title, description, day_of_month, start_month, active, created_at) "
                "VALUES (?, ?, ?, ?, 1, ?)",
                (title, description, due_date.day if due_date else None, month, _now_iso()))
            series_id = cur.lastrowid
            cur = conn.execute(
                "INSERT INTO tasks (title, description, month, due_date, status, series_id, created_at) "
                "VALUES (?, ?, ?, ?, 'pending', ?, ?)",
                (title, description, month, _due_in_month(month, due_date.day if due_date else None),
                 series_id, _now_iso()))
        else:
            cur = conn.execute(
                "INSERT INTO tasks (title, description, month, due_date, status, created_at) "
                "VALUES (?, ?, ?, ?, 'pending', ?)",
                (title, description, month, due_date.isoformat() if due_date else None, _now_iso()))
        task_id = cur.lastrowid
    log.info("task_created", extra={"task_id": task_id, "recurring": recurring_monthly, "month": month})
    task = get_task(task_id)
    if task is None:
        raise TaskError("the task could not be saved")
    return task


def ensure_recurring_for_month(month: str) -> int:
    """Create this month's instance of every active recurring series (idempotent)."""
    month = validate_month(month)
    created = 0
    with get_connection() as conn:
        for s in conn.execute("SELECT * FROM task_series WHERE active = 1 AND start_month <= ?", (month,)).fetchall():
            cur = conn.execute(
                "INSERT OR IGNORE INTO tasks (title, description, month, due_date, status, series_id, created_at) "
                "VALUES (?, ?, ?, ?, 'pending', ?, ?)",
                (s["title"], s["description"], month, _due_in_month(month, s["day_of_month"]), s["id"], _now_iso()))
            created += cur.rowcount
    return created


def list_tasks(month: str | None = None, status: str | None = None) -> list[Task]:
    """status: None/'all', 'pending', 'completed' or 'overdue'."""
    month = validate_month(month)
    ensure_recurring_for_month(month)
    if status == "overdue":
        return [t for t in overdue_tasks() if t.month == month]
    query, params = "SELECT * FROM tasks WHERE month = ? AND status != 'deleted'", [month]
    if status in ("pending", "completed"):
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY status, COALESCE(due_date, '9999'), id"
    with get_connection() as conn:
        return [Task.from_row(r) for r in conn.execute(query, params).fetchall()]


def overdue_tasks(today: date | None = None) -> list[Task]:
    today = today or today_local()
    ensure_recurring_for_month(month_key(today))
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < ? "
                            "ORDER BY due_date", (today.isoformat(),)).fetchall()
    return [Task.from_row(r) for r in rows]


@dataclass
class Progress:
    month: str
    total: int
    completed: int
    pending: int
    overdue: int

    @property
    def percent(self) -> int:
        return round(100 * self.completed / self.total) if self.total else 0


def month_progress(month: str | None = None, today: date | None = None) -> Progress:
    month = validate_month(month)
    tasks = list_tasks(month)
    today = today or today_local()
    done = sum(t.status == "completed" for t in tasks)
    overdue = sum(t.status == "pending" and t.due_date is not None and t.due_date < today.isoformat() for t in tasks)
    return Progress(month=month, total=len(tasks), completed=done, pending=len(tasks) - done, overdue=overdue)


def find_tasks(query: str, month: str | None = None, status: str | None = "pending") -> list[Task]:
    q = (query or "").strip().lower()
    if not q:
        return []
    if month:
        candidates = list_tasks(month, status)
    else:
        sql, params = "SELECT * FROM tasks WHERE status != 'deleted'", []
        if status in ("pending", "completed"):
            sql += " AND status = ?"
            params.append(status)
        with get_connection() as conn:
            candidates = [Task.from_row(r) for r in conn.execute(sql + " ORDER BY month DESC, id", params)]
    exact = [t for t in candidates if q in t.title.lower() or t.title.lower() in q]
    if exact:
        return exact
    words = {w for w in q.split() if len(w) > 2}
    by_word = [t for t in candidates if words & {w for w in t.title.lower().split() if len(w) > 2}]
    if by_word:
        return by_word
    titles = {t.title.lower(): t for t in candidates}
    return [titles[x] for x in difflib.get_close_matches(q, titles.keys(), n=3, cutoff=0.6)]


def set_task_status(task_id: int, status: str) -> Task:
    if status not in ("pending", "completed"):
        raise TaskError("status must be pending or completed")
    with get_connection() as conn:
        cur = conn.execute("UPDATE tasks SET status=?, completed_at=? WHERE id=? AND status != 'deleted'",
                           (status, _now_iso() if status == "completed" else None, task_id))
    if cur.rowcount == 0:
        raise TaskError(f"task #{task_id} does not exist")
    if status == "completed":
        from services.reminders import cancel_task_reminders
        cancel_task_reminders(task_id)   # a finished task no longer needs its reminder
    log.info("task_status", extra={"task_id": task_id, "status": status})
    return get_task(task_id)  # type: ignore[return-value]


def complete_task(task_id: int) -> Task:
    return set_task_status(task_id, "completed")


def update_task(task_id: int, *, title: str | None = None, description: str | None = None,
                due_date: date | None = None) -> Task:
    task = get_task(task_id)
    if task is None:
        raise TaskError(f"task #{task_id} does not exist")
    new_title = _clean_title(title) if title is not None else task.title
    new_desc = (description.strip() or None) if description is not None else task.description
    new_due = due_date.isoformat() if due_date else task.due_date
    new_month = month_key(due_date) if due_date else task.month
    with get_connection() as conn:
        conn.execute("UPDATE tasks SET title=?, description=?, due_date=?, month=? WHERE id=?",
                     (new_title, new_desc, new_due, new_month, task_id))
    return get_task(task_id)  # type: ignore[return-value]


def delete_task(task_id: int) -> bool:
    """Soft delete; for a recurring task this also stops future months."""
    task = get_task(task_id)
    if task is None:
        return False
    with get_connection() as conn:
        conn.execute("UPDATE tasks SET status='deleted' WHERE id=?", (task_id,))
        if task.series_id:
            conn.execute("UPDATE task_series SET active=0 WHERE id=?", (task.series_id,))
    from services.reminders import cancel_task_reminders
    cancel_task_reminders(task_id)
    log.info("task_deleted", extra={"task_id": task_id, "recurring": task.recurring})
    return True


# ── daily briefing helpers ───────────────────────────────────────────────────

def tasks_due_on(day: date) -> list[Task]:
    """Pending tasks whose due date is `day`."""
    ensure_recurring_for_month(month_key(day))
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM tasks WHERE status = 'pending' AND due_date = ? ORDER BY id",
                            (day.isoformat(),)).fetchall()
    return [Task.from_row(r) for r in rows]


def tasks_completed_on(day: date, tz=None) -> list[Task]:
    """Tasks marked completed on `day` (in the user's local timezone)."""
    tz = tz or settings.tz
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM tasks WHERE status = 'completed' AND completed_at IS NOT NULL "
                            "ORDER BY completed_at").fetchall()
    return [Task.from_row(r) for r in rows
            if datetime.fromisoformat(r["completed_at"]).astimezone(tz).date() == day]
