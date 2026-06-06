'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Navbar          from '@/components/Navbar';
import NeuralSync      from '@/components/NeuralSync';
import BioMetrics      from '@/components/BioMetrics';
import AudioVisualizer from '@/components/AudioVisualizer';
import SystemLog       from '@/components/SystemLog';
import CenterHUD       from '@/components/CenterHUD';
import SystemTopology  from '@/components/SystemTopology';
import SatelliteLink   from '@/components/SatelliteLink';
import AtmosphericData from '@/components/AtmosphericData';
import SecurityStatus  from '@/components/SecurityStatus';
import SystemTerminal  from '@/components/SystemTerminal';

const AGENT = 'http://localhost:5001';

export default function JarvisPage() {
  const [status,         setStatus]         = useState('idle');
  const [transcript,     setTranscript]     = useState('');
  const [messages,       setMessages]       = useState([]);
  const [logLine,        setLogLine]        = useState('');
  const [elevenLabsOk,   setElevenLabsOk]   = useState(true);
  const [agentConnected, setAgentConnected] = useState(false);

  const recognitionRef = useRef(null);
  const audioRef       = useRef(null);
  const messagesRef    = useRef(messages);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Agent connection check
  useEffect(() => {
    const check = () =>
      fetch(`${AGENT}/health`)
        .then(() => setAgentConnected(true))
        .catch(() => setAgentConnected(false));
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  // ── 1. speak (defined first — no dependency on other functions) ──
  const speak = useCallback(async (text) => {
    setStatus('speaking');
    if (elevenLabsOk) {
      try {
        const res = await fetch('/api/speak', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        audioRef.current.src     = url;
        audioRef.current.onended = () => { setStatus('idle'); URL.revokeObjectURL(url); };
        await audioRef.current.play();
        return;
      } catch {
        setElevenLabsOk(false);
      }
    }
    // Browser TTS fallback
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = 1;
    u.pitch = 0.85;
    u.onend = () => setStatus('idle');
    speechSynthesis.speak(u);
  }, [elevenLabsOk]);

  // ── 2. executeAction (depends on agentConnected) ──
  const executeAction = useCallback(async (action) => {
    if (!action) return;
    if (action.type === 'open_url') {
      window.open(action.url, '_blank');
      setLogLine(`Opening ${action.site_name} in browser`);
      return;
    }
    if (action.type === 'open_app' && agentConnected) {
      await fetch(`${AGENT}/execute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ app: action.app }),
      });
      setLogLine(`Launching ${action.app}`);
      return;
    }
    if (action.type === 'volume' && agentConnected) {
      await fetch(`${AGENT}/volume`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: action.action }),
      });
      setLogLine(`Volume ${action.action}`);
    }
  }, [agentConnected]);

  // ── 3. handleSend (depends on speak + executeAction, so defined after both) ──
  const handleSend = useCallback(async (text) => {
    if (!text?.trim()) return;
    setStatus('thinking');
    setTranscript('');
    const history = [...messagesRef.current, { role: 'user', content: text.trim() }];
    setMessages(history);
    setLogLine(`Processing: "${text.trim().slice(0, 40)}..."`);
    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      });
      const { reply, action } = await res.json();
      setMessages([...history, { role: 'assistant', content: reply }]);
      setLogLine('Response ready — relaying...');
      await Promise.all([executeAction(action), speak(reply)]);
    } catch {
      setStatus('idle');
      setLogLine('Error: chat request failed');
    }
  }, [executeAction, speak]);

  // ── 4. Speech recognition (depends on handleSend, so comes after it) ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r          = new SR();
    r.continuous     = false;
    r.interimResults = true;
    r.lang           = 'en-US';
    r.onresult = (e) => {
      const cur = e.results[e.results.length - 1];
      setTranscript(cur[0].transcript);
      if (cur.isFinal) handleSend(cur[0].transcript);
    };
    r.onend   = () => setStatus((s) => s === 'listening' ? 'idle' : s);
    r.onerror = () => setStatus('idle');
    recognitionRef.current = r;
  }, [handleSend]);

  const handleMicClick = () => {
    if (status !== 'idle') return;
    setStatus('listening');
    recognitionRef.current?.start();
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#060b14', overflow: 'hidden' }}>
      <Navbar />

      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '4px 0', borderBottom: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,5,12,0.8)' }}>
        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: agentConnected ? '#22c55e' : 'rgba(0,212,255,0.3)', letterSpacing: '0.1em' }}>
          {agentConnected ? '● AGENT ONLINE' : '○ AGENT OFFLINE'}
        </span>
        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.3)', letterSpacing: '0.1em' }}>|</span>
        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: elevenLabsOk ? '#00d4ff' : '#f59e0b', letterSpacing: '0.1em' }}>
          {elevenLabsOk ? '● ELEVENLABS VOICE' : '⚠ BROWSER VOICE'}
        </span>
        {!agentConnected && (
          <>
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.3)', letterSpacing: '0.1em' }}>|</span>
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(255,180,0,0.6)', letterSpacing: '0.1em' }}>
              run: python agent.py to enable desktop apps
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
        <div onClick={handleMicClick} style={{ cursor: status === 'idle' ? 'pointer' : 'default', position: 'relative' }}>
          <CenterHUD status={status} transcript={transcript} />
          {status === 'idle' && (
            <div style={{ position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(0,212,255,0.3)' }}>
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

      <audio ref={audioRef} />
    </div>
  );
}