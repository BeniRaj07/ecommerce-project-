# Awaaz AI — Nepali/English Voice Assistant

- `app.py` — the assistant logic (speech-to-text, intent, weather, football, text-to-speech) plus the original simple UI.
- `ui.py` — the new interactive UI. It imports everything from `app.py`.

```bash
pip install -r requirements.txt
# .env needs: GEMINI_API_KEY, GROQ_API_KEY, NEWS_API_KEY, FOOTBALL_DATA_KEY
python ui.py     # new UI
python app.py    # original UI
```
