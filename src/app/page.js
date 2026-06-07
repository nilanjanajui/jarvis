'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
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
  const [messages, setMessages] = useState([]);
  const [logLine, setLogLine] = useState('');
  const [elevenLabsOk, setElevenLabsOk] = useState(true);
  const [agentConnected, setAgentConnected] = useState(false);
  const [alwaysOn, setAlwaysOn] = useState(false);

  // Refs that recognition handlers read — avoids stale closures
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

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { elevenLabsOkRef.current = elevenLabsOk; }, [elevenLabsOk]);

  // ── Agent connection check ──────────────────────────────────────────────────
  useEffect(() => {
    const check = () =>
      fetch(`${AGENT}/health`).then(() => setAgentConnected(true)).catch(() => setAgentConnected(false));
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  // ── Safe recognition start/stop ────────────────────────────────────────────
  const safeStart = () => {
    if (recognitionRunning.current) return;
    try {
      recognitionRef.current?.start();
    } catch (e) {
      if (e.name !== 'InvalidStateError') console.error('Recognition start:', e);
    }
  };

  const safeStop = () => {
    try { recognitionRef.current?.stop(); } catch { }
  };

  // ── Resume listening after JARVIS finishes speaking ────────────────────────
  const resumeListening = () => {
    setStatus('idle');
    if (alwaysOnRef.current) {
      listeningRef.current = true;
      setTimeout(safeStart, 500);
    }
  };

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

    // Browser TTS fallback — pick a male voice
    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(v =>
        v.name === 'Google UK English Male' ||
        v.name.includes('Male') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('james')
      );
      const u = new SpeechSynthesisUtterance(text);
      if (maleVoice) u.voice = maleVoice;
      u.rate = 0.92;
      u.pitch = 0.65;
      u.volume = 1;
      u.onend = resumeListening;
      u.onerror = resumeListening;
      speechSynthesis.speak(u);
    };

    if (speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      speechSynthesis.onvoiceschanged = doSpeak;
    }
  }, []); // empty deps — only uses refs // empty deps — uses refs only

  // ── 2. executeAction ───────────────────────────────────────────────────────
  const executeAction = useCallback(async (action) => {
    if (!action) return;
    if (action.type === 'open_url') {
      window.open(action.url, '_blank');
      setLogLine(`Opening ${action.site_name} in browser`);
      return;
    }
    if (action.type === 'open_app' && agentConnected) {
      await fetch(`${AGENT}/execute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: action.app }),
      });
      setLogLine(`Launching ${action.app}`);
      return;
    }
    if (action.type === 'volume' && agentConnected) {
      await fetch(`${AGENT}/volume`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action.action }),
      });
      setLogLine(`Volume ${action.action}`);
    }
  }, [agentConnected]);

  // ── 3. handleSend ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    if (!text?.trim()) return;
    if (statusRef.current === 'thinking' || statusRef.current === 'speaking') return;

    setStatus('thinking');
    setTranscript('');
    const history = [...messagesRef.current, { role: 'user', content: text.trim() }];
    setMessages(history);
    setLogLine(`Processing: "${text.trim().slice(0, 40)}..."`);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const { reply, action } = await res.json();
      setMessages([...history, { role: 'assistant', content: reply }]);
      setLogLine('Response ready — relaying...');
      await Promise.all([executeAction(action), speak(reply)]);
    } catch (e) {
      console.error('handleSend error:', e);
      setStatus('idle');
      setLogLine('Error: request failed');
      if (alwaysOnRef.current) {
        listeningRef.current = true;
        setTimeout(safeStart, 500);
      }
    }
  }, [executeAction, speak]);

  // Keep refs in sync
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  // ── 4. wakeUp — greeting + intro speech ───────────────────────────────────
  const wakeUp = useCallback(() => {
    const h = new Date().getHours();
    const timeGreet =
      h < 12 ? 'Good morning' :
        h < 17 ? 'Good afternoon' :
          h < 21 ? 'Good evening' : 'Good night';

    const intro = `${timeGreet}, Sir, Jarvis is now online. All systems are fully operational. Neural sync active, satellite link established, security protocols engaged. I am at your service. How may I assist you today?`;

    setStatus('listening'); // green HUD
    setLogLine('Wake sequence initiated — all systems online');

    setTimeout(() => speak(intro), 300);
  }, [speak]);

  useEffect(() => { wakeUpRef.current = wakeUp; }, [wakeUp]);

  // ── 5. Speech recognition — created ONCE ──────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('Web Speech API not supported. Use Chrome.');
      return;
    }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onstart = () => { recognitionRunning.current = true; };

    r.onresult = (e) => {
      const cur = e.results[e.results.length - 1];
      const raw = cur[0].transcript;

      // Show interim transcript
      if (!cur.isFinal) {
        setTranscript(raw);
        return;
      }

      setTranscript('');
      const text = raw.toLowerCase().trim();

      // Don't process while JARVIS is busy
      if (statusRef.current === 'thinking' || statusRef.current === 'speaking') return;

      if (alwaysOnRef.current) {
        // ── Wake up command ──
        const isWakeUp =
          (text.includes('wake up') && text.includes('jarvis')) ||
          text === 'wake up jarvis' ||
          text === 'hey jarvis wake up';

        if (isWakeUp) {
          wakeUpRef.current?.();
          return;
        }

        // ── Regular command with wake word ──
        const hasWakeWord =
          text.includes('hey jarvis') ||
          text.includes('ok jarvis') ||
          text.startsWith('jarvis');

        if (hasWakeWord) {
          const command = raw
            .replace(/hey jarvis[,.]?/gi, '')
            .replace(/ok jarvis[,.]?/gi, '')
            .replace(/^jarvis[,.]?/gi, '')
            .trim();

          if (command.length > 1) {
            setLogLine(`Command: "${command}"`);
            handleSendRef.current?.(command);
          } else {
            // Said "jarvis" alone — greet
            setLogLine('Awaiting command...');
            setStatus('listening');
          }
        }

      } else {
        // Click-to-talk mode — process whatever was said
        if (statusRef.current === 'listening') {
          handleSendRef.current?.(raw);
        }
      }
    };

    r.onend = () => {
      recognitionRunning.current = false;
      setStatus(s => s === 'listening' ? 'idle' : s);
      // Auto-restart if always-on is active
      if (listeningRef.current) {
        setTimeout(() => {
          if (!recognitionRunning.current) {
            try { r.start(); } catch { }
          }
        }, 400);
      }
    };

    r.onerror = (e) => {
      recognitionRunning.current = false;
      // 'no-speech' and 'aborted' are expected — don't log
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
      // Restart on network errors
      if (listeningRef.current && (e.error === 'network' || e.error === 'service-not-allowed')) {
        setTimeout(() => {
          if (!recognitionRunning.current) {
            try { r.start(); } catch { }
          }
        }, 1000);
      }
    };

    recognitionRef.current = r;

    return () => {
      listeningRef.current = false;
      recognitionRunning.current = false;
      try { r.abort(); } catch { }
    };
  }, []); // ← EMPTY DEPS — created once, never recreated

  // ── Toggle always-on ────────────────────────────────────────────────────────
  const toggleAlwaysOn = () => {
    const next = !alwaysOn;
    setAlwaysOn(next);
    alwaysOnRef.current = next; // sync ref immediately

    if (next) {
      listeningRef.current = true;
      setLogLine('Always-on activated — say "hey jarvis" or "wake up jarvis"');
      setTimeout(safeStart, 200);
    } else {
      listeningRef.current = false;
      safeStop();
      setLogLine('Always-on deactivated');
    }
  };

  // ── Click-to-talk ───────────────────────────────────────────────────────────
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

      {/* ── Animated Background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>

        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.18) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }} />

        {/* Scan line 1 */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.35), transparent)',
          animation: 'scan-bg 5s linear infinite',
        }} />

        {/* Scan line 2 */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)',
          animation: 'scan-bg 9s linear infinite',
          animationDelay: '-4s',
        }} />

        {/* Central radial glow — follows status color */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '900px', height: '900px', borderRadius: '50%',
          background: `radial-gradient(circle, ${statusColor}07 0%, transparent 65%)`,
          animation: 'pulse-glow 3s ease-in-out infinite',
          transition: 'background 1s',
        }} />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: '#00d4ff',
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite, drift-x ${p.driftDur}s ease-in-out ${p.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* ── App layer ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Navbar />

        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', padding: '4px 0', borderBottom: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,5,12,0.88)', flexWrap: 'wrap' }}>

          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: agentConnected ? '#22c55e' : 'rgba(0,212,255,0.3)', letterSpacing: '0.1em' }}>
            {agentConnected ? '● AGENT ONLINE' : '○ AGENT OFFLINE'}
          </span>

          <span style={{ color: 'rgba(0,212,255,0.2)', fontSize: '9px' }}>|</span>

          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: elevenLabsOk ? '#00d4ff' : '#f59e0b', letterSpacing: '0.1em' }}>
            {elevenLabsOk ? '● ELEVENLABS VOICE' : '⚠ BROWSER VOICE'}
          </span>

          <span style={{ color: 'rgba(0,212,255,0.2)', fontSize: '9px' }}>|</span>

          {/* Always-on toggle button */}
          <button
            onClick={toggleAlwaysOn}
            style={{
              fontFamily: 'Share Tech Mono', fontSize: '9px', letterSpacing: '0.1em',
              background: 'none',
              border: `1px solid ${alwaysOn ? '#22c55e' : 'rgba(0,212,255,0.25)'}`,
              color: alwaysOn ? '#22c55e' : 'rgba(0,212,255,0.5)',
              padding: '2px 10px', cursor: 'pointer', borderRadius: '2px',
              transition: 'all 0.3s',
            }}
          >
            {alwaysOn ? '● ALWAYS LISTENING' : '○ CLICK TO TALK'}
          </button>

          {alwaysOn && (
            <>
              <span style={{ color: 'rgba(0,212,255,0.2)', fontSize: '9px' }}>|</span>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.4)', letterSpacing: '0.08em' }}>
                &quot;wake up jarvis&quot; · &quot;hey jarvis, [command]&quot;
              </span>
            </>
          )}
        </div>

        {/* Three-column layout */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '272px 1fr 272px', overflow: 'hidden', minHeight: 0 }}>

          {/* Left */}
          <div style={{ padding: '10px', overflowY: 'auto', borderRight: '1px solid rgba(0,212,255,0.07)' }}>
            <NeuralSync />
            <BioMetrics />
            <AudioVisualizer />
            <SystemLog extraLine={logLine} />
          </div>

          {/* Center */}
          <div
            onClick={handleMicClick}
            style={{ cursor: alwaysOn || status !== 'idle' ? 'default' : 'pointer', position: 'relative' }}
          >
            <CenterHUD status={status} transcript={transcript} />
            {!alwaysOn && status === 'idle' && (
              <div style={{ position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(0,212,255,0.25)' }}>
                CLICK TO ACTIVATE
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ padding: '10px', overflowY: 'auto', borderLeft: '1px solid rgba(0,212,255,0.07)' }}>
            <SystemTopology />
            <SatelliteLink />
            <AtmosphericData />
            <SecurityStatus />
            <SystemTerminal />
          </div>
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}