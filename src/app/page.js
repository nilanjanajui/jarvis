'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import SettingsPanel from '@/components/SettingsPanel';
import NeuralSync from '@/components/NeuralSync';
import BioMetrics from '@/components/BioMetrics';
import AudioVisualizer from '@/components/AudioVisualizer';
import SystemLog from '@/components/SystemLog';
import CenterHUD from '@/components/CenterHUD';
import SystemTopology from '@/components/SystemTopology';
import SatelliteLink from '@/components/SatelliteLink';
import AtmosphericData from '@/components/AtmosphericData';
import SecurityStatus from '@/components/SecurityStatus';
import SystemTerminal from '@/components/SystemTerminal';
import { CalculatorPanel, TimerPanel, NotebookPanel } from '@/components/HudTools';

const AGENT = 'http://localhost:5001';

const PARTICLES = Array.from({ length: 25 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 1.5,
  duration: 3 + Math.random() * 5,
  delay: Math.random() * 5,
  driftDur: 4 + Math.random() * 6,
}));

export default function JarvisPage() {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('jarvis-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [logLine, setLogLine] = useState('');
  const [elevenLabsOk, setElevenLabsOk] = useState(true);
  const [agentConnected, setAgentConnected] = useState(false);
  const [alwaysOn, setAlwaysOn] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsOpenSeq, setSettingsOpenSeq] = useState(0);
  const [alwaysOnDefault, setAlwaysOnDefault] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('jarvis-always-on-default') === 'true';
    } catch {
      return false;
    }
  });
  const [activeTimers, setActiveTimers] = useState([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);

  const recognitionRef = useRef(null);
  const recognitionRunning = useRef(false);
  const audioRef = useRef(null);
  const messagesRef = useRef(messages);
  const statusRef = useRef(status);
  const listeningRef = useRef(false);
  const alwaysOnRef = useRef(false);
  const elevenLabsOkRef = useRef(true);
  const handleSendRef = useRef(null);
  const wakeUpRef = useRef(null);
  const userLocationRef = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem('jarvis-history', JSON.stringify(messages.slice(-40)));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [messages]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { elevenLabsOkRef.current = elevenLabsOk; }, [elevenLabsOk]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  // ── Get browser location on mount — high accuracy to avoid IP-based mislocation ──
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLogLine('Location acquired');
      },
      () => setLogLine('Location unavailable — permission denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ── Agent connection check (local only — agent.py runs on your PC, not Vercel) ─
  useEffect(() => {
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (!isLocal) return;

    const check = () =>
      fetch(`${AGENT}/health`).then(() => setAgentConnected(true)).catch(() => setAgentConnected(false));
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  // ── Safe recognition helpers ────────────────────────────────────────────────
  const safeStart = useCallback(() => {
    if (recognitionRunning.current) return;
    try { recognitionRef.current?.start(); } catch (e) {
      if (e.name !== 'InvalidStateError') console.error(e);
    }
  }, []);

  const safeStop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { }
  }, []);

  // ── 1. speak ───────────────────────────────────────────────────────────────
  const speak = useCallback(async (text) => {
    const resumeListening = () => {
      setStatus('idle');
      if (alwaysOnRef.current) {
        listeningRef.current = true;
        setTimeout(safeStart, 500);
      }
    };

    setStatus('speaking');
    listeningRef.current = false;
    safeStop();

    if (elevenLabsOkRef.current) {
      try {
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioRef.current.src = url;
        audioRef.current.onended = () => { resumeListening(); URL.revokeObjectURL(url); };
        await audioRef.current.play();
        return;
      } catch (err) {
        console.error('ElevenLabs failed:', err);
        setElevenLabsOk(false);
        elevenLabsOkRef.current = false;
      }
    }

    // Browser TTS fallback — male voice
    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(v =>
        v.name === 'Google UK English Male' ||
        v.name.includes('Male') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('daniel')
      );
      const u = new SpeechSynthesisUtterance(text);
      if (maleVoice) u.voice = maleVoice;
      u.rate = 0.92;
      u.pitch = 0.65;
      u.onend = resumeListening;
      u.onerror = resumeListening;
      speechSynthesis.speak(u);
    };

    speechSynthesis.getVoices().length > 0
      ? doSpeak()
      : (speechSynthesis.onvoiceschanged = doSpeak);
  }, [safeStart, safeStop]);

  // ── 2. executeAction ───────────────────────────────────────────────────────
  const startTimer = useCallback((seconds, label) => {
    const id = Date.now();
    const endsAt = Date.now() + seconds * 1000;
    setActiveTimers((prev) => [...prev, { id, label, endsAt }]);
    setLogLine(`Timer started: ${label} (${seconds}s)`);
    setShowTimerPanel(true);

    setTimeout(() => {
      setActiveTimers((prev) => prev.filter((t) => t.id !== id));
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('J.A.R.V.I.S. — Timer Complete', { body: `${label} timer is done, sir.` });
      }
      speak(`Timer complete, sir. ${label} is done.`);
    }, seconds * 1000);
  }, [speak]);

  const executeAction = useCallback(async (action) => {
    if (!action) return;

    if (action.type === 'open_url') {
      const win = window.open(action.url, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setPendingUrl({ url: action.url, name: action.site_name || action.url });
        setLogLine(`Popup blocked — confirm to open ${action.site_name}`);
      } else {
        setLogLine(`Opening ${action.site_name}`);
      }
      return;
    }

    if (action.type === 'open_app' && agentConnected) {
      const res = await fetch(`${AGENT}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: action.app }),
      });
      if (res.ok) {
        setLogLine(`Launching ${action.app}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setLogLine(`Agent: ${err.message || 'failed to open app'}`);
      }
      return;
    }

    if (action.type === 'volume' && agentConnected) {
      await fetch(`${AGENT}/volume`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action.action }),
      });
      setLogLine(`Volume ${action.action}`);
      return;
    }

    if (action.type === 'timer') {
      startTimer(action.seconds, action.label);
      return;
    }

    if (action.type === 'reminder') {
      setLogLine(`Reminder set: "${action.message}" in ${action.seconds}s`);
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('J.A.R.V.I.S. - Reminder', { body: action.message });
        }
        speak(`Reminder, sir: ${action.message}`);
      }, action.seconds * 1000);
    }
  }, [agentConnected, speak, startTimer]);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => { requestNotificationPermission(); }, [requestNotificationPermission]);

  // ── 3. handleSend — passes location + local time ──────────────────────────
  const handleSend = useCallback(async (text) => {
    if (!text?.trim()) return;
    if (statusRef.current === 'thinking' || statusRef.current === 'speaking') return;

    setStatus('thinking');
    setTranscript('');
    setStreamingText('');
    const history = [...messagesRef.current, { role: 'user', content: text.trim() }];
    setMessages(history);
    setLogLine(`Processing: "${text.trim().slice(0, 40)}..."`);

    let fullText = '';
    let receivedAction = null;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          userLocation: userLocationRef.current,
          localTime: new Date().toLocaleTimeString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Chat API ${res.status}${errText ? ': ' + errText.slice(0, 120) : ''}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete trailing line for next chunk

        for (const line of lines) {
          if (!line.trim()) continue;
          let msg;
          try { msg = JSON.parse(line); } catch { continue; }

          if (msg.type === 'delta') {
            fullText += msg.text;
            setStreamingText(fullText);
          } else if (msg.type === 'action') {
            receivedAction = msg.action;
          } else if (msg.type === 'error') {
            throw new Error(msg.message);
          }
        }
      }

      setMessages([...history, { role: 'assistant', content: fullText }]);
      setStreamingText('');
      setLogLine('Relaying response...');
      await Promise.all([executeAction(receivedAction), speak(fullText)]);

    } catch (e) {
      console.error('handleSend error:', e);
      setStatus('idle');
      setStreamingText('');
      setLogLine('Error: request failed');
      if (alwaysOnRef.current) {
        listeningRef.current = true;
        setTimeout(safeStart, 500);
      }
    }
  }, [executeAction, speak, safeStart]);

  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  // ── 4. Wake up sequence ────────────────────────────────────────────────────
  const wakeUp = useCallback(() => {
    const h = new Date().getHours();
    const timeGreet =
      h < 12 ? 'Good morning' :
        h < 17 ? 'Good afternoon' :
          h < 21 ? 'Good evening' : 'Good night';

    const intro = `${timeGreet}, sir.
System initialization complete. All core modules are online and operating within normal parameters. Voice authentication successful. I am JARVIS, your intelligent assistant. I am prepared to analyze information, automate tasks, monitor your systems, and assist you with your objectives. Awaiting your command.`;

    setStatus('listening');
    setLogLine('Wake sequence initiated — all systems online');
    setTimeout(() => speak(intro), 300);
  }, [speak]);

  useEffect(() => { wakeUpRef.current = wakeUp; }, [wakeUp]);

  // ── 5. Speech recognition — created once. `speak` is stable via the useCallback
  //      chain (its own deps safeStart/safeStop are both []), so this effect's
  //      dependency on [speak] doesn't cause it to re-run in practice. ──────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.warn('Use Chrome for voice support.'); return; }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onstart = () => { recognitionRunning.current = true; };

    r.onresult = (e) => {
      const cur = e.results[e.results.length - 1];
      const raw = cur[0].transcript;

      if (!cur.isFinal) { setTranscript(raw); return; }

      setTranscript('');
      const text = raw.toLowerCase().trim();

      if (statusRef.current === 'thinking' || statusRef.current === 'speaking') return;

      if (alwaysOnRef.current) {

        // ── Sleep command ──
        if (
          (text.includes('sleep') && text.includes('jarvis')) ||
          (text.includes('goodbye') && text.includes('jarvis')) ||
          text === 'jarvis sleep'
        ) {
          listeningRef.current = false;
          alwaysOnRef.current = false;
          setAlwaysOn(false);
          setLogLine('Going to sleep...');
          recognitionRef.current?.stop();
          speak("Going to sleep, sir. Call me when you need me.");
          return;
        }

        // ── Wake up command ──
        if (text.includes('wake up') && text.includes('jarvis')) {
          wakeUpRef.current?.();
          return;
        }

        // ── Everything else is a direct command — no wake word needed ──
        if (raw.trim().length > 2) {
          handleSendRef.current?.(raw.trim());
        }

      } else {
        // Click-to-talk mode
        if (statusRef.current === 'listening') {
          handleSendRef.current?.(raw);
        }
      }
    };

    r.onend = () => {
      recognitionRunning.current = false;
      setStatus(s => s === 'listening' ? 'idle' : s);
      if (listeningRef.current) {
        setTimeout(() => {
          if (!recognitionRunning.current) try { r.start(); } catch { }
        }, 400);
      }
    };

    r.onerror = (e) => {
      recognitionRunning.current = false;
      if (e.error !== 'no-speech' && e.error !== 'aborted') console.error('Speech error:', e.error);
      if (listeningRef.current) {
        setTimeout(() => {
          if (!recognitionRunning.current) try { r.start(); } catch { }
        }, 600);
      }
    };

    recognitionRef.current = r;
    return () => { listeningRef.current = false; try { r.abort(); } catch { } };
  }, [speak]);

  // ── Toggle always-on ────────────────────────────────────────────────────────
  const toggleAlwaysOn = () => {
    const next = !alwaysOn;
    setAlwaysOn(next);
    alwaysOnRef.current = next;

    if (next) {
      listeningRef.current = true;
      setLogLine('Always-on activated — say "wake up jarvis" or speak directly');
      setTimeout(() => {
        if (!recognitionRunning.current) try { recognitionRef.current?.start(); } catch { }
      }, 200);
    } else {
      listeningRef.current = false;
      safeStop();
      setLogLine('Always-on deactivated');
    }
  };

  const toggleAlwaysOnDefault = () => {
    setAlwaysOnDefault((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('jarvis-always-on-default', String(next));
      } catch (e) {
        console.error('Failed to save always-on-default:', e);
      }
      return next;
    });
  };

  // ── Auto-activate always-on if enabled by default, once recognition is ready ──
  useEffect(() => {
    if (!alwaysOnDefault) return;
    const t = setTimeout(() => {
      setAlwaysOn(true);
      alwaysOnRef.current = true;
      listeningRef.current = true;
      setLogLine('Always-on activated (default) — say "wake up jarvis" or speak directly');
      if (!recognitionRunning.current) try { recognitionRef.current?.start(); } catch { }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('jarvis-history');
    setLogLine('Conversation history cleared');
  };

  const handleMicClick = () => {
    if (alwaysOn || status !== 'idle') return;
    setStatus('listening');
    safeStart();
  };

  const statusColor = {
    idle: '#00d4ff',
    listening: '#22c55e',
    thinking: '#f59e0b',
    speaking: '#a855f7',
  }[status] || '#00d4ff';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#060b14', overflow: 'hidden', position: 'relative' }}>

      {/* Animated Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.18) 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.35), transparent)', animation: 'scan-bg 5s linear infinite' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)', animation: 'scan-bg 9s linear infinite', animationDelay: '-4s' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '900px', height: '900px', borderRadius: '50%', background: `radial-gradient(circle, ${statusColor}07 0%, transparent 65%)`, animation: 'pulse-glow 3s ease-in-out infinite', transition: 'background 1s' }} />
        {PARTICLES.map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%', background: '#00d4ff', animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite, drift-x ${p.driftDur}s ease-in-out ${p.delay}s infinite` }} />
        ))}
      </div>

      {/* App layer */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Navbar onSettingsClick={() => { setSettingsOpenSeq((n) => n + 1); setShowSettings(true); }} settingsOpen={showSettings} />

        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', padding: '4px 0', borderBottom: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,5,12,0.88)', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: agentConnected ? '#22c55e' : 'rgba(0,212,255,0.3)', letterSpacing: '0.1em' }}>
            {agentConnected ? '● AGENT ONLINE' : '○ AGENT OFFLINE'}
          </span>
          <span style={{ color: 'rgba(0,212,255,0.2)' }}>|</span>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: userLocation ? '#22c55e' : 'rgba(0,212,255,0.3)', letterSpacing: '0.1em' }}>
            {userLocation ? '● LOCATION LOCKED' : '○ LOCATION UNKNOWN'}
          </span>
          <span style={{ color: 'rgba(0,212,255,0.2)' }}>|</span>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: elevenLabsOk ? '#00d4ff' : '#f59e0b', letterSpacing: '0.1em' }}>
            {elevenLabsOk ? '● ELEVENLABS VOICE' : '⚠ BROWSER VOICE'}
          </span>
          <span style={{ color: 'rgba(0,212,255,0.2)' }}>|</span>
          <button
            onClick={toggleAlwaysOn}
            style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', letterSpacing: '0.1em', background: 'none', border: `1px solid ${alwaysOn ? '#22c55e' : 'rgba(0,212,255,0.25)'}`, color: alwaysOn ? '#22c55e' : 'rgba(0,212,255,0.5)', padding: '2px 10px', cursor: 'pointer', borderRadius: '2px', transition: 'all 0.3s' }}
          >
            {alwaysOn ? '● ALWAYS LISTENING' : '○ CLICK TO TALK'}
          </button>
          {alwaysOn && (
            <>
              <span style={{ color: 'rgba(0,212,255,0.2)' }}>|</span>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.4)', letterSpacing: '0.08em' }}>
                &quot;wake up jarvis&quot; to greet · &quot;jarvis sleep&quot; to pause
              </span>
            </>
          )}
          {messages.length > 0 && (
            <>
              <span style={{ color: 'rgba(0,212,255,0.2)' }}>|</span>
              <button
                onClick={clearHistory}
                style={{
                  fontFamily: 'Share Tech Mono', fontSize: '9px', letterSpacing: '0.1em',
                  background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgba(239,68,68,0.7)', padding: '2px 10px', cursor: 'pointer', borderRadius: '2px',
                }}
              >
                CLEAR HISTORY ({messages.length})
              </button>
            </>
          )}
        </div>

        {/* Layout */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '272px 1fr 272px', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '10px', overflowY: 'auto', borderRight: '1px solid rgba(0,212,255,0.07)' }}>
            <NeuralSync />
            <BioMetrics />
            <AudioVisualizer />
            <SystemLog extraLine={logLine} />
            {activeTimers.length > 0 && (
              <div className="hud-card" style={{ marginTop: '8px' }}>
                <div className="hud-label">Active Timers</div>
                {activeTimers.map((t) => (
                  <TimerRow key={t.id} label={t.label} endsAt={t.endsAt} />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Toggle buttons — panels layer on top, sphere stays visible always */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px 0' }}>
              <button
                onClick={() => setShowCalculator((v) => !v)}
                style={{
                  fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em',
                  background: showCalculator ? 'rgba(0,212,255,0.12)' : 'none',
                  border: `1px solid ${showCalculator ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`,
                  color: showCalculator ? '#00d4ff' : 'rgba(0,212,255,0.4)',
                  padding: '5px 14px', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                CALC
              </button>
              <button
                onClick={() => setShowTimerPanel((v) => !v)}
                style={{
                  fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em',
                  background: showTimerPanel ? 'rgba(0,212,255,0.12)' : 'none',
                  border: `1px solid ${showTimerPanel ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`,
                  color: showTimerPanel ? '#00d4ff' : 'rgba(0,212,255,0.4)',
                  padding: '5px 14px', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                TIMER
              </button>
              <button
                onClick={() => setShowNotebook((v) => !v)}
                style={{
                  fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em',
                  background: showNotebook ? 'rgba(0,212,255,0.12)' : 'none',
                  border: `1px solid ${showNotebook ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`,
                  color: showNotebook ? '#00d4ff' : 'rgba(0,212,255,0.4)',
                  padding: '5px 14px', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                NOTES
              </button>
            </div>

            {/* Sphere always visible — panels float on top in corners */}
            <div
              onClick={handleMicClick}
              style={{ flex: 1, cursor: !alwaysOn && status === 'idle' ? 'pointer' : 'default', position: 'relative' }}
            >
              <CenterHUD status={status} transcript={transcript} streamingText={streamingText} />
              {!alwaysOn && status === 'idle' && (
                <div style={{ position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(0,212,255,0.25)' }}>
                  CLICK TO ACTIVATE
                </div>
              )}

              {showCalculator && (
                <div onClick={(e) => e.stopPropagation()}>
                  <CalculatorPanel onClose={() => setShowCalculator(false)} />
                </div>
              )}
              {showTimerPanel && (
                <div onClick={(e) => e.stopPropagation()}>
                  <TimerPanel onClose={() => setShowTimerPanel(false)} activeTimers={activeTimers} onAddTimer={startTimer} />
                </div>
              )}
              {showNotebook && (
                <div onClick={(e) => e.stopPropagation()}>
                  <NotebookPanel onClose={() => setShowNotebook(false)} />
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '10px', overflowY: 'auto', borderLeft: '1px solid rgba(0,212,255,0.07)' }}>
            <SystemTopology />
            <SatelliteLink />
            <AtmosphericData />
            <SecurityStatus />
            <SystemTerminal />
          </div>
        </div>
      </div>

      {pendingUrl && (
        <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,18,36,0.97)', border: '1px solid rgba(0,212,255,0.4)', padding: '10px 20px', boxShadow: '0 0 30px rgba(0,212,255,0.15)' }}>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.08em' }}>
            Open {pendingUrl.name}?
          </span>
          <button
            onClick={() => { window.open(pendingUrl.url, '_blank'); setPendingUrl(null); }}
            style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em', background: 'rgba(0,212,255,0.1)', border: '1px solid #00d4ff', color: '#00d4ff', padding: '4px 14px', cursor: 'pointer' }}>
            OPEN
          </button>
          <button
            onClick={() => setPendingUrl(null)}
            style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em', background: 'none', border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(0,212,255,0.4)', padding: '4px 14px', cursor: 'pointer' }}>
            DISMISS
          </button>
        </div>
      )}
      <audio ref={audioRef} />

      {showSettings && (
        <SettingsPanel
          key={settingsOpenSeq}
          open={showSettings}
          onClose={() => setShowSettings(false)}
          alwaysOnDefault={alwaysOnDefault}
          onToggleAlwaysOnDefault={toggleAlwaysOnDefault}
          onClearHistory={clearHistory}
          historyCount={messages.length}
        />
      )}
    </div>
  );
}

// Moved outside JarvisPage to module scope. Previously declared after the
// return statement inside JarvisPage — that caused a NEW function reference
// on every JarvisPage render (which happens constantly during streaming),
// which made React unmount/remount TimerRow each time, resetting its
// countdown and restarting its interval. Declaring it here fixes that.
function TimerRow({ label, endsAt }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(Math.max(0, endsAt - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.7)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'Orbitron', fontSize: '11px', color: '#00d4ff', fontWeight: '700' }}>
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}