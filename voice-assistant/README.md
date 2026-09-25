# Awaaz AI — Bilingual AI Voice and Chat Assistant

**Everyday task management, weather and football news in Nepali (नेपाली) and English.**
University data-science project · Python 3.11+ · Gradio · Groq Whisper + LLM · Gemini TTS · SQLite · APScheduler

The assistant has a deliberately **limited scope**: greetings and small talk, personal reminders,
monthly tasks, weather, and football (soccer). Everything else is politely refused.

---

## 1. Features

| Capability | What it does | Data source |
|---|---|---|
| 💬 Text chat | English, Devanagari Nepali and Romanized Nepali; replies in the user's language; follow-up questions; persistent history; "listen to reply" button | Groq LLM |
| 🎙️ Voice | Record **or upload** audio → Whisper → same backend → spoken WAV reply (auto-plays) | Groq Whisper, Gemini TTS / edge-tts |
| ⏰ Reminders | One-time, daily, weekly, monthly; timezone-aware; edit/complete/cancel/delete; in-app pop-up with optional sound | SQLite + APScheduler |
| 📝 Monthly tasks | Add/edit/complete/delete, recurring monthly tasks without duplicates, pending/completed/overdue views, progress bar, optional linked reminder | SQLite |
| 🌤️ Weather | Current conditions (temperature, feels-like, rain, wind) kept separate from forecasts; location's own timezone; remembers the last city | Open-Meteo |
| ⚽ Football | Standings, recent results, upcoming fixtures, team results, news summaries with sources — six competitions (PL, La Liga, Bundesliga, Serie A, Ligue 1, UCL) | Football-Data.org, NewsAPI |

---

## 2. Review of the original script (`legacy/original_app.py`)

**Reused (kept almost unchanged):** `generate_with_retry`, `transcribe_file` → `services/speech_to_text.py`,
`save_wave_file` and the Gemini `text_to_speech` call → `services/text_to_speech.py`, the `WEATHER_CODES`
table (completed and translated), `LEAGUE_CODES` (extended with Nepali names), the
`classify_intent` → handler → reply design, and the `get_football_news_summary` prompt idea.

**Problems found and fixed:**

| # | Problem in the original | Fix |
|---|---|---|
| 1 | `os.environ["…"]` at import crashed the whole app if any key was missing | Keys are optional at start-up; each feature shows *"This feature needs X in .env"* |
| 2 | No `timeout=` on any `requests.get` — a slow API froze the UI forever | Shared session with timeouts and retry/backoff on 5xx (`services/http.py`) |
| 3 | Errors (quota, network, 403 plan limits) bubbled up as stack traces in the UI | Every failure becomes a friendly bilingual message; TTS failure keeps the text reply |
| 4 | `text_to_speech()` always wrote `output.wav` → simultaneous users overwrote each other's audio | Unique file per reply + periodic clean-up |
| 5 | Gemini TTS used for Nepali without checking support | Nepali is routed to edge-tts (native ne-NP voices) by default, with automatic fallback both ways and a check script to compare by ear |
| 6 | `classify_intent` parsed JSON with `.replace("json", "", 1)` and `json.loads` → crashed on fences/chatter and could corrupt values containing "json" | JSON mode + robust extraction + retry + **Pydantic** validation; bad fields become `None` instead of crashing |
| 7 | News API key sent in the URL query string (ends up in logs/proxies) | Sent as the `X-Api-Key` header |
| 8 | `current_weather=True` only — could not answer *"is it raining?"* or *"tomorrow?"* | Current rain/precipitation/feels-like + hourly/daily forecast, clearly labelled "now" vs "forecast" |
| 9 | League results fetched the whole season on every question; no rate-limit handling (free tier = 10 req/min) | Caching + client-side limiter; one request serves both results and fixtures |
| 10 | NFL filtering relied only on the query | Query exclusions **and** local keyword filter |
| 11 | Replies were always generated in English for data answers; no memory between turns | Language detection (script + LLM), bilingual templates, conversation state and follow-ups |
| 12 | `demo.launch()` at module level; single 300-line file | Modules with one responsibility each, `main()` entry point, tests |

---

## 3. Architecture

```
            ┌──────────── Gradio UI (app.py) ─────────────┐
 text ─────►│ 💬 Chat   🎙️ Voice   ⏰ Reminders/Tasks   ⚽🌤️ │◄── gr.Timer polls due reminders
 audio ────►└──────┬──────────┬──────────────────────┬─────┘
                   │   speech_to_text (Whisper)     │ dashboard buttons
                   ▼          ▼                      ▼
           assistant/conversation.respond()   run_intent()
                   │  ① intent_classifier (Groq LLM → JSON → Pydantic)
                   │  ② merge follow-up answers   ③ dispatch
                   ▼
           assistant/handlers.py ──► services/{weather, football, news, reminders, tasks}
                   │                          │ SQLite (database/db.py) ◄── scheduler/reminder_scheduler.py
                   ▼                          ▼
           response_generator (templates for facts, LLM only for small talk + news summaries)
                   ▼
           Reply(text, spoken, language) ──► text_to_speech (Gemini / edge-tts) ──► WAV
```

```
voice-assistant/
├── app.py                        # Gradio UI (4 tabs inside the HUD) + start-up
├── hud.py                        # futuristic HUD theme: CSS, live clock script, SVG gauges
├── config.py                     # settings from .env, JSON structured logging
├── assistant/
│   ├── intent_classifier.py      # 16 intents, entity extraction, Pydantic validation
│   ├── conversation.py           # shared backend for chat + voice, follow-ups, history
│   ├── handlers.py               # one function per intent
│   └── response_generator.py     # bilingual templates, formatters, LLM greeting/news summary
├── services/
│   ├── http.py                   # timeouts, retries, friendly errors, cache, rate limiter
│   ├── llm.py                    # Groq chat wrapper (JSON mode + retry)
│   ├── speech_to_text.py         # Groq Whisper
│   ├── text_to_speech.py         # Gemini TTS + edge-tts fallback, unique WAV files
│   ├── weather.py  football.py  news.py
│   └── reminders.py  tasks.py    # SQLite business logic
├── database/db.py  models.py     # schema auto-created on start-up
├── scheduler/reminder_scheduler.py
├── scripts/check_setup.py        # pre-demo API + TTS check
├── tests/                        # 97 unit tests, all external services mocked
└── legacy/original_app.py        # the original script, for comparison
```

**Design decisions worth mentioning in the report**
* **Facts are never generated by the LLM.** Scores, tables, weather numbers and reminder times are
  formatted by deterministic templates from API data. The LLM only classifies intents, makes small
  talk and summarises the news articles it is given (with an instruction to treat them as untrusted data).
* **Timestamps** are stored in UTC with the IANA timezone; recurring reminders keep their local
  wall-clock time (a "31st of every month" reminder fires on 28 Feb, then 31 Mar).
* **Exactly-once notifications:** `UNIQUE(reminder_id, due_at)` plus a compare-and-set update.
* **No duplicate recurring tasks:** one *series* row + `UNIQUE(series_id, month)` with `INSERT OR IGNORE`.

---

## 4. Installation

```bash
cd voice-assistant
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # Windows: copy .env.example .env
```

Fill in `.env`:

| Key | Where to get it | Free tier notes |
|---|---|---|
| `GROQ_API_KEY` | console.groq.com/keys | generous; rate-limited per minute |
| `GEMINI_API_KEY` | aistudio.google.com/apikey | TTS preview model has a daily quota |
| `NEWS_API_KEY` | newsapi.org/register | developer plan: localhost only, articles delayed ~24 h |
| `FOOTBALL_DATA_KEY` | football-data.org/client/register | 10 requests/min, the six supported competitions included; scores may be delayed |

Open-Meteo needs no key. The timezone defaults to `Asia/Kathmandu` (`APP_TIMEZONE` in `.env`).

Check everything before a demo (also creates Nepali/English TTS samples in `data/tts_check/`):

```bash
python scripts/check_setup.py
```

## 5. Run

```bash
python app.py
```

Open **http://127.0.0.1:7860**. The interface is a futuristic HUD: a live calendar dial, a system panel,
upcoming reminders, an animated core that speeds up while the assistant is thinking or listening,
weather and monthly-task gauges, and a circular dock that switches between the four tabs. The SQLite database (`data/assistant.db`) and its tables are
created automatically on first start. Logs are written as JSON lines to `logs/app.log`.

## 6. Tests

```bash
pytest -q            # 97 tests, ~2 s, no network or API keys needed
pytest -v tests/test_reminders.py     # a single file
```

Covered: Nepali/English/Romanized intent classification and validation, reminder creation and
retrieval, monthly recurrence (month-end clamping), exactly-once firing, timezone conversion,
recurring tasks without duplicates, progress/overdue, weather current-rain vs forecast, football
parsing/filtering/rate limits, NFL filtering, HTTP 429/403/500/timeouts/bad JSON, malformed LLM
output, STT empty/short/failed audio, TTS fallback and total failure, follow-up questions.

---

## 7. Example interactions

| You say / type | Assistant |
|---|---|
| **Greeting** — `नमस्ते! तपाईंलाई कस्तो छ?` | नमस्ते! म ठिक छु, धन्यवाद। म रिमाइन्डर, काम, मौसम र फुटबलमा सहयोग गर्न सक्छु। |
| **Reminder** — `Remind me to call mum` | What time should I remind you about "call mum"? |
| ↳ follow-up — `tomorrow at eight` | ✅ Reminder saved: **call mum** — Fri 25 Sep 2026, 8:00 AM. |
| `मलाई हरेक महिनाको १ गते घरभाडा तिर्न सम्झाउनु।` | "घरभाडा तिर्ने" बारे कति बजे सम्झाऊँ? → `बिहान ९ बजे` → ✅ रिमाइन्डर सुरक्षित भयो … हरेक महिना। |
| `What reminders do I have today?` | Your reminders for today: - **call mum** — … |
| **Tasks** — `Add paying my electricity bill as a recurring monthly task` | 📝 Added **paying my electricity bill** to your tasks for September 2026, every month. |
| `मेरो रिपोर्टको काम पूरा भयो।` | 🎉 **प्रोजेक्ट रिपोर्ट** पूरा भयो भनेर चिन्ह लगाइयो। |
| `बाँकी रहेका काम देखाऊ।` | सेप्टेम्बर 2026 का बाँकी कामहरू (3 मध्ये 1 पूरा): … |
| **Weather** — `Is it raining in Pokhara right now?` | In Pokhara it's currently 24°C … ☀️ It is not raining right now. 🔮 Forecast for the rest of today: up to 65% chance of rain. |
| `Will it rain tomorrow?` (same conversation) | 🔮 Forecast for Pokhara on Fri 25 Sep: moderate rain … 🌧️ Rain is likely (80%). _This is a forecast, not current conditions._ |
| **Football** — `Show the Premier League standings` | 🏆 table from Football-Data.org + "last updated" time |
| `What were Barcelona's recent results?` | ⚽ Confirmed results — FC Barcelona 4 – 1 Sevilla FC … |
| `प्रिमियर लिगको ताजा समाचार सुनाऊ।` | 📰 समाचार (प्रकाशित लेखहरू — पुष्टि भएका खेल नतिजा होइनन्): 4–6 वाक्यको सारांश + स्रोतहरू |
| **Out of scope** — `Write my essay` | Sorry, I can only help with greetings, reminders, monthly tasks, the weather and football news. |

(Exact wording of LLM-generated greetings and summaries will vary.)

---

## 8. Presenting the project (suggested 10-minute demo)

1. **Problem & scope (1 min)** — a *focused* bilingual assistant for everyday needs in Nepal; why a
   limited scope is more reliable than a general chatbot.
2. **Architecture (2 min)** — show the diagram above: speech → text → intent (LLM + Pydantic) →
   deterministic services → templates → speech. Stress "facts never come from the LLM".
3. **Live demo (5 min)** — keep the browser zoomed to ~125 %:
   * Chat: `नमस्ते` → `Remind me to submit my assignment` → answer the follow-up `today at <2 minutes from now>`.
   * Voice tab: ask *"काठमाडौंमा अहिले पानी परिरहेको छ?"*; point out the transcript, the Nepali reply and the audio.
   * Football tab: Premier League standings; then ask in chat for Premier League news **in Nepali**
     and show the sources and the "news ≠ confirmed results" label.
   * Tasks tab: add a recurring monthly task, complete another, show the progress bar and overdue list.
   * By now the reminder pops up with a chime — the scheduler working live.
4. **Data-science angle (1 min)** — structured JSON logs (`logs/app.log`) can be loaded into pandas to
   analyse intent distribution, language mix, latency per service and error rates:
   `pd.read_json("logs/app.log", lines=True).query("msg == 'intent'").intent.value_counts()`.
5. **Testing & limitations (1 min)** — run `pytest -q` (97 tests, all APIs mocked); honest limits below.

**Before the presentation:** run `python scripts/check_setup.py`, and have a backup screen recording
in case the venue Wi-Fi blocks the APIs.

## 9. Limitations (state them honestly)

* **Reminders only fire while the app is running.** Reliable notifications when it is closed would
  need an always-on deployed scheduler plus a delivery channel such as e-mail, SMS or push.
* Whisper sometimes labels Nepali speech as Hindi; choosing **नेपाली** in the Voice tab forces Nepali.
* Romanized Nepali input is understood, but replies are written in Devanagari (better for TTS).
* Gemini TTS did not officially list Nepali when this was written, hence the edge-tts fallback;
  edge-tts uses Microsoft Edge's online read-aloud service (unofficial API; needs internet).
* Free tiers: NewsAPI articles are delayed and localhost-only; Football-Data.org scores may be delayed
  and live scores may be unavailable.

## 10. Security & privacy

* API keys come only from `.env` (git-ignored) and are never logged or displayed; the NewsAPI key is
  sent as a header, not in the URL.
* The app listens on `127.0.0.1` only and is designed as a **single-user local** app. If you deploy it
  publicly, set `APP_AUTH=username:password` at minimum, and add a `user_id` column to reminders,
  tasks and chat history so each user's data stays private.
* All user input is validated before saving/deleting (titles, dates, times, months, IDs); SQL uses
  parameterised queries; the LLM is told to treat messages and news text as data, not instructions.
