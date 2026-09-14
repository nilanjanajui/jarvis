'use client';

import { useState } from 'react';

const ARCHITECTURE_NODES = [
    {
        id: 'client',
        title: 'FRONTEND CLIENT LAYER',
        tech: 'Next.js 16 App Router · React 19 · Three.js',
        desc: 'Custom WebGL particle canvas (Arc Reactor 3D), audio FFT spectrum visualizer, and draggable HUD state management.',
        badge: 'UI & Graphics Engine',
        metrics: '60 FPS WebGL · Web Audio FFT · CSS Glassmorphism',
    },
    {
        id: 'ai',
        title: 'NEURAL REASONING & ROUTING',
        tech: 'Groq Llama 3.3 70B · Serper Web API · wttr.in',
        desc: 'Streams low-latency responses, handles tool dispatching (weather, search, calc, timers), and maintains conversation context.',
        badge: 'Streaming LLM Core',
        metrics: '<350ms TTFT · Multi-tool Dispatch · Autonomous Functions',
    },
    {
        id: 'voice',
        title: 'VOICE & AUDIO SYNTHESIS',
        tech: 'ElevenLabs Speech AI · Web Speech API · Web Audio Synth',
        desc: 'Continuous wake-word listening ("Hey JARVIS"), synthesized sci-fi sound effects (boot up, click, denied), and natural speech output.',
        badge: 'Audio Biometrics',
        metrics: 'Dual TTS Fallback · Procedural Audio Synthesis',
    },
    {
        id: 'ipc',
        title: 'LOCAL AGENT IPC BRIDGE',
        tech: 'Python 3 · Flask-Sock · WebSockets · psutil',
        desc: 'Bi-directional WebSocket server (ws://localhost:5002) for real-time CPU/RAM/Disk stats streaming and desktop app control.',
        badge: 'Native OS Companion',
        metrics: '1-Sec Telemetry Stream · App Launcher · Process Control',
    },
];

export default function AboutModal({ onClose }) {
    const [selectedNode, setSelectedNode] = useState(ARCHITECTURE_NODES[0]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(2, 6, 14, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div className="hud-card hud-card-accented" style={{
                maxWidth: '780px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'rgba(0, 18, 36, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                boxShadow: '0 0 50px rgba(0, 212, 255, 0.25), inset 0 0 25px rgba(0, 212, 255, 0.08)',
                padding: '28px',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', paddingBottom: '14px' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Orbitron', fontSize: '20px', fontWeight: '900', color: '#00d4ff', letterSpacing: '0.2em', margin: 0, textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>
                            J.A.R.V.I.S. SYSTEM ARCHITECTURE
                        </h2>
                        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.1em' }}>
                            INTERACTIVE SYSTEM COMPONENT FLOW & ENGINE SPECIFICATIONS
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            fontFamily: 'Orbitron',
                            fontSize: '12px',
                            background: 'none',
                            border: '1px solid rgba(0, 212, 255, 0.4)',
                            color: '#00d4ff',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            transition: 'all 0.2s',
                        }}
                    >
                        ✕ CLOSE
                    </button>
                </div>

                {/* Interactive Flow Diagram */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: '11px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.15em', marginBottom: '10px' }}>
                        SELECT A SYSTEM NODE TO INSPECT DATA FLOW:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                        {ARCHITECTURE_NODES.map((node) => {
                            const isSelected = selectedNode.id === node.id;
                            return (
                                <button
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    style={{
                                        background: isSelected ? 'rgba(0, 212, 255, 0.18)' : 'rgba(0, 212, 255, 0.04)',
                                        border: isSelected ? '1px solid #00d4ff' : '1px solid rgba(0, 212, 255, 0.2)',
                                        boxShadow: isSelected ? '0 0 15px rgba(0, 212, 255, 0.3)' : 'none',
                                        padding: '12px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '2px',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: isSelected ? '#00ff88' : 'rgba(0,212,255,0.5)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                        [{node.badge}]
                                    </div>
                                    <div style={{ fontFamily: 'Orbitron', fontSize: '11px', fontWeight: '700', color: isSelected ? '#ffffff' : '#00d4ff' }}>
                                        {node.title}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Node Detail Box */}
                <div style={{
                    background: 'rgba(0, 212, 255, 0.05)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    padding: '16px',
                    borderRadius: '2px',
                    marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'Orbitron', fontSize: '14px', color: '#00d4ff', fontWeight: '800', letterSpacing: '0.1em' }}>
                            {selectedNode.title}
                        </span>
                        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)', padding: '2px 8px' }}>
                            {selectedNode.badge}
                        </span>
                    </div>

                    <div style={{ fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#7fe8ff', marginBottom: '8px' }}>
                        ⚡ Tech Stack: {selectedNode.tech}
                    </div>

                    <p style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                        {selectedNode.desc}
                    </p>

                    <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.7)', background: 'rgba(0, 18, 36, 0.6)', padding: '6px 10px', borderLeft: '3px solid #00d4ff' }}>
                        BENCHMARK / CAPACITY: {selectedNode.metrics}
                    </div>
                </div>

                {/* Tech Highlights Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '10px' }}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '10px', color: '#7fe8ff', marginBottom: '2px' }}>
                            RECRUITER / ARCHITECTURE HIGHLIGHT
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>
                            Hybrid Client-Side & Local IPC Security Boundary architecture separating browser sandboxing from OS level desktop automation.
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '10px' }}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '10px', color: '#7fe8ff', marginBottom: '2px' }}>
                            GRAPHICS & AUDIO PIPELINE
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>
                            Real-time 1,400 particle WebGL shader turbulence driven by Web Audio API FFT frequency analysis and status state machines.
                        </div>
                    </div>
                </div>

                {/* Footer status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 212, 255, 0.05)', padding: '10px 14px', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                    <span style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#00ff88', letterSpacing: '0.1em' }}>
                        ● ARCHITECTURE VERIFIED · FULL-STACK IPC ACTIVE
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            fontFamily: 'Orbitron',
                            fontSize: '11px',
                            background: 'rgba(0, 212, 255, 0.15)',
                            border: '1px solid #00d4ff',
                            color: '#00d4ff',
                            padding: '6px 18px',
                            cursor: 'pointer',
                            letterSpacing: '0.1em',
                        }}
                    >
                        RETURN TO DASHBOARD
                    </button>
                </div>
            </div>
        </div>
    );
}

