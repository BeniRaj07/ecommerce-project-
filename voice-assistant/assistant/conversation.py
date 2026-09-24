"""The single assistant backend used by BOTH the text chat and the voice assistant.

respond(text, state) -> Reply
    1. classify the message (with conversation context and any pending follow-up question)
    2. merge a follow-up answer into the pending request ("tomorrow at eight")
    3. dispatch to the intent handler
    4. turn any failure into a friendly, bilingual message (never a stack trace)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

from assistant.handlers import HANDLERS
from assistant.intent_classifier import IntentResult, classify_intent, has_devanagari
from assistant.response_generator import Reply, t
from config import MissingAPIKeyError, settings
from database.db import get_connection
from services import reminders, tasks
from services.http import ServiceError

log = logging.getLogger(__name__)
MAX_INPUT_CHARS = 1000


@dataclass
class ConversationState:
    history: list[dict] = field(default_factory=list)   # [{"role": "user"|"assistant", "content": str}]
    pending: dict | None = None                          # follow-up we are waiting for
    last_city: str | None = None
    last_language: str = "en"


def _merge_pending(result: IntentResult, pending: dict) -> IntentResult:
    """Fill fields the follow-up didn't mention from the original request."""
    merged = dict(pending.get("fields", {}))
    merged.update(result.model_dump(mode="json", exclude_none=True, exclude={"clarification"}))
    merged["intent"] = pending["intent"]
    merged["language"] = result.language or merged.get("language", "en")
    return IntentResult.model_validate(merged)


def _context_lists() -> tuple[list[tuple[int, str]], list[tuple[int, str]]]:
    try:
        rems = [(r.id, r.title) for r in reminders.list_reminders(limit=30)]
        tsk = [(x.id, x.title) for x in tasks.list_tasks(None)][:30]
    except Exception:  # noqa: BLE001 - context is a nice-to-have
        log.warning("context_lists_failed", exc_info=True)
        rems, tsk = [], []
    return rems, tsk


def respond(text: str, state: ConversationState, now: datetime | None = None) -> Reply:
    text = (text or "").strip()[:MAX_INPUT_CHARS]
    lang_guess = "ne" if has_devanagari(text) else state.last_language
    if not text:
        return Reply(t("clarify", lang_guess), lang_guess, "clarify")
    now = (now or datetime.now(timezone.utc)).astimezone(settings.tz)

    try:
        rems, tsk = _context_lists()
        result = classify_intent(text, now=now, pending=state.pending, last_city=state.last_city,
                                 reminders=rems, tasks=tsk, history=state.history)
        pending = state.pending
        state.pending = None
        if pending and result.intent in (pending["intent"], "out_of_scope"):
            # e.g. "tomorrow at eight" after "What time should I remind you?"
            result = _merge_pending(result, pending)
        handler = HANDLERS.get(result.intent, HANDLERS["out_of_scope"])
        reply = handler(result, text, state, now)
    except MissingAPIKeyError as e:
        reply = Reply(t("missing_key", lang_guess, key=e.env_name), lang_guess, "error")
    except ServiceError as e:
        log.warning("service_error", extra={"service": e.service, "status": e.status})
        reply = Reply(t("service_error", lang_guess, service=e.service, reason=e.user_message), lang_guess, "error")
    except Exception:  # noqa: BLE001 - last line of defence for the UI
        log.exception("assistant_error")
        reply = Reply(t("internal_error", lang_guess), lang_guess, "error")

    return _remember(state, text, reply)


def run_intent(result: IntentResult, state: ConversationState | None = None,
               now: datetime | None = None) -> Reply:
    """Run a handler directly (used by the dashboard buttons) with the same error handling."""
    state = state or ConversationState()
    now = (now or datetime.now(timezone.utc)).astimezone(settings.tz)
    lang = result.language
    try:
        return HANDLERS[result.intent](result, "", state, now)
    except MissingAPIKeyError as e:
        return Reply(t("missing_key", lang, key=e.env_name), lang, "error")
    except ServiceError as e:
        return Reply(t("service_error", lang, service=e.service, reason=e.user_message), lang, "error")
    except Exception:  # noqa: BLE001
        log.exception("dashboard_error")
        return Reply(t("internal_error", lang), lang, "error")


def _remember(state: ConversationState, text: str, reply: Reply) -> Reply:
    state.last_language = reply.language
    state.history.append({"role": "user", "content": text})
    state.history.append({"role": "assistant", "content": reply.text})
    state.history = state.history[-40:]
    log.info("reply", extra={"intent": reply.intent, "language": reply.language})
    return reply


# ── persistent chat history (single local user) ─────────────────────────────

def save_history(role: str, content: str, channel: str = "chat") -> None:
    with get_connection() as conn:
        conn.execute("INSERT INTO chat_history (role, content, channel, created_at) VALUES (?, ?, ?, ?)",
                     (role, content, channel, datetime.now(timezone.utc).isoformat(timespec="seconds")))


def load_history(channel: str = "chat", limit: int = 40) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT role, content FROM chat_history WHERE channel = ? ORDER BY id DESC LIMIT ?",
                            (channel, limit)).fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


def clear_history(channel: str | None = None) -> None:
    with get_connection() as conn:
        if channel:
            conn.execute("DELETE FROM chat_history WHERE channel = ?", (channel,))
        else:
            conn.execute("DELETE FROM chat_history")
