# Original single-file version, kept unchanged for comparison. The maintained app is ../app.py.
import os, json, time, requests, wave
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types
from groq import Groq
import gradio as gr

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
NEWS_API_KEY = os.environ["NEWS_API_KEY"]
FOOTBALL_DATA_KEY = os.environ["FOOTBALL_DATA_KEY"]
FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"

def generate_with_retry(model, contents, max_retries=4, **kwargs):
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(model=model, contents=contents, **kwargs)
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                raise
            if "503" in str(e) or "UNAVAILABLE" in str(e):
                time.sleep(2 ** attempt)
            else:
                raise
    raise RuntimeError("Gemini API still unavailable after retries")

def transcribe_file(audio_path, model="whisper-large-v3"):
    with open(audio_path, "rb") as audio_file:
        transcription = groq_client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), audio_file.read()),
            model=model,
            response_format="verbose_json",
            temperature=0.0,
            prompt="Conversational question about the weather or football news, in Nepali (Devanagari script) or English.",
        )
    return transcription.text.strip()

def save_wave_file(filename, pcm_data, channels=1, rate=24000, sample_width=2):
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels); wf.setsampwidth(sample_width); wf.setframerate(rate)
        wf.writeframes(pcm_data)

def text_to_speech(text, out_path="output.wav", voice="Kore", model="gemini-2.5-flash-preview-tts"):
    response = generate_with_retry(
        model=model, contents=text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice))),
        ),
    )
    pcm_data = response.candidates[0].content.parts[0].inline_data.data
    save_wave_file(out_path, pcm_data)
    return out_path

WEATHER_CODES = {
    0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "fog", 48: "depositing rime fog", 51: "light drizzle", 53: "moderate drizzle",
    55: "dense drizzle", 61: "slight rain", 63: "moderate rain", 65: "heavy rain",
    71: "slight snow", 73: "moderate snow", 75: "heavy snow", 80: "rain showers",
    81: "moderate rain showers", 82: "violent rain showers", 95: "thunderstorm",
    96: "thunderstorm with hail", 99: "thunderstorm with heavy hail",
}

def get_weather(city):
    geo = requests.get("https://geocoding-api.open-meteo.com/v1/search", params={"name": city, "count": 1}).json()
    results = geo.get("results")
    if not results:
        return f"I couldn't find a place called '{city}'."
    loc = results[0]
    weather = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={"latitude": loc["latitude"], "longitude": loc["longitude"], "current_weather": True},
    ).json()
    cw = weather["current_weather"]
    condition = WEATHER_CODES.get(cw["weathercode"], "unknown conditions")
    return f"In {loc['name']}, it's currently {cw['temperature']}°C with {condition} and wind speed {cw['windspeed']} km/h."

LEAGUE_CODES = {
    "premier league": "PL", "epl": "PL", "la liga": "PD", "laliga": "PD",
    "bundesliga": "BL1", "serie a": "SA", "ligue 1": "FL1",
    "champions league": "CL", "ucl": "CL",
}

def _fd_get(path, params=None):
    resp = requests.get(f"{FOOTBALL_DATA_BASE}{path}", headers={"X-Auth-Token": FOOTBALL_DATA_KEY}, params=params or {})
    resp.raise_for_status()
    return resp.json()

def get_league_table(league_name):
    code = LEAGUE_CODES.get(league_name.lower())
    if not code:
        return f"I don't have table data for '{league_name}'."
    table = _fd_get(f"/competitions/{code}/standings")["standings"][0]["table"]
    return "\n".join(
        f"{r['position']}. {r['team']['name']} - {r['points']} pts (P{r['playedGames']} W{r['won']} D{r['draw']} L{r['lost']})"
        for r in table[:10]
    )

def get_league_recent_results(league_name):
    code = LEAGUE_CODES.get(league_name.lower())
    if not code:
        return f"I don't have results data for '{league_name}'."
    matches = _fd_get(f"/competitions/{code}/matches", params={"status": "FINISHED"})["matches"]
    recent = sorted(matches, key=lambda m: m["utcDate"])[-10:]
    return "\n".join(
        f"{m['homeTeam']['name']} {m['score']['fullTime']['home']} - {m['score']['fullTime']['away']} {m['awayTeam']['name']}"
        for m in recent
    )

def fetch_football_articles(query, count=5):
    resp = requests.get(
        "https://newsapi.org/v2/everything",
        params={"q": f'({query}) AND soccer NOT NFL NOT "college football"',
                "language": "en", "sortBy": "publishedAt", "pageSize": count, "apiKey": NEWS_API_KEY},
    )
    resp.raise_for_status()
    articles = resp.json().get("articles", [])
    return "\n\n".join(f"{a['title']}: {a['description'] or ''}" for a in articles)

def get_football_news_summary(topic=None, language="English"):
    query = topic if topic else "football OR soccer"
    article_text = fetch_football_articles(query)
    if not article_text.strip():
        return f"I couldn't find any recent football news{' about ' + topic if topic else ''}."
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": (
            f"Based on these news articles, write a natural spoken-style summary in {language} "
            f"of the football news{' about ' + topic if topic else ''}. Only use info actually present. "
            f"4-6 sentences.\n\nArticles:\n{article_text}"
        )}],
    )
    return response.choices[0].message.content.strip()

def classify_intent(text):
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": (
            "Classify this message. Respond with ONLY valid JSON:\n"
            '{"intent": "greeting"|"weather"|"news_summary"|"out_of_scope", '
            '"city": "<city or null>", '
            '"news_type": "league_table"|"league_results"|"general_news"|null, '
            '"team": "<team or null>", "league": "<league or null>"}\n\n'
            f'Message: "{text}"'
        )}],
    )
    raw = response.choices[0].message.content.strip().strip("`").replace("json", "", 1).strip()
    return json.loads(raw)

def handle_greeting(text):
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": f'Reply to this greeting warmly in 1-2 short sentences, in the same language it was written in.\n\nMessage: "{text}"'}],
    )
    return response.choices[0].message.content.strip()

def handle_weather(city):
    return get_weather(city) if city else "Which city would you like the weather for?"

def handle_news_summary(intent):
    news_type = intent.get("news_type")
    if news_type == "league_table" and intent.get("league"):
        return f"Here's the {intent['league'].title()} table:\n{get_league_table(intent['league'])}"
    elif news_type == "league_results" and intent.get("league"):
        return f"Recent results:\n{get_league_recent_results(intent['league'])}"
    else:
        return get_football_news_summary(topic=intent.get("team") or intent.get("league"))

def handle_out_of_scope():
    return "Sorry, I can only help with greetings, weather, and football news right now."

def assistant_respond(text):
    intent = classify_intent(text)
    if intent["intent"] == "greeting":
        return handle_greeting(text)
    elif intent["intent"] == "weather":
        return handle_weather(intent.get("city"))
    elif intent["intent"] == "news_summary":
        return handle_news_summary(intent)
    else:
        return handle_out_of_scope()

def voice_pipeline(audio_path):
    if audio_path is None:
        return "No audio recorded.", "", None
    question = transcribe_file(audio_path)
    answer = assistant_respond(question)
    reply_audio = text_to_speech(answer)
    return question, answer, reply_audio

with gr.Blocks(title="Nepali/English Voice Assistant") as demo:
    gr.Markdown("# 🎙️ Voice Assistant\nAsk about the weather or football news, in Nepali or English.")
    mic = gr.Audio(sources=["microphone"], type="filepath", label="Speak here")
    btn = gr.Button("Ask")
    transcript_box = gr.Textbox(label="You said")
    answer_box = gr.Textbox(label="Assistant answered")
    reply_audio = gr.Audio(label="Spoken reply", autoplay=True)

    btn.click(fn=voice_pipeline, inputs=mic, outputs=[transcript_box, answer_box, reply_audio])

demo.launch()
