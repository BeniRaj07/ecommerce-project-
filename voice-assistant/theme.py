"""A minimal, ChatGPT-style look: dark-by-default theme, CSS and the small amount of client-side
JavaScript the UI genuinely needs (a push-to-talk mic recorder, a dark/light toggle, and a mobile
sidebar drawer). Everything else — sending, replying, playing audio, the sidebar list — is plain
Gradio, driven from Python in app.py.
"""
from __future__ import annotations

import html

import gradio as gr

# ── theme ────────────────────────────────────────────────────────────────────

BG = "#0e0f11"
SURFACE = "#171719"
SIDEBAR = "#111214"
BORDER = "rgba(255,255,255,.09)"
TEXT = "#ececec"
MUTED = "#9b9b9b"
ACCENT = "#10a37f"      # a calm green, ChatGPT-adjacent but not a copy


def _both(**values: str) -> dict[str, str]:
    import inspect
    accepted = set(inspect.signature(gr.themes.Base.set).parameters)
    out = dict(values)
    out.update({f"{k}_dark": v for k, v in values.items() if f"{k}_dark" in accepted})
    return out


THEME = gr.themes.Base(
    primary_hue="emerald", neutral_hue="gray",
    font=[gr.themes.GoogleFont("Inter"), "ui-sans-serif", "system-ui", "sans-serif"],
).set(**_both(
    body_background_fill=BG, body_text_color=TEXT, body_text_color_subdued=MUTED,
    background_fill_primary=SURFACE, background_fill_secondary=SIDEBAR,
    block_background_fill=SURFACE, block_border_color=BORDER, block_border_width="1px",
    block_radius="10px", block_label_text_color=MUTED, block_title_text_color=TEXT,
    panel_background_fill=SIDEBAR, panel_border_color=BORDER,
    border_color_primary=BORDER, border_color_accent=ACCENT, color_accent=ACCENT,
    input_background_fill=SURFACE, input_border_color=BORDER, input_border_color_focus=ACCENT,
    input_placeholder_color=MUTED,
    button_primary_background_fill=ACCENT, button_primary_background_fill_hover="#13b78e",
    button_primary_text_color="#ffffff", button_primary_border_color=ACCENT,
    button_secondary_background_fill="rgba(255,255,255,.06)",
    button_secondary_background_fill_hover="rgba(255,255,255,.12)",
    button_secondary_text_color=TEXT, button_secondary_border_color=BORDER,
    button_cancel_background_fill="rgba(239,68,68,.12)", button_cancel_text_color="#fca5a5",
    link_text_color=ACCENT, code_background_fill="rgba(255,255,255,.06)",
))


# ── CSS ──────────────────────────────────────────────────────────────────────

CSS = """
:root[data-theme="light"] {
  --bg:#ffffff; --surface:#f7f7f8; --sidebar:#f0f0f2; --border:rgba(0,0,0,.10);
  --text:#111111; --muted:#6b6b6b;
}
:root, :root[data-theme="dark"] {
  --bg:#0e0f11; --surface:#171719; --sidebar:#111214; --border:rgba(255,255,255,.09);
  --text:#ececec; --muted:#9b9b9b; --accent:#10a37f;
}
body, gradio-app { background: var(--bg) !important; }
.gradio-container { max-width: 100% !important; padding: 0 !important; margin: 0 !important;
  font-family: 'Inter', ui-sans-serif, sans-serif !important; height: 100vh; }
footer { display: none !important; }
#app-root { height: 100vh; align-items: stretch !important; gap: 0 !important; flex-wrap: nowrap !important; }

/* ── sidebar ──────────────────────────────────────────── */
#sidebar { background: var(--sidebar) !important; border-right: 1px solid var(--border);
  height: 100vh; display: flex; flex-direction: column; padding: 10px !important; gap: 8px;
  transition: margin-left .2s ease; overflow: hidden; }
#sidebar-header { display: flex; align-items: center; gap: 8px; padding: 6px 6px 2px; }
#sidebar-header .logo { font-size: 1.3rem; }
#sidebar-header .name { font-weight: 700; font-size: 1.02rem; color: var(--text); letter-spacing: -.01em; }
#new-chat-btn { border: 1px solid var(--border) !important; background: transparent !important;
  color: var(--text) !important; justify-content: flex-start !important; font-weight: 600 !important;
  border-radius: 10px !important; }
#new-chat-btn:hover { background: rgba(255,255,255,.06) !important; }
#search-box textarea, #search-box input { border-radius: 10px !important; font-size: .92rem !important; }
#sidebar-scroll { flex: 1 1 auto; overflow-y: auto; min-height: 0; padding-right: 2px; }
.conv-group-label { font-size: .72rem; font-weight: 700; letter-spacing: .04em; color: var(--muted);
  text-transform: uppercase; margin: 12px 8px 4px; }
.conv-row { display: flex; align-items: center; gap: 2px; border-radius: 8px; }
.conv-row:hover, .conv-row.active { background: rgba(255,255,255,.07); }
.conv-title-btn { flex: 1; text-align: left !important; background: transparent !important;
  border: none !important; color: var(--text) !important; font-size: .9rem !important;
  font-weight: 400 !important; padding: 8px 6px !important; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; display: block; min-width: 0; box-shadow: none !important; }
.conv-row.active .conv-title-btn { color: #fff !important; font-weight: 600 !important; }
.conv-icon-btn { min-width: 26px !important; width: 26px !important; height: 26px !important;
  padding: 0 !important; background: transparent !important; border: none !important;
  color: var(--muted) !important; font-size: .85rem !important; border-radius: 6px !important;
  opacity: 0; transition: opacity .12s; }
.conv-row:hover .conv-icon-btn { opacity: 1; }
.conv-icon-btn:hover { background: rgba(255,255,255,.12) !important; color: var(--text) !important; }
#rename-bar { padding: 4px 2px 8px; }
#sidebar-footer { border-top: 1px solid var(--border); padding-top: 8px; display: flex;
  align-items: center; justify-content: space-between; gap: 6px; }
#sidebar-footer label { font-size: .82rem !important; color: var(--muted) !important; }
#theme-toggle { min-width: 34px !important; width: 34px; height: 34px; border-radius: 50% !important;
  padding: 0 !important; background: transparent !important; border: 1px solid var(--border) !important; }

/* ── main column ──────────────────────────────────────── */
#main-col { height: 100vh; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
#mobile-topbar { display: none; }
#chatbot { flex: 1 1 auto; border: none !important; background: var(--bg) !important; }
#chatbot .message-wrap { max-width: 820px; margin: 0 auto; }
#chatbot .message.user { background: var(--surface) !important; border: 1px solid var(--border) !important;
  border-radius: 16px !important; }
#chatbot .message.bot { background: transparent !important; border: none !important; }
/* Wide tables (league standings, results) scroll horizontally instead of crushing on narrow screens */
#chatbot table { display: block; overflow-x: auto; white-space: nowrap; max-width: 100%; }
#chatbot table td, #chatbot table th { white-space: nowrap; }
#status-line { max-width: 820px; margin: -6px auto 0; padding: 0 24px; min-height: 20px;
  font-size: .85rem; color: var(--muted); }
#status-line:not(:empty) { animation: pulse-text 1.4s ease-in-out infinite; }
@keyframes pulse-text { 0%,100% { opacity: .5 } 50% { opacity: 1 } }

#composer-wrap { max-width: 820px; width: 100%; margin: 0 auto; padding: 8px 24px 18px; }
#composer { display: flex; align-items: flex-end; gap: 8px; background: var(--surface);
  border: 1px solid var(--border); border-radius: 26px; padding: 6px 6px 6px 14px; }
#composer-input textarea, #composer-input input { border: none !important; background: transparent !important;
  box-shadow: none !important; font-size: .98rem !important; padding: 8px 4px !important; }
#send-btn, .mic-btn { min-width: 40px !important; width: 40px; height: 40px; border-radius: 50% !important;
  padding: 0 !important; font-size: 1.05rem !important; flex: none; }
#send-btn { background: var(--accent) !important; border: none !important; color: #fff !important; }
.mic-btn { background: transparent !important; border: 1px solid var(--border) !important;
  color: var(--text) !important; cursor: pointer; position: relative; }
.mic-btn:hover { background: rgba(255,255,255,.08) !important; }
.mic-btn.recording { background: rgba(239,68,68,.15) !important; border-color: #ef4444 !important;
  color: #ef4444 !important; animation: mic-pulse 1.1s ease-in-out infinite; }
@keyframes mic-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.45) } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0) } }
#rec-indicator { display: none; align-items: center; gap: 8px; max-width: 820px; margin: 0 auto 6px;
  padding: 0 24px; font-size: .85rem; color: #ef4444; font-weight: 600; }
#rec-indicator.on { display: flex; }
#rec-indicator .dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: mic-pulse 1s infinite; }
#rec-indicator .bars { display: flex; align-items: center; gap: 2px; height: 14px; }
#rec-indicator .bars i { width: 3px; background: #ef4444; border-radius: 2px; transition: height .08s; height: 4px; }
#mic-status { font-size: .78rem; color: var(--muted); max-width: 820px; margin: 0 auto; padding: 0 24px; min-height: 16px; }

/* the mic recorder's clip lands here; kept in the DOM (so JS can reach its <input>) but off-screen */
#mic-upload { position: absolute !important; left: -9999px !important; width: 1px !important; height: 1px !important;
  overflow: hidden !important; }
#audio-row { max-width: 820px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; gap: 8px; }
#audio-row .audio-container { flex: 1; }
#stop-audio-btn { min-width: 84px !important; height: 34px; border-radius: 10px !important;
  background: rgba(239,68,68,.12) !important; border: 1px solid rgba(239,68,68,.4) !important;
  color: #fca5a5 !important; font-size: .82rem !important; }

@media (max-width: 820px) {
  #sidebar { position: fixed; z-index: 40; left: 0; top: 0; bottom: 0; width: 78vw; max-width: 300px;
    box-shadow: 8px 0 24px rgba(0,0,0,.4); margin-left: -100vw; transition: margin-left .2s ease; }
  #app-root.sidebar-open #sidebar { margin-left: 0; }
  #app-root.sidebar-open::after { content: ""; position: fixed; inset: 0; z-index: 30;
    background: rgba(0,0,0,.45); }
  #mobile-topbar { display: flex !important; align-items: center; gap: 10px; padding: 8px 14px;
    border-bottom: 1px solid var(--border); }
  #mobile-topbar button { background: transparent !important; border: 1px solid var(--border) !important;
    color: var(--text) !important; min-width: 36px; height: 36px; border-radius: 8px !important; }
  #composer-wrap, #audio-row, #status-line, #rec-indicator, #mic-status { padding-left: 12px; padding-right: 12px; }
}
"""


# ── head: fonts + the small amount of client JS ─────────────────────────────

def head(initial_theme: str) -> str:
    theme = "light" if initial_theme == "light" else "dark"
    return f"""
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>document.documentElement.dataset.theme = localStorage.getItem("awaaz-theme") || "{theme}";</script>
<script>{JS}</script>
"""


JS = r"""
(function () {
  // ── dark / light toggle (instant, client-only; the Python side just mirrors it into settings.json) ──
  window.awaazToggleTheme = function () {
    const html = document.documentElement;
    const next = html.dataset.theme === "light" ? "dark" : "light";
    html.dataset.theme = next;
    try { localStorage.setItem("awaaz-theme", next); } catch (e) {}
  };

  // ── mobile sidebar drawer ──
  window.awaazToggleSidebar = function () {
    const root = document.getElementById("app-root");
    if (root) root.classList.toggle("sidebar-open");
  };
  document.addEventListener("click", function (e) {
    const root = document.getElementById("app-root");
    if (!root || !root.classList.contains("sidebar-open")) return;
    const sidebar = document.getElementById("sidebar");
    const topbarBtn = e.target.closest("#mobile-topbar button");
    if (sidebar && !sidebar.contains(e.target) && !topbarBtn) root.classList.remove("sidebar-open");
  });

  // ── push-to-talk mic recorder ──
  // Tap once: start recording (mic button turns red and pulses, a bar-graph level meter animates).
  // Tap again: stop, and the clip is handed to a hidden Gradio File input, which triggers the
  // normal Python turn (transcribe -> respond -> reply -> optional speech), exactly like a typed message.
  const REC = { active: false, stream: null, rec: null, chunks: [], mime: "", ctx: null, analyser: null,
                timer: null, seconds: 0 };

  function pickMime() {
    if (!window.MediaRecorder) return "";
    for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"])
      if (MediaRecorder.isTypeSupported(m)) return m;
    return "";
  }
  function setBars(level) {
    document.querySelectorAll("#rec-indicator .bars i").forEach(function (bar, i) {
      const h = 4 + Math.min(16, level * (140 + i * 30));
      bar.style.height = h + "px";
    });
  }
  function levelLoop() {
    if (!REC.active || !REC.analyser) return;
    const buf = new Float32Array(REC.analyser.fftSize);
    REC.analyser.getFloatTimeDomainData(buf);
    let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    setBars(Math.sqrt(sum / buf.length));
    requestAnimationFrame(levelLoop);
  }
  function setStatus(text) { const el = document.getElementById("mic-status"); if (el) el.textContent = text || ""; }
  function tickTimer() {
    REC.seconds += 1;
    const m = String(Math.floor(REC.seconds / 60)).padStart(2, "0"), s = String(REC.seconds % 60).padStart(2, "0");
    setStatus("Recording " + m + ":" + s + " — tap the mic again to send");
  }

  async function startRecording() {
    try {
      REC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      setStatus("Microphone blocked — allow microphone access for this site, then try again.");
      return;
    }
    REC.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (REC.ctx.state === "suspended") await REC.ctx.resume();
    REC.analyser = REC.ctx.createAnalyser(); REC.analyser.fftSize = 1024;
    REC.ctx.createMediaStreamSource(REC.stream).connect(REC.analyser);
    REC.mime = pickMime(); REC.chunks = [];
    try { REC.rec = new MediaRecorder(REC.stream, REC.mime ? { mimeType: REC.mime } : {}); }
    catch (e) { REC.rec = new MediaRecorder(REC.stream); }
    REC.rec.ondataavailable = function (e) { if (e.data && e.data.size) REC.chunks.push(e.data); };
    REC.rec.start();
    REC.active = true; REC.seconds = 0;
    document.querySelectorAll(".mic-btn").forEach(function (b) { b.classList.add("recording"); });
    const ind = document.getElementById("rec-indicator"); if (ind) ind.classList.add("on");
    setStatus("Recording 00:00 — tap the mic again to send");
    REC.timer = setInterval(tickTimer, 1000);
    levelLoop();
  }

  async function waitFor(fn, ms) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await new Promise(function (r) { setTimeout(r, 80); }); }
    return null;
  }

  async function stopRecording() {
    REC.active = false;
    clearInterval(REC.timer);
    document.querySelectorAll(".mic-btn").forEach(function (b) { b.classList.remove("recording"); });
    const ind = document.getElementById("rec-indicator"); if (ind) ind.classList.remove("on");
    if (!REC.rec) return;
    await new Promise(function (resolve) { REC.rec.onstop = resolve; REC.rec.stop(); });
    if (REC.stream) REC.stream.getTracks().forEach(function (t) { t.stop(); });
    const blob = new Blob(REC.chunks, { type: REC.rec.mimeType || REC.mime });
    if (blob.size < 800) { setStatus("That was too short — try again."); return; }
    setStatus("Sending…");
    const ext = (blob.type || "").includes("mp4") ? "m4a" : (blob.type || "").includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], "voice_" + Date.now() + "." + ext, { type: blob.type });
    const input = await waitFor(function () { return document.querySelector("#mic-upload input[type=file]"); }, 4000);
    if (!input) { setStatus("Could not reach the app — please reload the page."); return; }
    const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  window.awaazMicTap = function () {
    if (REC.active) stopRecording(); else startRecording();
  };
})();
"""


def sidebar_header_html() -> str:
    return """
<div id="sidebar-header">
  <span class="logo">🗣️</span><span class="name">Awaaz</span>
</div>"""


def mobile_topbar_html() -> str:
    return """
<div id="mobile-topbar">
  <button onclick="awaazToggleSidebar()" title="Menu">☰</button>
  <span style="font-weight:600">Awaaz</span>
</div>"""


def welcome_html(language: str = "en") -> str:
    if language == "ne":
        title, sub = "आवाज सहायक", "नमस्ते! रिमाइन्डर, काम, मौसम वा फुटबल बारे सोध्नुहोस् — बोलेर वा लेखेर।"
    else:
        title, sub = "Awaaz", "Hi! Ask about reminders, tasks, weather or football — by voice or by typing."
    return (f"<div style='text-align:center;opacity:.75;padding-top:8vh'>"
           f"<div style='font-size:2.4rem'>🗣️</div><div style='font-size:1.3rem;font-weight:600;margin-top:6px'>"
           f"{html.escape(title)}</div><div style='font-size:.92rem;margin-top:4px;max-width:420px;"
           f"margin-inline:auto'>{html.escape(sub)}</div></div>")


def rec_indicator_html() -> str:
    bars = "".join("<i></i>" for _ in range(5))
    return f'<div id="rec-indicator"><span class="dot"></span><span>Listening…</span><span class="bars">{bars}</span></div>'
