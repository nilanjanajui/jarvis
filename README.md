# J.A.R.V.I.S. — AI Voice Assistant & Spatial HUD with Desktop Agent

[![Next.js 16](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20GPT--OSS%20120B-orange?style=flat-square)](https://groq.com/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

An advanced, Iron Man-inspired **AI Voice Assistant & Interactive Spatial HUD**. Built with Next.js 16, Three.js WebGL, Web Audio API spatial sound, and a Python desktop IPC daemon for real-time OS control. Features a fully 3D parallax holographic interface with voice-reactive particle systems, HRTF spatial audio, physics-based floating panels, and multi-monitor awareness.

🔗 **Live Demo:** [jarvis-theta-indol.vercel.app](https://jarvis-theta-indol.vercel.app)

---

## 📐 System Architecture

```mermaid
graph TD
    subgraph Browser ["Web Browser — Next.js 16 Spatial HUD"]
        User([User Input: Voice / Text]) --> Speech[Web Speech API]
        Speech --> ChatRoute["/api/chat — Groq AI + Tool Calling"]
        ChatRoute --> TTS["/api/speak — ElevenLabs TTS"]
        ChatRoute --> Tools[14 AI Tool Functions]
        
        Mouse([Mouse Position]) --> Parallax[Spatial Parallax Engine]
        TTS --> AudioAnalyser[Web Audio AnalyserNode]
        AudioAnalyser --> Reactor[3D Arc Reactor — Three.js]
        
        SpatialAudio[HRTF Spatial Audio] --> PannerNode[3D Directional Sound]
        Panels[Physics Draggable Panels] --> Springs[Spring + Momentum Engine]
        
        UI[HUD Components x18] <--> WsHook["useLocalAgentWs Hook"]
    end

    subgraph LocalOS ["Host System Daemon — Python agent.py"]
        WsHook <-->|WebSocket :5002| WSIPC["Live Telemetry Stream"]
        WsHook <-->|HTTP REST :5001| REST["Flask REST Engine"]
        REST --> Apps["App Launcher (code, chrome, etc.)"]
        REST --> Stats["psutil CPU/RAM/Disk Metrics"]
        REST --> Process["Process Monitor & Kill"]
    end
```

---

## ✨ Feature Overview

### 🎙️ AI Voice Engine
| Feature | Details |
|---|---|
| **Wake Word Detection** | "Wake up Jarvis" activates, "Jarvis sleep" suspends |
| **Always-On Listening** | Toggle persistent microphone monitoring |
| **Streaming AI Chat** | Groq GPT-OSS 120B with 14 tool-calling functions |
| **Voice Synthesis** | ElevenLabs TTS (7 voice presets) with browser SpeechSynthesis fallback |
| **Conversation Memory** | Persistent localStorage-backed fact retention across sessions |

### 🔧 14 AI Tool Functions
| Tool | What It Does |
|---|---|
| `search_web` | Real-time Google search via Serper API |
| `search_news` | Latest headlines via Serper News API |
| `get_weather` | Live weather from wttr.in |
| `get_location` | Reverse geocode browser coordinates |
| `search_wikipedia` | Wikipedia article summaries |
| `calculate` | Safe math expression evaluator |
| `set_timer` | Countdown timer with browser notifications |
| `set_reminder` | Delayed reminder notifications |
| `open_url` | Open websites in new tabs |
| `open_app` | Launch desktop apps via IPC agent |
| `control_volume` | System volume up/down/mute |
| `media_control` | Play/pause/next/previous media |
| `execute_system_command` | Run terminal commands (with safety filters) |
| `remember_fact` | Persist user preferences to memory |

### 🌌 Spatial UI System (5 Features)
| Feature | How It Works |
|---|---|
| **Parallax HUD** | Mouse position drives CSS perspective transforms — background shifts ±20px, HUD tilts ±1.5° |
| **Voice-Reactive Arc Reactor** | TTS audio → `MediaElementSource` → `AnalyserNode` → FFT split: bass=glow, mids=ring speed, highs=particle bursts |
| **Physics Floating Panels** | Spring momentum on drag release, edge bouncing, idle breathing animation (sine bob), magnetic edge snapping |
| **HRTF Spatial Audio** | `PannerNode` with HRTF model maps UI click screen position to 3D directional sound |
| **Multi-Monitor Tracking** | Polls `window.screenX/Y` every 500ms, reports quadrant (TL/TR/BL/BR) and monitor index |

### 🖥️ Desktop Agent (Python IPC)
| Feature | Details |
|---|---|
| **App Launching** | VS Code, Chrome, Firefox, Terminal, VLC, Nautilus, Telegram |
| **Live Telemetry** | 1-second WebSocket stream: CPU%, RAM%, Disk%, uptime, active window |
| **Process Monitor** | View top processes, kill PIDs directly from HUD |
| **Volume/Media** | System volume and media playback control |

### 🎨 HUD Dashboard — 18 Components
| Component | Description |
|---|---|
| `CenterHUD` | Main display with SVG rings, scanning sweep, status readouts |
| `ArcReactor3D` | Three.js WebGL particle sphere (1400 particles + 3 orbital rings + burst system) |
| `Navbar` | Navigation bar with spatial audio click/hover sounds |
| `NeuralSync` | Animated neural activity indicator |
| `BioMetrics` | Simulated biometric readouts |
| `AudioVisualizer` | Real-time canvas FFT waveform |
| `SystemLog` | Scrolling event log with timestamps |
| `SystemTopology` | Network topology visualization |
| `SatelliteLink` | Satellite connection status display |
| `AtmosphericData` | Live weather data display (uses Weather API) |
| `SecurityStatus` | Encryption/security status panel |
| `SystemTerminal` | Interactive terminal command interface |
| `CalculatorPanel` | Full arithmetic calculator |
| `TimerPanel` | Timer creation and active timer display |
| `NotebookPanel` | Persistent notes (localStorage backed) |
| `ProcessMonitorPanel` | Live process list with kill functionality |
| `SettingsPanel` | Voice selection, always-on toggle, history management |
| `AboutModal` | Project information modal |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19 |
| **3D Graphics** | Three.js (WebGL), SVG animations, Canvas 2D API |
| **Audio** | Web Audio API (synthesized sounds), HRTF spatial audio, ElevenLabs TTS |
| **Animation** | Framer Motion, CSS keyframe animations, requestAnimationFrame |
| **AI / LLM** | Groq SDK (`openai/gpt-oss-120b` with fallback chain) |
| **Search** | Serper API (web + news), wttr.in (weather), Wikipedia REST API |
| **Desktop Agent** | Python 3.12, Flask, Flask-CORS, psutil, websockets |
| **State** | localStorage (layout positions, conversation history, facts, preferences) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- **Google Chrome** or **Microsoft Edge** (required for Web Speech API)
- **Python 3.10+** (optional — only for desktop agent features)

### 1. Clone & Install
```bash
git clone https://github.com/nilanjanajui/jarvis.git
cd jarvis
npm install
```

### 2. Configure API Keys
Create `.env.local` in the project root:
```env
GROQ_API_KEY=your_groq_api_key          # Required — get from console.groq.com
SERPER_API_KEY=your_serper_api_key      # Required for web/news search
ELEVENLABS_API_KEY=your_elevenlabs_key  # Optional — falls back to browser TTS
```

### 3. Start Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in Chrome or Edge.

### 4. Desktop Agent Setup (Optional)
To enable app launching, system metrics, and process control:
```bash
# In a separate terminal
python3 -m venv jarvis-env
source jarvis-env/bin/activate          # Windows: jarvis-env\Scripts\activate
pip install flask flask-cors psutil websockets
python agent.py
```

When connected, the status bar shows **● WS IPC STREAM** in green.

---

## 🗣️ Voice Commands

| Command | What Happens |
|---|---|
| "Wake up Jarvis" | Mechanical boot sequence + voice greeting |
| "Jarvis sleep" | Suspends always-on listening |
| "What's the weather in Tokyo?" | Fetches live weather data |
| "Search for latest AI news" | Returns news headlines |
| "Open VS Code" | Launches VS Code via agent daemon |
| "What is 847 times 29?" | Calculates and speaks result |
| "Set a timer for 10 minutes" | Creates countdown with notification |
| "Remind me to call mom in 30 minutes" | Schedules a reminder notification |
| "Remember that my favorite color is blue" | Saves to persistent memory |
| "Who was Alan Turing?" | Wikipedia lookup |

---

## 📂 Project Structure

```
jarvis/
├── src/
│   ├── app/
│   │   ├── page.js                 # Main HUD page (980+ lines)
│   │   ├── layout.js               # Root layout with fonts & metadata
│   │   ├── globals.css             # All CSS animations & design tokens
│   │   └── api/
│   │       ├── chat/route.js       # AI chat endpoint (14 tools, fallback models)
│   │       ├── speak/route.js      # ElevenLabs TTS proxy
│   │       ├── weather/route.js    # Weather API with geolocation
│   │       └── settings/route.js   # Settings persistence
│   ├── components/                 # 18 React components
│   │   ├── CenterHUD.jsx          # Central radar + reactor display
│   │   ├── ArcReactor3D.jsx       # Three.js voice-reactive particle sphere
│   │   ├── Draggable.jsx          # Physics-based drag with springs
│   │   ├── Navbar.jsx             # Navigation with spatial audio
│   │   ├── HudTools.jsx           # Calculator, Timer, Notebook, Process panels
│   │   └── ... (14 more components)
│   └── lib/                       # Shared utilities & hooks
│       ├── hudSounds.js           # Web Audio synthesized sound library
│       ├── spatialAudio.js        # HRTF 3D directional audio engine
│       ├── useSpatialMouse.js     # Mouse parallax tracking hook
│       ├── useWindowPosition.js   # Multi-monitor position detection
│       ├── useLocalAgentWs.js     # WebSocket + REST agent hook
│       ├── memory.js              # localStorage fact retention
│       └── voices.js              # ElevenLabs voice presets
├── agent.py                       # Python desktop IPC daemon
├── .env.local                     # API keys (not committed)
└── package.json
```

---

## 🔒 Security & Privacy

- **Local-Only Agent**: `agent.py` binds exclusively to `127.0.0.1` — never exposed to network
- **Command Filtering**: Destructive shell commands are filtered before execution
- **No Data Collection**: All conversation history and user facts stored in browser localStorage only
- **Graceful Degradation**: Works fully without agent daemon (AI, voice, weather, calculator, timers all function independently)

---

## ⚠️ Troubleshooting

| Issue | Solution |
|---|---|
| "Agent Offline" on Vercel | Expected — agent requires `localhost`. Run `npm run dev` locally |
| Voice not working | Use Chrome or Edge. Safari/Firefox lack Web Speech API support |
| "Browser Voice" instead of ElevenLabs | Check `ELEVENLABS_API_KEY` in `.env.local` or quota limits |
| Weather errors | Intermittent — wttr.in has occasional socket timeouts, auto-retries |
| Panels stuck offscreen | Click **RESET LAYOUT** in the status bar |

---

## 📜 License

This is a personal, self-associated project created and maintained by Nilanjana Das Jui. All rights reserved. No license is granted for copying, modifying, or distributing this project without the author’s permission.

---

**Built by [Nilanjana](https://github.com/nilanjanajui)** — Inspired by Tony Stark's J.A.R.V.I.S.
