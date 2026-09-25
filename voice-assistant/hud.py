"""Futuristic HUD look for the Gradio UI: theme, CSS, a live-clock script and SVG widgets.

Everything here is presentation only. The widgets are filled with real data by app.py
(reminders, tasks, weather), and the clocks tick in the browser via the script in HUD_HEAD.
"""
from __future__ import annotations

import calendar
import html
import math
from datetime import date

import gradio as gr

CYAN = "#19d3ff"
AMBER = "#ffb13b"
RED = "#ff4d6d"
GREEN = "#39f5b0"


# ── theme ────────────────────────────────────────────────────────────────────

def _both(**values: str) -> dict[str, str]:
    """Use the same value for light and dark mode, so the HUD looks identical everywhere."""
    import inspect
    accepted = set(inspect.signature(gr.themes.Base.set).parameters)
    out = dict(values)
    out.update({f"{k}_dark": v for k, v in values.items() if f"{k}_dark" in accepted})
    return out


THEME = gr.themes.Base(
    primary_hue="cyan", secondary_hue="sky", neutral_hue="slate",
    font=[gr.themes.GoogleFont("Rajdhani"), "ui-sans-serif", "sans-serif"],
    font_mono=[gr.themes.GoogleFont("Share Tech Mono"), "ui-monospace", "monospace"],
).set(**_both(
    body_background_fill="#01070f",
    body_text_color="#c9f3ff",
    body_text_color_subdued="#6fb6cf",
    background_fill_primary="rgba(3, 20, 38, 0.78)",
    background_fill_secondary="rgba(2, 14, 28, 0.85)",
    block_background_fill="rgba(3, 20, 38, 0.62)",
    block_border_color="rgba(25, 211, 255, 0.28)",
    block_border_width="1px",
    block_radius="6px",
    block_label_background_fill="rgba(25, 211, 255, 0.10)",
    block_label_border_color="rgba(25, 211, 255, 0.35)",
    block_label_text_color=CYAN,
    block_title_text_color=CYAN,
    block_shadow="0 0 18px rgba(25, 211, 255, 0.08) inset",
    panel_background_fill="rgba(2, 14, 28, 0.85)",
    panel_border_color="rgba(25, 211, 255, 0.25)",
    border_color_primary="rgba(25, 211, 255, 0.30)",
    border_color_accent=CYAN,
    color_accent=CYAN,
    color_accent_soft="rgba(25, 211, 255, 0.15)",
    input_background_fill="rgba(0, 32, 58, 0.55)",
    input_border_color="rgba(25, 211, 255, 0.35)",
    input_border_color_focus=CYAN,
    input_placeholder_color="#4f8fa6",
    button_primary_background_fill="linear-gradient(90deg, #0a6f9c, #19d3ff)",
    button_primary_background_fill_hover="linear-gradient(90deg, #19d3ff, #7de9ff)",
    button_primary_text_color="#00121f",
    button_primary_border_color=CYAN,
    button_secondary_background_fill="rgba(25, 211, 255, 0.06)",
    button_secondary_background_fill_hover="rgba(25, 211, 255, 0.18)",
    button_secondary_text_color="#c9f3ff",
    button_secondary_border_color="rgba(25, 211, 255, 0.45)",
    button_cancel_background_fill="rgba(255, 77, 109, 0.15)",
    button_cancel_text_color="#ffb3c1",
    table_even_background_fill="rgba(3, 24, 44, 0.8)",
    table_odd_background_fill="rgba(2, 16, 30, 0.8)",
    table_border_color="rgba(25, 211, 255, 0.2)",
    checkbox_background_color="rgba(0, 32, 58, 0.8)",
    checkbox_border_color="rgba(25, 211, 255, 0.5)",
    link_text_color=CYAN,
    code_background_fill="rgba(0, 32, 58, 0.8)",
    slider_color=CYAN,
    loader_color=CYAN,
))


# ── browser-side clock ───────────────────────────────────────────────────────

def head(timezone: str) -> str:
    """Fonts + a tiny script that keeps every [data-hud] element ticking in the user's timezone."""
    tz = html.escape(timezone, quote=True)
    return f"""
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<script>
(function () {{
  const TZ = "{tz}";
  function part(now, opts) {{ return now.toLocaleString("en-GB", Object.assign({{ timeZone: TZ }}, opts)); }}
  function tick() {{
    const now = new Date();
    document.querySelectorAll("[data-hud]").forEach(function (el) {{
      const kind = el.dataset.hud;
      let v;
      if (kind === "hms") v = part(now, {{ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }});
      else if (kind === "hm") v = part(now, {{ hour: "2-digit", minute: "2-digit", hour12: false }});
      else if (kind === "sec") v = part(now, {{ second: "2-digit" }}).padStart(2, "0");
      else if (kind === "weekday") v = part(now, {{ weekday: "long" }});
      else if (kind === "day") v = part(now, {{ day: "2-digit" }});
      else if (kind === "month") v = part(now, {{ month: "long" }});
      else if (kind === "secring") {{
        const s = parseInt(part(now, {{ second: "numeric" }}), 10) || 0;
        el.style.strokeDashoffset = String(el.dataset.len * (1 - s / 60));
        return;
      }}
      if (v !== undefined && el.textContent !== v) el.textContent = v;
    }});
  }}
  setInterval(tick, 1000);
  document.addEventListener("DOMContentLoaded", tick);
}})();
</script>
<script>{HANDS_FREE_JS}</script>
"""


# ── hands-free voice controller (runs in the browser) ────────────────────────
#
# Browsers only allow the microphone and sound after one click on the page, so the user taps
# ACTIVATE once. From then on:  listen → detect speech (adaptive loudness threshold) → record until
# ~1.2 s of silence → hand the clip to the hidden #hf-file upload (same Gradio session, so follow-ups
# work) → play the reply → listen again. Listening pauses while a reply plays so it can't hear itself.
# All replies go through ONE audio element unlocked by the ACTIVATE tap (needed for Safari).

HANDS_FREE_JS = r"""
(function () {
  const SILENCE_MS = 1200, MIN_SPEECH_MS = 450, MAX_SPEECH_MS = 20000, IDLE_RESTART_MS = 8000;
  const S = { active: false, listening: false, state: "off", player: null, pending: null, autoplayed: false,
              stream: null, ctx: null, analyser: null, rec: null, chunks: [], mime: "", recStart: 0,
              floor: 0.01, loud: 0, speechStart: 0, lastVoice: 0, lastToken: null, busyTimer: null, restarting: false };
  const $ = (id) => document.getElementById(id);
  const LABEL = { listening: "LISTENING", hearing: "HEARING YOU", busy: "PROCESSING", speaking: "SPEAKING" };

  function setStatus(text, mode) {
    const el = $("awaaz-hf-status"); if (el) el.textContent = text;
    const core = document.querySelector(".hud-core");
    if (core) ["listening", "hearing", "speaking"].forEach((m) => core.classList.toggle(m, m === mode));
    const cs = $("core-status"); if (cs && LABEL[mode]) cs.textContent = LABEL[mode];
  }
  function pickMime() {
    if (!window.MediaRecorder) return "";
    for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"])
      if (MediaRecorder.isTypeSupported(m)) return m;
    return "";
  }
  function waitFor(fn, ms) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      (function poll() { const v = fn(); if (v || Date.now() - t0 > ms) resolve(v); else setTimeout(poll, 100); })();
    });
  }

  // ── recording ──────────────────────────────────────────────
  function startRecorder() {
    if (!S.stream) return;
    S.chunks = [];
    try { S.rec = new MediaRecorder(S.stream, S.mime ? { mimeType: S.mime } : {}); }
    catch (e) { S.rec = new MediaRecorder(S.stream); }
    S.rec.ondataavailable = (e) => { if (e.data && e.data.size) S.chunks.push(e.data); };
    S.rec.start(); S.recStart = performance.now();
  }
  function stopRecorder(discard) {
    return new Promise((resolve) => {
      const rec = S.rec; S.rec = null;
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = () => resolve(discard ? null : new Blob(S.chunks, { type: rec.mimeType || S.mime }));
      rec.stop();
    });
  }
  function goIdle() {
    clearTimeout(S.busyTimer);
    if (!S.active || !S.listening) { S.state = "off"; return; }
    S.state = "idle"; S.loud = 0;
    stopRecorder(true).then(() => { if (S.state === "idle") startRecorder(); });
    setStatus("Listening… just speak (नेपाली or English)", "listening");
  }
  async function sendBlob(blob) {
    const ext = (blob.type || S.mime).includes("mp4") ? "m4a" : (blob.type || S.mime).includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], "utterance_" + Date.now() + "." + ext, { type: blob.type || S.mime });
    const input = await waitFor(() => document.querySelector("#hf-file input[type=file]"), 5000);
    if (!input) { setStatus("Could not pass the recording to the app — reload the page.", null); return goIdle(); }
    const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    S.state = "busy"; setStatus("Thinking…", "busy");
    S.busyTimer = setTimeout(() => { if (S.state === "busy") goIdle(); }, 90000);
  }
  function finishUtterance() {
    S.state = "sending";
    const spoke = S.lastVoice - S.speechStart;
    stopRecorder(false).then((blob) => {
      if (!blob || spoke < MIN_SPEECH_MS || blob.size < 1500) return goIdle();
      sendBlob(blob);
    });
  }

  // ── voice activity detection loop (every 50 ms) ────────────
  function loop() {
    if (!S.analyser) return;
    const buf = new Float32Array(S.analyser.fftSize);
    S.analyser.getFloatTimeDomainData(buf);
    let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length), now = performance.now();
    const lvl = $("awaaz-level"); if (lvl) lvl.style.width = Math.min(100, rms * 900) + "%";
    const core = document.querySelector(".hud-core"); if (core) core.style.setProperty("--lvl", Math.min(1, rms * 12).toFixed(3));
    const thr = Math.max(0.012, S.floor * 2.8);
    if (S.state === "idle") {
      if (rms > thr) {
        if (++S.loud >= 3) { S.state = "hearing"; S.speechStart = now - 150; S.lastVoice = now; setStatus("Hearing you…", "hearing"); }
      } else {
        S.loud = 0; S.floor = S.floor * 0.97 + rms * 0.03;   // adapt to the room's background noise
        if (now - S.recStart > IDLE_RESTART_MS && !S.restarting) {   // keep recordings short while nobody speaks
          S.restarting = true;
          stopRecorder(true).then(() => { S.restarting = false; if (S.state === "idle") startRecorder(); });
        }
      }
    } else if (S.state === "hearing") {
      if (rms > thr * 0.8) S.lastVoice = now;
      if (now - S.lastVoice > SILENCE_MS || now - S.speechStart > MAX_SPEECH_MS) finishUtterance();
    }
  }

  // ── replies from the server (#awaaz-speaker) ───────────────
  function play(src) {
    S.state = "speaking"; stopRecorder(true);
    setStatus("Speaking…", "speaking");
    S.player.onended = () => goIdle();
    S.player.src = src;
    S.player.play().catch(() => goIdle());
  }
  function onReply(src) {
    clearTimeout(S.busyTimer);
    if (!S.active) {                         // not activated yet: keep it, and try (the browser may allow autoplay)
      if (!src) return;
      S.pending = src; S.autoplayed = false;
      const a = new Audio(src);
      a.play().then(() => { S.autoplayed = true; }).catch(() => {});
      return;
    }
    if (src) play(src); else goIdle();
  }
  new MutationObserver(() => {
    const el = document.querySelector("#awaaz-speaker .awaaz-say");
    if (!el || el.dataset.token === S.lastToken) return;
    S.lastToken = el.dataset.token;
    onReply(el.dataset.src || "");
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ── activation (needs one tap) ─────────────────────────────
  async function activate() {
    if (S.active) return;
    // Unlock audio synchronously inside the tap (Safari requires this), then set up the microphone.
    S.player = new Audio();
    const first = S.pending && !S.autoplayed ? S.pending : null;
    S.player.src = first || "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
    S.player.play().catch(() => {});
    S.state = first ? "speaking" : "off";
    if (first) { setStatus("Reading your daily briefing…", "speaking"); S.player.onended = () => goIdle(); }
    try {
      S.stream = await navigator.mediaDevices.getUserMedia(
        { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      setStatus("Microphone blocked — allow microphone access for this site, then reload.", null); return;
    }
    S.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (S.ctx.state === "suspended") await S.ctx.resume();
    S.analyser = S.ctx.createAnalyser(); S.analyser.fftSize = 2048;
    S.ctx.createMediaStreamSource(S.stream).connect(S.analyser);
    S.mime = pickMime(); S.active = true; S.listening = true;
    const act = $("awaaz-activate"), tog = $("awaaz-toggle");
    if (act) act.style.display = "none"; if (tog) tog.style.display = "";
    setInterval(loop, 50);
    if (S.state !== "speaking") goIdle();
  }
  function toggle() {
    S.listening = !S.listening;
    const tog = $("awaaz-toggle");
    if (S.listening) { if (tog) tog.textContent = "⏸ PAUSE LISTENING"; goIdle(); }
    else { S.state = "off"; stopRecorder(true); if (tog) tog.textContent = "▶ RESUME LISTENING";
           setStatus("Hands-free paused.", null); }
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#awaaz-activate")) activate();
    else if (e.target.closest("#awaaz-toggle")) toggle();
  });
})();
"""


def control_panel() -> str:
    """Static controls for the hands-free mode (the script above drives them)."""
    return """
<div class="awaaz-control">
  <button id="awaaz-activate" class="awaaz-btn">⏻ ACTIVATE AWAAZ</button>
  <button id="awaaz-toggle" class="awaaz-btn ghost" style="display:none">⏸ PAUSE LISTENING</button>
  <div class="awaaz-meter"><i id="awaaz-level"></i></div>
  <div id="awaaz-hf-status" class="hf-status">Tap ACTIVATE once — Awaaz reads your daily briefing, then listens hands-free.</div>
</div>"""


# ── CSS ──────────────────────────────────────────────────────────────────────

CSS = """
body, gradio-app { background: #01070f !important; }
body::before {  /* blueprint grid + vignette */
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse at 50% 35%, rgba(25,211,255,.10), transparent 60%),
    linear-gradient(rgba(25,211,255,.045) 1px, transparent 1px) 0 0 / 32px 32px,
    linear-gradient(90deg, rgba(25,211,255,.045) 1px, transparent 1px) 0 0 / 32px 32px;
}
.gradio-container { max-width: 1480px !important; margin: auto; background: transparent !important;
  font-family: 'Rajdhani', sans-serif !important; font-size: 16px; position: relative; z-index: 1; }
footer { display: none !important; }
h1, h2, h3, h4 { font-family: 'Orbitron', sans-serif !important; letter-spacing: .08em; color: #19d3ff !important;
  text-transform: uppercase; font-size: .95rem !important; }
.prose, .prose p, .prose li { color: #c9f3ff; }
.prose table { font-family: 'Share Tech Mono', monospace; }

/* ── top ruler & title ─────────────────────────────── */
.hud-ruler { display: flex; justify-content: space-between; font: 12px 'Share Tech Mono', monospace; color: #3f86a0;
  border-bottom: 1px solid rgba(25,211,255,.35); padding: 4px 2px 3px; position: relative; }
.hud-ruler span { flex: 1; text-align: center; position: relative; }
.hud-ruler span::after { content: ""; position: absolute; left: 50%; bottom: -4px; width: 1px; height: 5px; background: rgba(25,211,255,.5); }
.hud-ruler span.past { color: #7cc8e0; }
.hud-ruler span.today { color: #01070f; background: #19d3ff; border-radius: 2px; box-shadow: 0 0 12px #19d3ff; font-weight: 700; }
.hud-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 4px 4px; flex-wrap: wrap; }
.hud-title .brand { font: 900 30px 'Orbitron', sans-serif; letter-spacing: .28em; color: #19d3ff;
  text-shadow: 0 0 6px #19d3ff, 0 0 24px rgba(25,211,255,.6); }
.hud-title .brand small { font: 500 12px 'Share Tech Mono', monospace; letter-spacing: .2em; color: #6fb6cf;
  display: block; text-shadow: none; }
.hud-title .corp { font: 700 15px 'Orbitron', sans-serif; letter-spacing: .25em; color: #7de9ff; font-style: italic;
  border-bottom: 2px solid #19d3ff; padding-bottom: 2px; }
.hud-title .status { font: 13px 'Share Tech Mono', monospace; color: #39f5b0; }
.hud-title .status b { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #39f5b0;
  box-shadow: 0 0 8px #39f5b0; margin-right: 6px; animation: hud-blink 1.6s infinite; }

/* ── panels ─────────────────────────────────────────── */
.hud-panel { position: relative; border: 1px solid rgba(25,211,255,.35); border-radius: 4px; padding: 12px 14px 10px;
  background: linear-gradient(180deg, rgba(4,26,48,.75), rgba(2,12,24,.75)); margin-bottom: 10px;
  box-shadow: 0 0 22px rgba(25,211,255,.08) inset; clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)); }
.hud-panel::before { content: attr(data-title); display: block; font: 700 11px 'Orbitron', sans-serif; letter-spacing: .22em;
  color: #19d3ff; margin-bottom: 8px; border-bottom: 1px solid rgba(25,211,255,.25); padding-bottom: 5px; }
.hud-row { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(40px, 1fr) 34px; align-items: center; gap: 8px;
  font: 12px 'Share Tech Mono', monospace; color: #a8e6f7; margin: 6px 0; white-space: nowrap; }
.hud-row > span:first-child { overflow: hidden; text-overflow: ellipsis; }
.hud-row .v { text-align: right; color: #7de9ff; }
.hud-bar { height: 6px; background: rgba(25,211,255,.12); border: 1px solid rgba(25,211,255,.25); }
.hud-bar i { display: block; height: 100%; background: linear-gradient(90deg, #0a6f9c, #19d3ff); box-shadow: 0 0 8px #19d3ff; }
.hud-bar.warn i { background: linear-gradient(90deg, #8a4b00, #ffb13b); box-shadow: 0 0 8px #ffb13b; }
.hud-list { list-style: none; margin: 0; padding: 0; font: 14px 'Rajdhani', sans-serif; }
.hud-list li { padding: 5px 0 5px 12px; border-left: 2px solid rgba(25,211,255,.4); margin-bottom: 5px; color: #c9f3ff; }
.hud-list li small { display: block; font: 12px 'Share Tech Mono', monospace; color: #6fb6cf; }
.hud-list li.empty { border-color: transparent; color: #4f8fa6; font-style: italic; }
.hud-center-svg { display: flex; justify-content: center; }
.hud-widget { display: flex; justify-content: center; }
.hud-widget svg text, .hud-core svg text { font-family: 'Orbitron', sans-serif; }
.gauge-caption { text-align: center; font: 12px 'Share Tech Mono', monospace; color: #8fd7ee; line-height: 1.5; margin-top: -4px; }
.gauge-caption div:first-child { color: #19d3ff; letter-spacing: .12em; }
.core-sub { text-align: center; font: 14px 'Rajdhani', sans-serif; color: #6fb6cf; letter-spacing: .06em; margin-top: -6px; }

/* ── rotating rings ─────────────────────────────────── */
.spin { transform-box: fill-box; transform-origin: center; animation: hud-spin 24s linear infinite; }
.spin.rev { animation-direction: reverse; animation-duration: 36s; }
.spin.fast { animation-duration: 9s; }
.hud-core.busy .spin { animation-duration: 3s; }
.hud-core.busy .spin.rev { animation-duration: 5s; }
.hud-core.busy .core-glow { animation: hud-pulse .8s ease-in-out infinite; }
.core-glow { animation: hud-pulse 3.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes hud-spin { to { transform: rotate(360deg); } }
@keyframes hud-pulse { 50% { opacity: .55; transform: scale(.94); } }
@keyframes hud-blink { 50% { opacity: .25; } }

/* ── hands-free controls & listening states ───────────── */
.awaaz-control { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: -4px 0 8px; }
.awaaz-btn { font: 700 14px 'Orbitron', sans-serif; letter-spacing: .18em; color: #01070f; cursor: pointer;
  background: linear-gradient(90deg, #0a6f9c, #19d3ff); border: 1px solid #19d3ff; padding: 12px 28px;
  clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%); box-shadow: 0 0 22px rgba(25,211,255,.6);
  animation: awaaz-glow 2.2s ease-in-out infinite; }
@keyframes awaaz-glow { 50% { box-shadow: 0 0 6px rgba(25,211,255,.3); filter: brightness(1.15); } }
.awaaz-btn.ghost { background: rgba(25,211,255,.08); color: #19d3ff; animation: none; }
.awaaz-meter { width: min(320px, 80%); height: 4px; background: rgba(25,211,255,.12); }
.awaaz-meter i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #19d3ff, #39f5b0);
  box-shadow: 0 0 8px #39f5b0; transition: width .05s linear; }
.hf-status { font: 13px 'Share Tech Mono', monospace; color: #7de9ff; text-align: center; min-height: 18px; }
.hud-core .core-glow { transform: scale(calc(1 + var(--lvl, 0) * .6)); }
.hud-core.listening circle[stroke] { stroke: #19d3ff; }
.hud-core.hearing .spin { animation-duration: 2.5s; }
.hud-core.hearing circle, .hud-core.hearing path, .hud-core.hearing line { stroke: #39f5b0 !important; }
.hud-core.hearing #core-status { fill: #39f5b0; }
.hud-core.speaking .spin { animation-duration: 6s; }
.hud-core.speaking circle, .hud-core.speaking path, .hud-core.speaking line { stroke: #7de9ff !important; }
#hf-hidden { position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important;
  overflow: hidden !important; }
#awaaz-speaker { display: none; }

/* ── reminder alert ─────────────────────────────────── */
.due-banner { border: 1px solid #ffb13b; background: rgba(255,177,59,.12); color: #ffd79a; padding: 10px 16px;
  font-family: 'Share Tech Mono', monospace; box-shadow: 0 0 24px rgba(255,177,59,.35); animation: hud-alert 1s ease-in-out 3; }
.due-banner b { color: #ffb13b; font-family: 'Orbitron', sans-serif; letter-spacing: .12em; }
.due-banner ul { margin: 6px 0 0 18px; } .due-banner span { opacity: .8; }
@keyframes hud-alert { 50% { box-shadow: 0 0 4px rgba(255,177,59,.2); } }

/* ── tabs, chat, inputs ─────────────────────────────── */
.hud-tabs > div[role=tablist], .hud-tabs .tab-wrapper { border-bottom: 1px solid rgba(25,211,255,.35) !important; }
.hud-tabs button[role=tab] { font: 700 11px 'Orbitron', sans-serif !important; letter-spacing: .06em; padding: 8px 10px !important; color: #6fb6cf !important;
  text-transform: uppercase; }
.hud-tabs button[role=tab][aria-selected=true] { color: #19d3ff !important; text-shadow: 0 0 10px #19d3ff; }
.message-wrap .message, .message-row .message { font-family: 'Rajdhani', sans-serif; font-size: 16px; }
.message.user, .user .message { border: 1px solid rgba(25,211,255,.6) !important; background: rgba(25,211,255,.10) !important; }
.message.bot, .bot .message { border: 1px solid rgba(25,211,255,.22) !important; background: rgba(3,22,40,.85) !important; }
textarea, input { font-family: 'Rajdhani', sans-serif !important; font-size: 16px !important; }
button.primary { font-family: 'Orbitron', sans-serif !important; letter-spacing: .12em; text-transform: uppercase;
  box-shadow: 0 0 16px rgba(25,211,255,.45); }
button.secondary { font-family: 'Rajdhani', sans-serif !important; font-weight: 600; letter-spacing: .04em; }

/* ── monthly progress card (task tab) ───────────────── */
.progress-card { border: 1px solid rgba(25,211,255,.35); padding: 12px 14px; background: rgba(3,22,40,.7); }
.progress-top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px;
  font: 14px 'Share Tech Mono', monospace; color: #a8e6f7; }
.bar { height: 10px; background: rgba(25,211,255,.12); border: 1px solid rgba(25,211,255,.3); margin-top: 8px; }
.bar > div { height: 100%; background: linear-gradient(90deg, #0a6f9c, #19d3ff); box-shadow: 0 0 10px #19d3ff; transition: width .4s; }
.pct { text-align: right; font: 700 14px 'Orbitron', sans-serif; color: #19d3ff; margin-top: 4px; }
.note { font-size: .92rem; color: #6fb6cf; }

/* ── circular dock ──────────────────────────────────── */
.hud-dock { justify-content: center !important; gap: 26px !important; padding: 18px 0 8px; flex-wrap: wrap;
  border-top: 1px solid rgba(25,211,255,.25); margin-top: 8px; }
.hud-dock button.dock-btn { width: 92px !important; min-width: 92px !important; max-width: 92px; height: 92px; flex: 0 0 92px !important;
  border-radius: 50% !important; border: 2px solid #19d3ff !important; background:
  radial-gradient(circle, rgba(25,211,255,.22) 0 38%, rgba(1,7,15,.95) 40% 58%, rgba(25,211,255,.18) 60% 64%, rgba(1,7,15,.95) 66%) !important;
  box-shadow: 0 0 14px rgba(25,211,255,.55), inset 0 0 14px rgba(25,211,255,.35) !important;
  color: #c9f3ff !important; font: 700 10px 'Orbitron', sans-serif !important; letter-spacing: .1em; line-height: 1.5;
  white-space: pre-line; padding: 0 !important; transition: transform .2s, box-shadow .2s; }
.hud-dock button.dock-btn:hover { transform: translateY(-4px) scale(1.05);
  box-shadow: 0 0 28px #19d3ff, inset 0 0 18px rgba(25,211,255,.6) !important; }

@media (max-width: 900px) {
  .hud-title .brand { font-size: 22px; letter-spacing: .18em; }
  .hud-ruler { font-size: 9px; }
  .hud-dock { gap: 12px !important; }
  .hud-dock button.dock-btn { width: 70px !important; min-width: 70px !important; height: 70px; flex-basis: 70px !important; font-size: 8px !important; }
}
"""


# ── widgets (plain HTML/SVG strings) ─────────────────────────────────────────

def _esc(value) -> str:
    return html.escape(str(value))


def _arc(cx: float, cy: float, r: float, start_deg: float, end_deg: float) -> str:
    """SVG path for a circular arc (degrees, 0 = 12 o'clock, clockwise)."""
    end_deg = min(end_deg, start_deg + 359.99)
    a0, a1 = math.radians(start_deg - 90), math.radians(end_deg - 90)
    x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
    x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
    large = 1 if end_deg - start_deg > 180 else 0
    return f"M{x0:.2f},{y0:.2f} A{r},{r} 0 {large} 1 {x1:.2f},{y1:.2f}"


def ruler(today: date) -> str:
    days = calendar.monthrange(today.year, today.month)[1]
    cells = "".join(
        f'<span class="{"today" if d == today.day else "past" if d < today.day else ""}">{d:02d}</span>'
        for d in range(1, days + 1))
    return f'<div class="hud-ruler">{cells}</div>'


def title_bar(timezone: str) -> str:
    return f"""
<div class="hud-title">
  <div class="brand">AWAAZ<small>BILINGUAL VOICE ASSISTANT · नेपाली / ENGLISH</small></div>
  <div class="status"><b></b>ALL SYSTEMS ONLINE · {_esc(timezone)} · <span data-hud="hms">--:--:--</span></div>
  <div class="corp">AWAAZ SYSTEMS</div>
</div>"""


def date_ring(today: date) -> str:
    """Left-hand calendar dial: weekday, live clock, month and big day number."""
    days = calendar.monthrange(today.year, today.month)[1]
    frac = today.day / days
    return f"""
<div class="hud-widget"><svg viewBox="0 0 220 220" width="100%" style="max-width:230px">
  <circle cx="110" cy="110" r="104" fill="none" stroke="rgba(25,211,255,.18)" stroke-width="1"/>
  <circle class="spin rev" cx="110" cy="110" r="104" fill="none" stroke="#19d3ff" stroke-width="2" stroke-dasharray="3 9"/>
  <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(25,211,255,.15)" stroke-width="10"/>
  <path d="{_arc(110, 110, 92, 0, 360 * frac)}" fill="none" stroke="#19d3ff" stroke-width="10"
        style="filter:drop-shadow(0 0 6px #19d3ff)"/>
  <circle cx="110" cy="110" r="78" fill="none" stroke="rgba(25,211,255,.35)" stroke-width="1"/>
  <circle data-hud="secring" data-len="{2 * math.pi * 72:.1f}" cx="110" cy="110" r="72" fill="none" stroke="#7de9ff"
          stroke-width="2" stroke-dasharray="{2 * math.pi * 72:.1f}" transform="rotate(-90 110 110)"/>
  <text x="110" y="70" text-anchor="middle" fill="#6fb6cf" font-size="11" letter-spacing="2" data-hud="weekday">
    {today:%A}</text>
  <text x="110" y="92" text-anchor="middle" fill="#7de9ff" font-size="14" data-hud="hm">--:--</text>
  <text x="110" y="115" text-anchor="middle" fill="#19d3ff" font-size="13" letter-spacing="3" data-hud="month">
    {today:%B}</text>
  <text x="110" y="152" text-anchor="middle" fill="#e6fbff" font-size="42" font-weight="900"
        style="filter:drop-shadow(0 0 8px #19d3ff)" data-hud="day">{today:%d}</text>
  <text x="110" y="170" text-anchor="middle" fill="#3f86a0" font-size="7" letter-spacing="2">DAY {today.day} / {days}</text>
</svg></div>"""


def core(status: str = "ONLINE", sub: str = "Say नमस्ते or ask me anything", busy: bool = False) -> str:
    """The animated central reactor. `busy` speeds up the rings and turns them amber."""
    color = AMBER if busy else CYAN
    ticks = "".join(
        f'<line x1="170" y1="{24 if i % 5 == 0 else 30}" x2="170" y2="36" stroke="{color}" '
        f'stroke-width="{2 if i % 5 == 0 else 1}" transform="rotate({i * 6} 170 170)" opacity=".8"/>'
        for i in range(60))
    segments = "".join(
        f'<path d="{_arc(170, 170, 118, a, a + 38)}" fill="none" stroke="{color}" stroke-width="6" opacity=".85"/>'
        for a in (10, 100, 190, 280))
    return f"""
<div class="hud-center-svg hud-core {'busy' if busy else ''}"><svg viewBox="0 0 340 340" width="100%" style="max-width:340px">
  <defs>
    <radialGradient id="coreGlow"><stop offset="0%" stop-color="#e6fbff"/><stop offset="35%" stop-color="{color}"/>
      <stop offset="100%" stop-color="rgba(25,211,255,0)"/></radialGradient>
  </defs>
  <circle cx="170" cy="170" r="160" fill="none" stroke="rgba(25,211,255,.18)" stroke-width="1"/>
  <g class="spin">{ticks}</g>
  <circle class="spin rev" cx="170" cy="170" r="146" fill="none" stroke="{color}" stroke-width="1.5"
          stroke-dasharray="60 14 6 14" opacity=".7"/>
  <g class="spin fast">{segments}</g>
  <circle cx="170" cy="170" r="104" fill="rgba(1,10,20,.85)" stroke="{color}" stroke-width="1" opacity=".9"/>
  <circle class="spin rev" cx="170" cy="170" r="92" fill="none" stroke="{color}" stroke-width="10"
          stroke-dasharray="2 5" opacity=".35"/>
  <circle class="core-glow" cx="170" cy="170" r="58" fill="url(#coreGlow)" opacity=".35"/>
  <circle cx="170" cy="170" r="62" fill="none" stroke="{color}" stroke-width="2"
          style="filter:drop-shadow(0 0 8px {color})"/>
  <text x="170" y="160" text-anchor="middle" fill="#e6fbff" font-size="30" font-weight="700"
        style="filter:drop-shadow(0 0 6px {color})" data-hud="hm">--:--</text>
  <text id="core-status" x="170" y="186" text-anchor="middle" fill="{color}" font-size="13" letter-spacing="4">{_esc(status)}</text>
</svg></div><div class="core-sub">{_esc(sub)}</div>"""


def system_panel(rows: list[tuple[str, float, str, bool]]) -> str:
    """rows = [(label, fraction 0-1, value text, warning?)]"""
    body = "".join(
        f'<div class="hud-row"><span>{_esc(label)}</span>'
        f'<div class="hud-bar {"warn" if warn else ""}"><i style="width:{max(0, min(1, frac)) * 100:.0f}%"></i></div>'
        f'<span class="v">{_esc(value)}</span></div>'
        for label, frac, value, warn in rows)
    return f'<div class="hud-panel" data-title="SYSTEM">{body}</div>'


def list_panel(title: str, items: list[tuple[str, str]], empty: str) -> str:
    lis = "".join(f"<li>{_esc(main)}<small>{_esc(sub)}</small></li>" for main, sub in items) \
        or f'<li class="empty">{_esc(empty)}</li>'
    return f'<div class="hud-panel" data-title="{_esc(title)}"><ul class="hud-list">{lis}</ul></div>'


def gauge(title: str, value_text: str, fraction: float, lines: list[str], unit: str = "",
          color: str = CYAN) -> str:
    """Round gauge used for weather (temperature) and monthly task progress."""
    frac = max(0.0, min(1.0, fraction))
    caption = "".join(f"<div>{_esc(line)}</div>" for line in lines[:3])
    return f"""
<div class="hud-panel" data-title="{_esc(title)}"><div class="hud-widget"><svg viewBox="0 0 220 200" width="100%" style="max-width:210px">
  <circle class="spin rev" cx="110" cy="100" r="92" fill="none" stroke="{color}" stroke-width="1.5" stroke-dasharray="4 8" opacity=".6"/>
  <path d="{_arc(110, 100, 78, 0, 300)}" fill="none" stroke="rgba(25,211,255,.15)" stroke-width="12" transform="rotate(-150 110 100)"/>
  <path d="{_arc(110, 100, 78, 0, max(1.0, 300 * frac))}" fill="none" stroke="{color}" stroke-width="12"
        transform="rotate(-150 110 100)" style="filter:drop-shadow(0 0 6px {color})"/>
  <circle cx="110" cy="100" r="62" fill="rgba(1,10,20,.8)" stroke="{color}" stroke-width="1" opacity=".8"/>
  <text x="110" y="114" text-anchor="middle" fill="#e6fbff" font-size="38" font-weight="900"
        style="filter:drop-shadow(0 0 6px {color})">{_esc(value_text)}<tspan font-size="15" fill="{color}">{_esc(unit)}</tspan></text>
</svg></div><div class="gauge-caption">{caption}</div></div>"""


def alert_banner(items: list[tuple[str, str]], chime_tag: str = "") -> str:
    lis = "".join(f"<li>{_esc(title)} <span>· due {_esc(when)}</span></li>" for title, when in items)
    plural = "S" if len(items) > 1 else ""
    return f'<div class="due-banner">⚠ <b>REMINDER{plural} DUE</b><ul>{lis}</ul></div>{chime_tag}'


def weather_gauge(report, city: str, error: str | None = None) -> str:
    if report is None:
        return gauge("WEATHER", "--", 0, [city.upper(), (error or "NO DATA")[:28]], color="#3f86a0")
    from services.weather import describe_code
    temp = report.temperature
    rain = "RAIN NOW: YES" if report.raining_now else "RAIN NOW: NO"
    return gauge(
        "WEATHER", f"{temp:.0f}", (temp + 10) / 50, [
            report.location.name.upper(), describe_code(report.weather_code).upper()[:24],
            f"{rain} · WIND {report.wind_speed:.0f} KM/H"],
        unit="°C", color=AMBER if temp >= 30 else CYAN)

