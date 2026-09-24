"""Awaaz AI — interactive UI for the voice assistant.

All the assistant logic (speech-to-text, intent classification, weather,
football, text-to-speech) lives in app.py; this file only builds the interface.

Run:  python ui.py
"""
import tempfile
import gradio as gr

import app  # your original backend


def route_intent(text):
    """Same routing as app.assistant_respond, but also returns the detected intent for the status badge."""
    intent = app.classify_intent(text)
    name = intent.get("intent", "out_of_scope")
    if name == "greeting":
        return name, app.handle_greeting(text)
    elif name == "weather":
        return name, app.handle_weather(intent.get("city"))
    elif name == "news_summary":
        return name, app.handle_news_summary(intent)
    else:
        return "out_of_scope", app.handle_out_of_scope()


def synthesize_reply(text, voice):
    # Unique file per reply so concurrent users don't overwrite each other's audio
    out_path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    return app.text_to_speech(text, out_path=out_path, voice=voice)



VOICES = ["Kore", "Puck", "Charon", "Aoede", "Fenrir", "Leda", "Orus", "Zephyr"]

INTENT_BADGES = {
    "greeting":     ("👋", "Greeting",      "#f472b6"),
    "weather":      ("🌤️", "Weather",       "#38bdf8"),
    "news_summary": ("⚽", "Football",      "#34d399"),
    "out_of_scope": ("🤷", "Out of scope",  "#a78bfa"),
}

def status_html(state, text, color="#a78bfa", pulse=False):
    return (
        f'<div class="status-pill {"pulse" if pulse else ""}" style="--c:{color}">'
        f'<span class="dot"></span><span class="label">{state}</span>'
        f'<span class="sub">{text}</span></div>'
    )

IDLE_STATUS = status_html("Ready", "Tap the mic or type a question", "#34d399")

def _respond(question, history, voice, speak):
    """Shared generator for text and voice turns. Yields (history, status, audio)."""
    history = list(history or [])
    history.append({"role": "user", "content": question})
    history.append({"role": "assistant", "content": "⏳ *Thinking…*"})
    yield history, status_html("Thinking", "Understanding your question…", "#fbbf24", True), None

    try:
        intent, answer = route_intent(question)
    except Exception as e:
        history[-1] = {"role": "assistant", "content": f"⚠️ Something went wrong: `{e}`"}
        yield history, status_html("Error", "Couldn't answer that one", "#f87171"), None
        return

    emoji, label, color = INTENT_BADGES.get(intent, INTENT_BADGES["out_of_scope"])
    history[-1] = {"role": "assistant", "content": answer}
    if not speak:
        yield history, status_html(f"{emoji} {label}", "Answered (voice off)", color), None
        return

    yield history, status_html(f"{emoji} {label}", "Generating voice reply…", color, True), None
    try:
        audio = synthesize_reply(answer, voice)
        yield history, status_html(f"{emoji} {label}", f"Speaking with {voice}", color), audio
    except Exception as e:
        yield history, status_html(f"{emoji} {label}", f"Voice unavailable ({type(e).__name__})", "#f87171"), None

def text_turn(text, history, voice, speak):
    text = (text or "").strip()
    if not text:
        yield history, IDLE_STATUS, None, ""
        return
    for h, s, a in _respond(text, history, voice, speak):
        yield h, s, a, ""

def voice_turn(audio_path, history, voice, speak):
    if audio_path is None:
        yield history, status_html("No audio", "Record something first", "#f87171"), None, None
        return
    yield history, status_html("Listening", "Transcribing your voice…", "#38bdf8", True), None, None
    try:
        question = app.transcribe_file(audio_path)
    except Exception as e:
        yield history, status_html("Error", f"Transcription failed ({type(e).__name__})", "#f87171"), None, None
        return
    if not question:
        yield history, status_html("Hmm", "I didn't catch that — try again", "#f87171"), None, None
        return
    for h, s, a in _respond(question, history, voice, speak):
        yield h, s, a, None

def clear_chat():
    return [], IDLE_STATUS, None

QUICK_PROMPTS = [
    ("🌤️ Kathmandu weather", "What's the weather in Kathmandu right now?"),
    ("🇳🇵 पोखराको मौसम", "पोखराको मौसम कस्तो छ?"),
    ("🏆 Premier League table", "Show me the Premier League table"),
    ("📊 La Liga results", "What are the recent La Liga results?"),
    ("📰 Real Madrid news", "What's the latest Real Madrid news?"),
    ("👋 नमस्ते!", "नमस्ते! तपाईंलाई कस्तो छ?"),
]

HERO = """
<div class="hero">
  <div class="orb"><div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div><span>🎙️</span></div>
  <div>
    <h1>Awaaz <span class="grad">AI</span></h1>
    <p>Your bilingual voice assistant — ask about <b>weather</b> or <b>football</b> in <b>नेपाली</b> or <b>English</b>.</p>
    <div class="chips">
      <span class="chip">🌤️ Live weather</span><span class="chip">⚽ League tables</span>
      <span class="chip">📰 News summaries</span><span class="chip">🗣️ Speech in &amp; out</span>
    </div>
  </div>
</div>
"""

CSS = """
.gradio-container { max-width: 1240px !important; margin: auto; background: transparent !important; }
body, gradio-app {
  background: radial-gradient(1200px 600px at 10% -10%, rgba(124,58,237,.35), transparent 60%),
              radial-gradient(900px 500px at 110% 10%, rgba(6,182,212,.28), transparent 60%),
              radial-gradient(800px 600px at 50% 120%, rgba(236,72,153,.22), transparent 60%),
              #0b0b1a !important;
  background-attachment: fixed !important;
}
footer { display: none !important; }

/* Hero */
.hero { display:flex; gap:28px; align-items:center; padding:28px 8px 12px; }
.hero h1 { font-size: 2.6rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; color:#f5f3ff; }
.hero p { margin: 6px 0 12px; color: #c4b5fd; font-size: 1.05rem; }
.grad { background: linear-gradient(90deg,#a78bfa,#22d3ee,#f472b6); -webkit-background-clip:text; background-clip:text; color:transparent;
        background-size:200% auto; animation: shine 4s linear infinite; }
@keyframes shine { to { background-position: 200% center; } }
.chips { display:flex; flex-wrap:wrap; gap:8px; }
.chip { padding:5px 12px; border-radius:999px; font-size:.82rem; color:#e0e7ff;
        background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); backdrop-filter: blur(6px); }

/* Animated orb */
.orb { position:relative; width:92px; height:92px; flex:none; border-radius:50%; display:grid; place-items:center;
       background: conic-gradient(from 0deg,#7c3aed,#06b6d4,#ec4899,#7c3aed); animation: spin 6s linear infinite;
       box-shadow: 0 0 40px rgba(124,58,237,.6), 0 0 80px rgba(6,182,212,.3); }
.orb span { font-size:2.2rem; animation: spin 6s linear infinite reverse; }
.orb::after { content:""; position:absolute; inset:6px; border-radius:50%; background:#12122a; z-index:0; }
.orb span { position:relative; z-index:1; }
.ring { position:absolute; inset:-6px; border-radius:50%; border:2px solid rgba(167,139,250,.5); animation: ripple 2.8s ease-out infinite; }
.r2 { animation-delay: .9s; } .r3 { animation-delay: 1.8s; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes ripple { from { transform: scale(1); opacity:.8 } to { transform: scale(1.7); opacity:0 } }

/* Glass cards */
.glass { background: rgba(20,20,45,.55) !important; border:1px solid rgba(255,255,255,.1) !important;
         border-radius: 20px !important; backdrop-filter: blur(14px); box-shadow: 0 10px 40px rgba(0,0,0,.35); padding: 14px !important; }
.section-title { font-weight:700; color:#e9d5ff; font-size:.95rem; letter-spacing:.04em; text-transform:uppercase; margin: 2px 4px 8px; }

/* Chat */
#chat { border-radius: 16px !important; }
#chat .message.user { background: linear-gradient(135deg,#7c3aed,#6366f1) !important; color:#fff !important; border:none !important; }
#chat .message.bot  { background: rgba(255,255,255,.06) !important; border:1px solid rgba(255,255,255,.08) !important; }

/* Input row */
#ask-row { align-items: center; }
#ask-box, #ask-box > label { background: transparent !important; border: none !important; }
#ask-box textarea { border-radius: 14px !important; font-size: 1rem !important; padding: 12px 14px !important;
   background: rgba(255,255,255,.06) !important; border: 1px solid rgba(167,139,250,.3) !important; }
#ask-box textarea:focus { border-color: #a78bfa !important; box-shadow: 0 0 0 3px rgba(167,139,250,.25) !important; }
#send-btn, #voice-btn { border-radius: 14px !important; font-weight:700 !important;
   background: linear-gradient(135deg,#7c3aed,#06b6d4) !important; border:none !important; color:#fff !important;
   transition: transform .15s ease, box-shadow .15s ease; }
#send-btn:hover, #voice-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,.5); }

/* Quick prompts */
.quick button { border-radius: 999px !important; background: rgba(255,255,255,.05) !important;
   border:1px solid rgba(167,139,250,.35) !important; color:#e0e7ff !important; font-size:.85rem !important;
   transition: all .15s ease; }
.quick button:hover { background: rgba(167,139,250,.2) !important; transform: translateY(-1px); }

/* Status pill */
.status-pill { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:14px;
   background: color-mix(in srgb, var(--c) 12%, transparent); border:1px solid color-mix(in srgb, var(--c) 45%, transparent); }
.status-pill .dot { width:10px; height:10px; border-radius:50%; background: var(--c); box-shadow: 0 0 12px var(--c); flex:none; }
.status-pill.pulse .dot { animation: blink 1s ease-in-out infinite; }
.status-pill .label { font-weight:700; color:#f5f3ff; }
.status-pill .sub { color:#c7d2fe; font-size:.88rem; margin-left:auto; text-align:right; }
@keyframes blink { 50% { transform: scale(1.6); opacity:.4 } }

@media (max-width: 720px) {
  .hero { flex-direction: column; text-align:center; } .chips { justify-content:center; }
  .hero h1 { font-size: 2rem; }
}
"""

# Force dark mode regardless of the visitor's OS setting
FORCE_DARK_JS = """
() => { if (!document.body.classList.contains('dark')) document.body.classList.add('dark'); }
"""

THEME = gr.themes.Soft(
    primary_hue="violet", secondary_hue="cyan", neutral_hue="slate",
    font=[gr.themes.GoogleFont("Plus Jakarta Sans"), "ui-sans-serif", "sans-serif"],
).set(
    block_background_fill_dark="transparent",
    block_border_color_dark="rgba(255,255,255,0.08)",
    input_background_fill_dark="rgba(255,255,255,0.05)",
)

with gr.Blocks(title="Awaaz AI · Nepali/English Voice Assistant") as demo:
    gr.HTML(HERO)

    with gr.Row(equal_height=False):
        # ── Left: conversation ───────────────────────────────────────────────
        with gr.Column(scale=3, elem_classes="glass"):
            gr.HTML('<div class="section-title">💬 Conversation</div>')
            chatbot = gr.Chatbot(
                elem_id="chat", height=460, show_label=False,
                placeholder=(
                    "<div style='text-align:center;opacity:.8'>"
                    "<div style='font-size:3rem'>🎧</div>"
                    "<b>Say नमस्ते or ask me anything!</b><br>"
                    "<span style='font-size:.9rem'>Weather · League tables · Match results · Football news</span></div>"
                ),
            )
            with gr.Row(elem_id="ask-row"):
                ask_box = gr.Textbox(
                    elem_id="ask-box", show_label=False, container=False, scale=5, min_width=220, lines=1, max_lines=4,
                    placeholder="Ask in English or नेपाली…",
                )
                send_btn = gr.Button("Send ➤", elem_id="send-btn", scale=1, min_width=110)

            gr.HTML('<div class="section-title" style="margin-top:10px">⚡ Try one</div>')
            with gr.Row(elem_classes="quick"):
                quick_btns = [gr.Button(label, size="sm", min_width=140) for label, _ in QUICK_PROMPTS]

        # ── Right: voice + settings ──────────────────────────────────────────
        with gr.Column(scale=2):
            with gr.Column(elem_classes="glass"):
                gr.HTML('<div class="section-title">🎙️ Speak</div>')
                mic = gr.Audio(
                    sources=["microphone"], type="filepath", show_label=False,
                    waveform_options=gr.WaveformOptions(waveform_color="#a78bfa", waveform_progress_color="#22d3ee"),
                )
                voice_btn = gr.Button("🎤 Ask by voice", elem_id="voice-btn")
                status = gr.HTML(IDLE_STATUS)

            with gr.Column(elem_classes="glass"):
                gr.HTML('<div class="section-title">🔊 Spoken reply</div>')
                reply_audio = gr.Audio(
                    show_label=False, autoplay=True, interactive=False,
                    waveform_options=gr.WaveformOptions(waveform_color="#22d3ee", waveform_progress_color="#f472b6"),
                )

            with gr.Accordion("⚙️ Settings", open=False, elem_classes="glass"):
                voice_dd = gr.Dropdown(VOICES, value="Kore", label="Assistant voice")
                speak_cb = gr.Checkbox(value=True, label="Speak replies out loud")
                auto_send = gr.Checkbox(value=True, label="Send automatically when I stop recording")
                clear_btn = gr.Button("🗑️ Clear conversation", variant="secondary")

    # ── Events ───────────────────────────────────────────────────────────────
    text_io = dict(inputs=[ask_box, chatbot, voice_dd, speak_cb], outputs=[chatbot, status, reply_audio, ask_box])
    ask_box.submit(text_turn, **text_io)
    send_btn.click(text_turn, **text_io)

    voice_io = dict(inputs=[mic, chatbot, voice_dd, speak_cb], outputs=[chatbot, status, reply_audio, mic])
    voice_btn.click(voice_turn, **voice_io)
    def auto_voice_turn(audio_path, history, voice, speak, auto):
        if auto:
            yield from voice_turn(audio_path, history, voice, speak)
        else:
            yield history, status_html("Recorded", "Press “Ask by voice” to send", "#38bdf8"), None, audio_path

    mic.stop_recording(
        auto_voice_turn,
        inputs=[mic, chatbot, voice_dd, speak_cb, auto_send], outputs=[chatbot, status, reply_audio, mic],
    )

    for btn, (_, prompt) in zip(quick_btns, QUICK_PROMPTS):
        btn.click(
            lambda h, v, s, p=prompt: (yield from text_turn(p, h, v, s)),
            inputs=[chatbot, voice_dd, speak_cb], outputs=[chatbot, status, reply_audio, ask_box],
        )

    clear_btn.click(clear_chat, outputs=[chatbot, status, reply_audio])

if __name__ == "__main__":
    demo.launch(theme=THEME, css=CSS, js=FORCE_DARK_JS)
