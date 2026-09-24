"""Awaaz AI — Bilingual AI Voice and Chat Assistant (Nepali / English).

Run:  python app.py      then open http://127.0.0.1:7860
"""
from __future__ import annotations

import base64
import logging
import time as _time
from datetime import date, datetime, timedelta

import gradio as gr
import pandas as pd

from assistant.conversation import (ConversationState, clear_history, load_history, respond, run_intent,
                                    save_history)
from assistant.intent_classifier import IntentResult
from assistant.response_generator import fmt_datetime, fmt_month
from config import settings, setup_logging
from database.db import init_db
from scheduler.reminder_scheduler import start_scheduler
from services import football, reminders, tasks
from services.reminders import ReminderError
from services.speech_to_text import STTError, transcribe
from services.tasks import TaskError
from services.text_to_speech import TTSError, notification_sound, synthesize

log = logging.getLogger("app")

LANG_CHOICES = {"English": "en", "नेपाली (Nepali)": "ne"}
VOICE_HINTS = {"Auto-detect": None, "English": "en", "नेपाली (Nepali)": "ne"}
RECURRENCE_CHOICES = {"One time": "none", "Daily": "daily", "Weekly": "weekly", "Monthly": "monthly"}
LEAGUE_CHOICES = [(football.league_name(c), c) for c in football.LEAGUES]
NOT_RUNNING_NOTE = ("ℹ️ Reminders are checked every few seconds **while this app is running** and pop up here. "
                    "They cannot notify you when the app is closed — that would need an always-on deployed "
                    "scheduler and a delivery channel such as e-mail. Anything that fell due while the app was "
                    "closed is shown once when it starts again.")


# ── small helpers ────────────────────────────────────────────────────────────

def today() -> date:
    return datetime.now(settings.tz).date()


def month_choices() -> list[tuple[str, str]]:
    d = today().replace(day=1)
    out = []
    for offset in range(-6, 7):
        idx = d.month - 1 + offset
        key = f"{d.year + idx // 12:04d}-{idx % 12 + 1:02d}"
        out.append((fmt_month(key), key))
    return out


def parse_date(value: str | None, *, required: bool) -> date | None:
    value = (value or "").strip()
    if not value:
        if required:
            raise ValueError("Please enter a date (YYYY-MM-DD).")
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as e:
        raise ValueError(f"'{value}' is not a valid date — use YYYY-MM-DD, e.g. {today().isoformat()}.") from e


def parse_time(value: str | None, *, required: bool):
    value = (value or "").strip()
    if not value:
        if required:
            raise ValueError("Please enter a time (HH:MM, 24-hour).")
        return None
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError as e:
        raise ValueError(f"'{value}' is not a valid time — use 24-hour HH:MM, e.g. 20:30.") from e


def ok(msg: str) -> str:
    return f"✅ {msg}"


def err(msg: str) -> str:
    return f"⚠️ {msg}"


# ── dashboard data ───────────────────────────────────────────────────────────

def _task_df(items) -> pd.DataFrame:
    return pd.DataFrame(
        [[x.id, x.title, x.due_date or "—", "🔁 monthly" if x.recurring else "", x.description or ""] for x in items],
        columns=["ID", "Task", "Due", "Repeats", "Notes"])


def dashboard(month: str | None):
    month = month or tasks.month_key(today())
    rems = reminders.list_reminders()
    rem_df = pd.DataFrame(
        [[r.id, r.title, fmt_datetime(r.local_due), r.recurrence, "🔗 task" if r.task_id else ""] for r in rems],
        columns=["ID", "Reminder", "Next due", "Repeats", "Linked"])
    rem_dd = gr.update(choices=[(f"#{r.id} · {r.title} · {fmt_datetime(r.local_due)}", r.id) for r in rems], value=None)

    notes = reminders.recent_notifications(8)
    notif_md = "\n".join(f"- 🔔 **{n.title}** — due {fmt_datetime(n.due_at.astimezone(settings.tz))}" for n in notes) \
        or "_No reminders have fired yet._"

    prog = tasks.month_progress(month, today())
    items = tasks.list_tasks(month)
    pending = [x for x in items if x.status == "pending"]
    done = [x for x in items if x.status == "completed"]
    overdue = tasks.overdue_tasks(today())
    progress_html = f"""
    <div class="progress-card">
      <div class="progress-top"><b>{fmt_month(month)}</b>
        <span>{prog.completed} of {prog.total} completed · {prog.pending} pending · {prog.overdue} overdue</span></div>
      <div class="bar"><div style="width:{prog.percent}%"></div></div>
      <div class="pct">{prog.percent}%</div>
    </div>"""
    task_options = {x.id: x for x in items + overdue}
    task_dd = gr.update(choices=[(f"#{x.id} · {x.title} · {x.status} · {fmt_month(x.month)}", x.id)
                                 for x in task_options.values()], value=None)
    return rem_df, rem_dd, notif_md, progress_html, _task_df(pending), _task_df(done), _task_df(overdue), task_dd


# ── reminder actions ─────────────────────────────────────────────────────────

def add_reminder(title, d, tm, rec_label, month):
    try:
        r = reminders.create_reminder(title, parse_date(d, required=True), parse_time(tm, required=True),
                                      RECURRENCE_CHOICES.get(rec_label, "none"))
        msg = ok(f"Reminder saved: **{r.title}** — {fmt_datetime(r.local_due)}")
    except (ValueError, ReminderError) as e:
        msg = err(str(e))
    return (msg, *dashboard(month))


def edit_reminder(rid, new_title, d, tm, rec_label, month):
    if not rid:
        return (err("Select a reminder first."), *dashboard(month))
    try:
        r = reminders.update_reminder(int(rid), title=(new_title or "").strip() or None,
                                      local_date=parse_date(d, required=False), local_time=parse_time(tm, required=False),
                                      recurrence=RECURRENCE_CHOICES.get(rec_label) if rec_label else None)
        msg = ok(f"Updated: **{r.title}** — {fmt_datetime(r.local_due)}")
    except (ValueError, ReminderError) as e:
        msg = err(str(e))
    return (msg, *dashboard(month))


def reminder_status(rid, status, month):
    if not rid:
        return (err("Select a reminder first."), *dashboard(month))
    try:
        if status == "deleted":
            r = reminders.get_reminder(int(rid))
            reminders.delete_reminder(int(rid))
            msg = ok(f"Deleted **{r.title if r else rid}**.")
        else:
            r = reminders.set_reminder_status(int(rid), status)
            msg = ok(f"**{r.title}** marked as {status}.")
    except ReminderError as e:
        msg = err(str(e))
    return (msg, *dashboard(month))


# ── task actions ─────────────────────────────────────────────────────────────

def add_task(title, desc, due, recurring, remind_time, month):
    try:
        due_date = parse_date(due, required=False)
        rtime = parse_time(remind_time, required=False)
        task = tasks.create_task(title, month=month, due_date=due_date, description=desc,
                                 recurring_monthly=bool(recurring))
        msg = f"Added **{task.title}** to {fmt_month(task.month)}"
        if rtime:
            r = reminders.create_reminder(task.title, due_date or today(), rtime,
                                          "monthly" if recurring else "none", task_id=task.id)
            msg += f" with a reminder on {fmt_datetime(r.local_due)}"
        msg = ok(msg + ".")
        month = task.month
    except (ValueError, TaskError, ReminderError) as e:
        msg = err(str(e))
    return (msg, gr.update(value=month), *dashboard(month))


def task_action(tid, action, new_title, new_due, month):
    if not tid:
        return (err("Select a task first."), *dashboard(month))
    tid = int(tid)
    try:
        if action == "complete":
            x = tasks.complete_task(tid)
            msg = ok(f"🎉 **{x.title}** completed.")
        elif action == "reopen":
            x = tasks.set_task_status(tid, "pending")
            msg = ok(f"**{x.title}** is pending again.")
        elif action == "delete":
            x = tasks.get_task(tid)
            tasks.delete_task(tid)
            msg = ok(f"Deleted **{x.title if x else tid}**" + (" and stopped it repeating." if x and x.recurring else "."))
        else:
            x = tasks.update_task(tid, title=(new_title or "").strip() or None,
                                  due_date=parse_date(new_due, required=False))
            msg = ok(f"Updated **{x.title}**.")
    except (ValueError, TaskError) as e:
        msg = err(str(e))
    return (msg, *dashboard(month))


# ── due-reminder polling ─────────────────────────────────────────────────────

_CHIME_B64: str | None = None


def _chime_tag() -> str:
    global _CHIME_B64
    if _CHIME_B64 is None:
        _CHIME_B64 = base64.b64encode(notification_sound().read_bytes()).decode()
    # a fresh id each time so the browser re-plays it
    return f'<audio id="chime{int(_time.time())}" autoplay src="data:audio/wav;base64,{_CHIME_B64}"></audio>'


def poll_notifications(sound_on: bool, month: str):
    fired = reminders.pop_unseen_notifications()
    if not fired:
        return (gr.skip(),) * 9
    items = "".join(f"<li><b>{n.title}</b> <span>due {fmt_datetime(n.due_at.astimezone(settings.tz))}</span></li>"
                    for n in fired)
    banner = f'<div class="due-banner">🔔 <b>Reminder{"s" if len(fired) > 1 else ""} due</b><ul>{items}</ul></div>'
    if sound_on:
        banner += _chime_tag()
    return (banner, *dashboard(month))


# ── chat ─────────────────────────────────────────────────────────────────────

def chat_send(text: str, chat: list, state: ConversationState):
    text = (text or "").strip()
    if not text:
        yield chat, "", state, gr.skip()
        return
    chat = list(chat or []) + [{"role": "user", "content": text}, {"role": "assistant", "content": "⏳ …"}]
    yield chat, "", state, gr.skip()
    reply = respond(text, state)
    save_history("user", text, "chat")
    save_history("assistant", reply.text, "chat")
    chat[-1] = {"role": "assistant", "content": reply.text}
    yield chat, "", state, {"text": reply.spoken, "language": reply.language}


def listen_last(last: dict | None):
    if not last:
        return None, "_Nothing to read yet — send a message first._"
    try:
        return str(synthesize(last["text"], last["language"])), ""
    except TTSError as e:
        return None, f"🔇 {e.user_message}"


def clear_chat():
    clear_history()
    return [], ConversationState(), None, [], None, ""


# ── voice ────────────────────────────────────────────────────────────────────

def voice_ask(audio_path, hint_label, state: ConversationState, vhist: list):
    vhist = list(vhist or [])
    yield "", "", None, vhist, "🎧 Transcribing…", state
    try:
        tr = transcribe(audio_path, VOICE_HINTS.get(hint_label))
    except STTError as e:
        yield "", "", None, vhist, f"⚠️ {e.user_message}", state
        return
    yield tr.text, "", None, vhist, "🤔 Thinking…", state
    reply = respond(tr.text, state)
    yield tr.text, reply.text, None, vhist, "🔊 Generating the spoken reply…", state
    status = ""
    audio_out = None
    try:
        audio_out = str(synthesize(reply.spoken, reply.language))
    except TTSError as e:
        status = f"🔇 {e.user_message}. The text reply is shown above."
    vhist += [{"role": "user", "content": f"🎙️ {tr.text}"}, {"role": "assistant", "content": reply.text}]
    save_history("user", tr.text, "voice")
    save_history("assistant", reply.text, "voice")
    yield tr.text, reply.text, audio_out, vhist, status, state


# ── football & weather tab ───────────────────────────────────────────────────

def football_action(kind: str, league_code: str, team: str, lang_label: str) -> str:
    result = IntentResult(intent=kind, league=league_code, team=(team or "").strip() or None,
                          language=LANG_CHOICES.get(lang_label, "en"))
    return run_intent(result).text


def weather_action(city: str, when: str, lang_label: str, state: ConversationState) -> str:
    offset = {"Now": 0, "Tomorrow": 1, "In 2 days": 2}.get(when, 0)
    result = IntentResult(intent="weather", city=(city or "").strip() or None,
                          language=LANG_CHOICES.get(lang_label, "en"),
                          date=today() + timedelta(days=offset) if offset else None,
                          weather_when="forecast" if offset else "current")
    return run_intent(result, state).text


def on_load(month):
    chat = load_history("chat")
    voice = load_history("voice")
    state = ConversationState(history=list(chat[-10:]))
    return (chat, voice, state, *dashboard(month))


# ── layout ───────────────────────────────────────────────────────────────────

CSS = """
.app-header { display:flex; align-items:center; gap:16px; padding:18px 22px; border-radius:16px; margin-bottom:6px;
  background: linear-gradient(120deg, #4c1d95, #1e40af 60%, #0e7490); color:#fff; }
.app-header h1 { margin:0; font-size:1.7rem; color:#fff !important; }
.app-header p { margin:2px 0 0; color:#e0e7ff !important; }
.app-header .logo { font-size:2.4rem; }
.due-banner { background:#fef3c7; color:#78350f; border:1px solid #f59e0b; border-radius:12px; padding:10px 16px;
  animation: pop .4s ease; }
.due-banner ul { margin:4px 0 0 18px; } .due-banner span { opacity:.8; font-size:.9em; }
@keyframes pop { from { transform: scale(.97); opacity:.3 } to { transform: scale(1); opacity:1 } }
.progress-card { border:1px solid var(--border-color-primary); border-radius:12px; padding:12px 14px; }
.progress-top { display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; font-size:.95rem; }
.bar { height:12px; background:var(--neutral-200); border-radius:99px; overflow:hidden; margin-top:8px; }
.bar > div { height:100%; background:linear-gradient(90deg,#7c3aed,#06b6d4); border-radius:99px; transition:width .4s; }
.pct { text-align:right; font-weight:700; margin-top:4px; }
.note { font-size:.88rem; opacity:.85; }
footer { display:none !important; }
"""

HEADER = """
<div class="app-header">
  <div class="logo">🎙️</div>
  <div>
    <h1>Awaaz AI</h1>
    <p>Bilingual (नेपाली / English) voice &amp; chat assistant for reminders, monthly tasks, weather and football</p>
  </div>
</div>
"""

CHAT_EXAMPLES = [
    "नमस्ते! तपाईंलाई कस्तो छ?",
    "Remind me to submit my assignment tomorrow at 8 PM",
    "मलाई हरेक महिनाको १ गते घरभाडा तिर्न सम्झाउनु।",
    "Show my pending tasks for this month",
    "Is it raining in Pokhara right now?",
    "Show the Premier League standings",
    "प्रिमियर लिगको ताजा समाचार सुनाऊ।",
]


def build_ui() -> gr.Blocks:
    with gr.Blocks(title="Awaaz AI · Bilingual Assistant") as demo:
        state = gr.State(ConversationState())
        last_reply = gr.State(None)

        gr.HTML(HEADER)
        banner = gr.HTML("")
        with gr.Row():
            dismiss_btn = gr.Button("Dismiss reminder alerts", size="sm", scale=0, min_width=200)
            sound_cb = gr.Checkbox(value=True, label="🔔 Play a sound when a reminder is due", scale=1)

        with gr.Tabs():
            # ── TAB 1: chat ──────────────────────────────────────────────
            with gr.Tab("💬 AI Chat"):
                chatbot = gr.Chatbot(height=460, label="Conversation", buttons=["copy"],
                                     placeholder="Ask in English, नेपाली or Romanized Nepali — e.g. "
                                                 "<i>mero reminder dekhau</i>")
                with gr.Row():
                    chat_in = gr.Textbox(placeholder="Type your message… (Enter to send)", show_label=False,
                                         scale=5, lines=1, max_lines=4, container=False)
                    send_btn = gr.Button("Send ➤", variant="primary", scale=1, min_width=100)
                gr.Examples(CHAT_EXAMPLES, inputs=chat_in, label="Try an example")
                with gr.Row():
                    listen_btn = gr.Button("🔊 Listen to last reply")
                    clear_btn = gr.Button("🗑️ Clear chat history")
                listen_audio = gr.Audio(label="Spoken reply", autoplay=True, interactive=False)
                listen_status = gr.Markdown()

            # ── TAB 2: voice ─────────────────────────────────────────────
            with gr.Tab("🎙️ Voice Assistant"):
                with gr.Row():
                    with gr.Column(scale=1):
                        mic = gr.Audio(sources=["microphone", "upload"], type="filepath",
                                       label="Record or upload a question")
                        hint = gr.Radio(list(VOICE_HINTS), value="Auto-detect", label="Spoken language",
                                        info="Choose नेपाली if Nepali speech is transcribed as Hindi.")
                        auto_send = gr.Checkbox(value=True, label="Send automatically when I stop recording")
                        ask_btn = gr.Button("🎤 Ask", variant="primary")
                        voice_status = gr.Markdown()
                    with gr.Column(scale=1):
                        transcript = gr.Textbox(label="I heard", interactive=False)
                        answer = gr.Markdown(label="Answer")
                        voice_audio = gr.Audio(label="Spoken reply", autoplay=True, interactive=False)
                voice_hist = gr.Chatbot(height=300, label="Voice interaction history")

            # ── TAB 3: reminders & tasks ─────────────────────────────────
            with gr.Tab("⏰ Reminders & Monthly Tasks"):
                gr.Markdown(NOT_RUNNING_NOTE, elem_classes="note")
                with gr.Row():
                    # reminders
                    with gr.Column(scale=1):
                        gr.Markdown(f"### ⏰ Upcoming reminders  \n<span class='note'>Timezone: {settings.timezone}</span>")
                        rem_table = gr.Dataframe(interactive=False, wrap=True)
                        with gr.Accordion("➕ Add a reminder", open=False):
                            r_title = gr.Textbox(label="What should I remind you about?")
                            with gr.Row():
                                r_date = gr.Textbox(label="Date (YYYY-MM-DD)", value=lambda: today().isoformat())
                                r_time = gr.Textbox(label="Time (HH:MM, 24h)", placeholder="20:00")
                            r_rec = gr.Dropdown(list(RECURRENCE_CHOICES), value="One time", label="Repeats")
                            r_add = gr.Button("Save reminder", variant="primary")
                        with gr.Accordion("✏️ Manage a reminder", open=False):
                            r_pick = gr.Dropdown(label="Reminder", choices=[])
                            with gr.Row():
                                r_new_title = gr.Textbox(label="New title (optional)")
                                r_new_date = gr.Textbox(label="New date (optional)")
                                r_new_time = gr.Textbox(label="New time (optional)")
                            r_new_rec = gr.Dropdown([""] + list(RECURRENCE_CHOICES), value="", label="New repeat (optional)")
                            with gr.Row():
                                r_save = gr.Button("Save changes")
                                r_done = gr.Button("✅ Mark done")
                                r_cancel = gr.Button("🚫 Cancel")
                                r_delete = gr.Button("🗑️ Delete", variant="stop")
                        rem_status = gr.Markdown()
                        gr.Markdown("#### 🔔 Recently fired")
                        notif_md = gr.Markdown()
                    # tasks
                    with gr.Column(scale=1):
                        gr.Markdown("### 📝 Monthly tasks")
                        month_dd = gr.Dropdown(month_choices(), value=lambda: tasks.month_key(today()), label="Month")
                        progress = gr.HTML()
                        with gr.Tabs():
                            with gr.Tab("⬜ Pending"):
                                pending_table = gr.Dataframe(interactive=False, wrap=True)
                            with gr.Tab("✅ Completed"):
                                done_table = gr.Dataframe(interactive=False, wrap=True)
                            with gr.Tab("⚠️ Overdue (all months)"):
                                overdue_table = gr.Dataframe(interactive=False, wrap=True)
                        with gr.Accordion("➕ Add a task", open=False):
                            t_title = gr.Textbox(label="Task")
                            t_desc = gr.Textbox(label="Description (optional)")
                            with gr.Row():
                                t_due = gr.Textbox(label="Due date (optional, YYYY-MM-DD)")
                                t_remind = gr.Textbox(label="Also remind me at (optional HH:MM)")
                            t_rec = gr.Checkbox(label="🔁 Recurring every month")
                            t_add = gr.Button("Add task", variant="primary")
                        with gr.Accordion("✏️ Manage a task", open=False):
                            t_pick = gr.Dropdown(label="Task", choices=[])
                            with gr.Row():
                                t_new_title = gr.Textbox(label="New title (optional)")
                                t_new_due = gr.Textbox(label="New due date (optional)")
                            with gr.Row():
                                t_complete = gr.Button("✅ Complete")
                                t_reopen = gr.Button("↩️ Reopen")
                                t_save = gr.Button("Save changes")
                                t_delete = gr.Button("🗑️ Delete", variant="stop")
                        task_status = gr.Markdown()

            # ── TAB 4: football & weather ────────────────────────────────
            with gr.Tab("⚽ Football & 🌤️ Weather"):
                with gr.Row():
                    with gr.Column(scale=3):
                        gr.Markdown("### ⚽ Football (soccer)")
                        with gr.Row():
                            league = gr.Dropdown(LEAGUE_CHOICES, value="PL", label="Competition")
                            team = gr.Textbox(label="Team (optional)", placeholder="e.g. Barcelona")
                            f_lang = gr.Radio(list(LANG_CHOICES), value="English", label="Language")
                        with gr.Row():
                            news_btn = gr.Button("📰 Latest news")
                            table_btn = gr.Button("🏆 Standings")
                            results_btn = gr.Button("📊 Recent results")
                            fixtures_btn = gr.Button("📅 Upcoming matches")
                        football_out = gr.Markdown("_Choose a competition and press a button._")
                    with gr.Column(scale=2):
                        gr.Markdown("### 🌤️ Weather")
                        city = gr.Textbox(label="City", value="Kathmandu")
                        with gr.Row():
                            when = gr.Radio(["Now", "Tomorrow", "In 2 days"], value="Now", label="When")
                            w_lang = gr.Radio(list(LANG_CHOICES), value="English", label="Language")
                        weather_btn = gr.Button("Get weather", variant="primary")
                        weather_out = gr.Markdown()

        dash = [rem_table, r_pick, notif_md, progress, pending_table, done_table, overdue_table, t_pick]

        # chat events
        chat_io = dict(fn=chat_send, inputs=[chat_in, chatbot, state], outputs=[chatbot, chat_in, state, last_reply])
        chat_in.submit(**chat_io).then(dashboard, month_dd, dash)
        send_btn.click(**chat_io).then(dashboard, month_dd, dash)
        listen_btn.click(listen_last, last_reply, [listen_audio, listen_status])
        clear_btn.click(clear_chat, outputs=[chatbot, state, last_reply, voice_hist, listen_audio, listen_status])

        # voice events
        voice_io = dict(fn=voice_ask, inputs=[mic, hint, state, voice_hist],
                        outputs=[transcript, answer, voice_audio, voice_hist, voice_status, state])
        ask_btn.click(**voice_io).then(dashboard, month_dd, dash)

        def maybe_auto(audio_path, hint_label, st, vh, auto):
            if not auto:
                yield "", "", None, vh, "Recording ready — press **Ask** to send.", st
                return
            yield from voice_ask(audio_path, hint_label, st, vh)

        mic.stop_recording(maybe_auto, [mic, hint, state, voice_hist, auto_send],
                           [transcript, answer, voice_audio, voice_hist, voice_status, state]
                           ).then(dashboard, month_dd, dash)

        # reminders
        r_add.click(add_reminder, [r_title, r_date, r_time, r_rec, month_dd], [rem_status, *dash])
        r_save.click(edit_reminder, [r_pick, r_new_title, r_new_date, r_new_time, r_new_rec, month_dd], [rem_status, *dash])
        for btn, status in ((r_done, "done"), (r_cancel, "cancelled"), (r_delete, "deleted")):
            btn.click(lambda rid, m, s=status: reminder_status(rid, s, m), [r_pick, month_dd], [rem_status, *dash])

        # tasks
        month_dd.change(dashboard, month_dd, dash)
        t_add.click(add_task, [t_title, t_desc, t_due, t_rec, t_remind, month_dd], [task_status, month_dd, *dash])
        for btn, action in ((t_complete, "complete"), (t_reopen, "reopen"), (t_delete, "delete"), (t_save, "edit")):
            btn.click(lambda tid, nt, nd, m, a=action: task_action(tid, a, nt, nd, m),
                      [t_pick, t_new_title, t_new_due, month_dd], [task_status, *dash])

        # football & weather
        for btn, kind in ((news_btn, "football_news"), (table_btn, "league_table"),
                          (results_btn, "league_results"), (fixtures_btn, "football_fixtures")):
            btn.click(lambda lg, tm, lang, k=kind: football_action(k, lg, tm, lang), [league, team, f_lang], football_out)
        weather_btn.click(weather_action, [city, when, w_lang, state], weather_out)
        city.submit(weather_action, [city, when, w_lang, state], weather_out)

        # due reminders: poll every 10 s while the page is open
        gr.Timer(10).tick(poll_notifications, [sound_cb, month_dd], [banner, *dash])
        dismiss_btn.click(lambda: "", outputs=banner)

        demo.load(on_load, month_dd, [chatbot, voice_hist, state, *dash])
    return demo


def main() -> None:
    setup_logging()
    init_db()
    start_scheduler()
    log.info("starting", extra={"host": settings.server_host, "port": settings.server_port, "tz": settings.timezone})
    auth = tuple(settings.app_auth.split(":", 1)) if ":" in settings.app_auth else None
    build_ui().queue().launch(
        server_name=settings.server_host, server_port=settings.server_port, auth=auth,
        theme=gr.themes.Soft(primary_hue="violet", secondary_hue="cyan"), css=CSS,
    )


if __name__ == "__main__":
    main()
