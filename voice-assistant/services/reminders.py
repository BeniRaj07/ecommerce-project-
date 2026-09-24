"""Reminder storage and scheduling logic (SQLite).

* Times are entered as local wall-clock time in the user's timezone (default Asia/Kathmandu)
  and stored as UTC, together with the timezone name.
* Recurring reminders keep their wall-clock time: a "monthly on the 31st" reminder fires on the
  last day of shorter months and returns to the 31st afterwards (anchor_day).
* fire_due_reminders() is idempotent: a UNIQUE(reminder_id, due_at) constraint plus a
  compare-and-set update guarantee each occurrence is notified exactly once.
"""
from __future__ import annotations

import calendar
import difflib
import logging
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from config import settings
from database.db import get_connection
from database.models import Notification, Reminder

log = logging.getLogger(__name__)
RECURRENCES = ("none", "daily", "weekly", "monthly")
MAX_TITLE = 200


class ReminderError(ValueError):
    """Validation problem that should be shown to the user."""


def _utc_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def _now_iso() -> str:
    return _utc_iso(datetime.now(timezone.utc))


def to_local(d: date, t: time, tz_name: str) -> datetime:
    return datetime.combine(d, t).replace(tzinfo=ZoneInfo(tz_name))


def add_months(local_dt: datetime, months: int, anchor_day: int) -> datetime:
    month_index = local_dt.month - 1 + months
    year, month = local_dt.year + month_index // 12, month_index % 12 + 1
    day = min(anchor_day, calendar.monthrange(year, month)[1])
    return local_dt.replace(year=year, month=month, day=day)


def next_occurrence(local_dt: datetime, recurrence: str, anchor_day: int | None = None) -> datetime:
    """The occurrence after local_dt, computed in local wall-clock time."""
    tz = local_dt.tzinfo
    naive = local_dt.replace(tzinfo=None)
    if recurrence == "daily":
        nxt = naive + timedelta(days=1)
    elif recurrence == "weekly":
        nxt = naive + timedelta(weeks=1)
    elif recurrence == "monthly":
        nxt = add_months(naive, 1, anchor_day or local_dt.day)
    else:
        raise ReminderError(f"'{recurrence}' reminders do not repeat")
    return nxt.replace(tzinfo=tz)


def _validate(title: str, recurrence: str, tz_name: str) -> str:
    title = (title or "").strip()
    if not title:
        raise ReminderError("the reminder needs a title")
    if len(title) > MAX_TITLE:
        raise ReminderError(f"the reminder title is too long (max {MAX_TITLE} characters)")
    if recurrence not in RECURRENCES:
        raise ReminderError(f"recurrence must be one of {', '.join(RECURRENCES)}")
    try:
        ZoneInfo(tz_name)
    except Exception as e:  # noqa: BLE001
        raise ReminderError(f"unknown timezone '{tz_name}'") from e
    return title


def _first_future(local_dt: datetime, recurrence: str, anchor_day: int | None, now: datetime) -> datetime:
    """For recurring reminders whose start is in the past, roll forward to the next future occurrence."""
    while local_dt <= now and recurrence != "none":
        local_dt = next_occurrence(local_dt, recurrence, anchor_day)
    return local_dt


def create_reminder(title: str, local_date: date, local_time: time, recurrence: str = "none",
                    tz_name: str | None = None, task_id: int | None = None,
                    now: datetime | None = None) -> Reminder:
    tz_name = tz_name or settings.timezone
    title = _validate(title, recurrence, tz_name)
    now = now or datetime.now(timezone.utc)
    local_dt = to_local(local_date, local_time, tz_name)
    anchor = local_date.day if recurrence == "monthly" else None
    if recurrence == "none" and local_dt <= now:
        raise ReminderError("that time is already in the past")
    local_dt = _first_future(local_dt, recurrence, anchor, now)
    stamp = _now_iso()
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO reminders (title, next_due_at, timezone, local_time, recurrence, anchor_day, status, "
            "task_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)",
            (title, _utc_iso(local_dt), tz_name, local_time.strftime("%H:%M"), recurrence, anchor,
             task_id, stamp, stamp),
        )
        reminder_id = cur.lastrowid
    log.info("reminder_created", extra={"reminder_id": reminder_id, "recurrence": recurrence})
    saved = get_reminder(reminder_id)
    if saved is None:  # only confirm to the user once it is really in the database
        raise ReminderError("the reminder could not be saved")
    return saved


def get_reminder(reminder_id: int) -> Reminder | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM reminders WHERE id = ?", (reminder_id,)).fetchone()
    return Reminder.from_row(row) if row else None


def list_reminders(status: str | None = "active", on_local_date: date | None = None,
                   tz_name: str | None = None, limit: int = 100) -> list[Reminder]:
    query, params = "SELECT * FROM reminders", []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY next_due_at LIMIT ?"
    params.append(limit)
    with get_connection() as conn:
        items = [Reminder.from_row(r) for r in conn.execute(query, params).fetchall()]
    if on_local_date:
        tz = ZoneInfo(tz_name or settings.timezone)
        items = [r for r in items if r.next_due_at.astimezone(tz).date() == on_local_date]
    return items


def find_reminders(query: str, status: str | None = "active") -> list[Reminder]:
    """Fuzzy title search used when the user says e.g. 'delete my assignment reminder'."""
    q = (query or "").strip().lower()
    if not q:
        return []
    candidates = list_reminders(status=status, limit=500)
    exact = [r for r in candidates if q in r.title.lower() or r.title.lower() in q]
    if exact:
        return exact
    words = {w for w in q.split() if len(w) > 2}
    by_word = [r for r in candidates if words & {w for w in r.title.lower().split() if len(w) > 2}]
    if by_word:
        return by_word
    titles = {r.title.lower(): r for r in candidates}
    return [titles[t] for t in difflib.get_close_matches(q, titles.keys(), n=3, cutoff=0.6)]


def update_reminder(reminder_id: int, *, title: str | None = None, local_date: date | None = None,
                    local_time: time | None = None, recurrence: str | None = None,
                    now: datetime | None = None) -> Reminder:
    current = get_reminder(reminder_id)
    if current is None:
        raise ReminderError(f"reminder #{reminder_id} does not exist")
    new_title = _validate(title if title is not None else current.title,
                          recurrence or current.recurrence, current.timezone)
    new_recurrence = recurrence or current.recurrence
    local = current.local_due
    new_date = local_date or local.date()
    new_time = local_time or local.time().replace(second=0, microsecond=0)
    now = now or datetime.now(timezone.utc)
    local_dt = to_local(new_date, new_time, current.timezone)
    anchor = new_date.day if new_recurrence == "monthly" else None
    if new_recurrence == "none" and local_dt <= now:
        raise ReminderError("the new time is already in the past")
    local_dt = _first_future(local_dt, new_recurrence, anchor, now)
    with get_connection() as conn:
        conn.execute(
            "UPDATE reminders SET title=?, next_due_at=?, local_time=?, recurrence=?, anchor_day=?, "
            "status='active', updated_at=? WHERE id=?",
            (new_title, _utc_iso(local_dt), new_time.strftime("%H:%M"), new_recurrence, anchor, _now_iso(),
             reminder_id),
        )
    log.info("reminder_updated", extra={"reminder_id": reminder_id})
    return get_reminder(reminder_id)  # type: ignore[return-value]


def set_reminder_status(reminder_id: int, status: str) -> Reminder:
    if status not in ("active", "done", "cancelled"):
        raise ReminderError("status must be active, done or cancelled")
    with get_connection() as conn:
        cur = conn.execute("UPDATE reminders SET status=?, updated_at=? WHERE id=?",
                           (status, _now_iso(), reminder_id))
    if cur.rowcount == 0:
        raise ReminderError(f"reminder #{reminder_id} does not exist")
    return get_reminder(reminder_id)  # type: ignore[return-value]


def delete_reminder(reminder_id: int) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
    log.info("reminder_deleted", extra={"reminder_id": reminder_id, "deleted": cur.rowcount})
    return cur.rowcount > 0


def cancel_task_reminders(task_id: int) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE reminders SET status='cancelled', updated_at=? WHERE task_id=? AND status='active'",
                     (_now_iso(), task_id))


# ── scheduling ───────────────────────────────────────────────────────────────

def fire_due_reminders(now: datetime | None = None) -> list[Notification]:
    """Record a notification for every reminder that is due, then advance or close it.
    Safe to call repeatedly or concurrently: each occurrence produces exactly one notification."""
    now = now or datetime.now(timezone.utc)
    now_iso = _utc_iso(now)
    fired: list[Notification] = []
    with get_connection() as conn:
        due = [Reminder.from_row(r) for r in conn.execute(
            "SELECT * FROM reminders WHERE status='active' AND next_due_at <= ? ORDER BY next_due_at",
            (now_iso,)).fetchall()]
        for r in due:
            due_iso = _utc_iso(r.next_due_at)
            cur = conn.execute(
                "INSERT OR IGNORE INTO reminder_notifications (reminder_id, title, due_at, fired_at) "
                "VALUES (?, ?, ?, ?)", (r.id, r.title, due_iso, now_iso))
            if r.recurrence == "none":
                conn.execute("UPDATE reminders SET status='done', updated_at=? WHERE id=? AND next_due_at=?",
                             (now_iso, r.id, due_iso))
            else:
                # Skip occurrences missed while the app was closed: notify once, then jump to the future
                nxt = _first_future(r.local_due, r.recurrence, r.anchor_day, now)
                conn.execute("UPDATE reminders SET next_due_at=?, updated_at=? WHERE id=? AND next_due_at=?",
                             (_utc_iso(nxt), now_iso, r.id, due_iso))
            if cur.rowcount:
                row = conn.execute("SELECT * FROM reminder_notifications WHERE id = ?", (cur.lastrowid,)).fetchone()
                fired.append(Notification.from_row(row))
    for n in fired:
        log.info("reminder_fired", extra={"reminder_id": n.reminder_id, "due_at": n.due_at.isoformat()})
    return fired


def pop_unseen_notifications() -> list[Notification]:
    """Notifications not yet shown in the UI; marks them as seen (so each pops up once)."""
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM reminder_notifications WHERE seen = 0 ORDER BY due_at").fetchall()
        if rows:
            conn.execute(f"UPDATE reminder_notifications SET seen = 1 WHERE id IN ({','.join('?' * len(rows))})",
                         [r["id"] for r in rows])
    return [Notification.from_row(r) for r in rows]


def recent_notifications(limit: int = 10) -> list[Notification]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM reminder_notifications ORDER BY fired_at DESC, id DESC LIMIT ?",
                            (limit,)).fetchall()
    return [Notification.from_row(r) for r in rows]
