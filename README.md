# J.A.R.V.I.S. — AI Voice Assistant with a Cinematic HUD

A full-stack AI voice assistant inspired by Iron Man's JARVIS — a custom animated
SVG heads-up display, streaming conversational AI with tool-calling, voice
input/output with wake-word detection, and an optional local companion agent for
desktop control and live system monitoring.

🔗 **Live demo:** https://jarvis-theta-indol.vercel.app

---

## Features

- 🎙️ **Voice interaction** — click-to-talk or fully hands-free "always listening" mode with wake word ("Hey JARVIS" / "Wake up JARVIS") and a spoken sleep command
- 🧠 **Streaming AI responses** — powered by Groq (Llama 3.3 70B), with tool-calling for web search, weather, news, calculations, and Wikipedia lookups
- 🌦️ **Live, location-aware weather** — real conditions for the user's actual location via browser geolocation
- ⏱️ **Built-in tools** — calculator, countdown timer with browser notifications, and a persistent notebook, all rendered as floating HUD panels
- 🔊 **Synthesized sci-fi sound design** — UI clicks, access-granted/denied tones, and a full mechanical boot sequence, all generated with the Web Audio API (no audio files)
- 🎨 **Custom animated HUD** — a hand-built SVG interface with rotating rings, a reactive core sphere, drag-and-repositionable panels, and status-reactive color states (idle / listening / thinking / speaking / error)
- 💾 **Persistent memory** — conversation history and layout positions survive page reloads via localStorage
- 📱 **Fully responsive** — desktop 3-column layout collapses to a single scrollable column on mobile
- 🖥️ **Optional local agent** — a companion Python/Flask process for opening desktop apps, controlling system volume, and reporting real CPU/RAM/disk stats

---

## Tech Stack

**Frontend:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4
**AI:** Groq API (Llama 3.3 70B) · Serper (web search & news) · wttr.in (weather)
**Voice:** ElevenLabs (text-to-speech) · Web Speech API (speech recognition) · Web Audio API (sound synthesis)
**Local agent:** Python · Flask · psutil
**Hosting:** Vercel

---

## Architecture Note — Why Some Features Say "Agent Offline"

The AI conversation, voice, weather, and all HUD tools work fully in the browser
for anyone visiting the live link — no setup required.

**Desktop control and live system stats are different.** Browsers are
intentionally sandboxed and cannot execute system commands or launch other
applications from a webpage — this is a security boundary, not a limitation of
this project. To bridge that gap safely, the app can optionally talk to a small
local companion process (`agent.py`) running on `localhost:5001`, which has real
OS-level access. When that agent isn't running, the relevant panels show
"Agent offline" instead of silently failing or displaying fake data.

**To use the desktop-control features:**

```bash
# Terminal 1 — start the app
npm run dev

# Terminal 2 — start the local agent
python3 -m venv jarvis-env
source jarvis-env/bin/activate   # or jarvis-env\Scripts\activate on Windows
pip install flask flask-cors psutil
python agent.py
```

Then open `http://localhost:3000` (not the deployed URL — the agent can only be
reached from a page also running on your machine).

---

## Getting Started (Frontend Only)

```bash
npm install
```

Create a `.env.local` file with:

```
GROQ_API_KEY=your_key_here
SERPER_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome (voice input requires
the Web Speech API, which is Chrome/Edge only).

---

## Voice Commands

| Say this | What happens |
|---|---|
| "Wake up JARVIS" | Plays a boot sequence and greets you |
| "Jarvis, sleep" | Stops always-on listening |
| "What's the weather?" | Real weather for your current location |
| "What's 847 times 23?" | Calculator tool, answered directly |
| "Set a timer for 10 minutes" | Starts a countdown with a browser notification when done |
| "Open YouTube" | Opens the site in a new tab |
| "Open Spotify" | Launches the app locally (requires `agent.py` running) |

---

## Deployment

Deployed on Vercel. Push to `main` and Vercel auto-builds. The three API keys
above need to be set as environment variables in the Vercel project settings.

The local agent (`agent.py`) is never deployed — it only ever runs on your own
machine, by design.