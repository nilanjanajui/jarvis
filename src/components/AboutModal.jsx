'use client';

export default function AboutModal({ onClose }) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(2, 6, 14, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div className="hud-card hud-card-accented" style={{
                maxWidth: '620px',
                width: '100%',
                background: 'rgba(0, 18, 36, 0.92)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                boxShadow: '0 0 40px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.05)',
                padding: '28px',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', paddingBottom: '12px' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Orbitron', fontSize: '20px', fontWeight: '900', color: '#00d4ff', letterSpacing: '0.2em', margin: 0, textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>
                            J.A.R.V.I.S. SYSTEM ARCHITECTURE
                        </h2>
                        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.1em' }}>
                            JUST A RATHER VERY INTELLIGENT SYSTEM · v4.2.0-ULTRA
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            fontFamily: 'Orbitron',
                            fontSize: '12px',
                            background: 'none',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
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

                {/* Specs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '12px' }}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '11px', color: '#7fe8ff', marginBottom: '4px', letterSpacing: '0.1em' }}>
                            CORE AI ENGINE
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#00d4ff' }}>
                            Neural Synapse Protocol v2.5
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.5)', marginTop: '4px' }}>
                            Natural Language Intent Recognition & Dynamic Memory Recall
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '12px' }}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '11px', color: '#7fe8ff', marginBottom: '4px', letterSpacing: '0.1em' }}>
                            AUDIO SYNTHESIZER
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#00d4ff' }}>
                            ElevenLabs Voice AI + Browser TTS
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.5)', marginTop: '4px' }}>
                            Ultra-low latency streaming voice responses & ambient audio HUD feedback
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '12px' }}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '11px', color: '#7fe8ff', marginBottom: '4px', letterSpacing: '0.1em' }}>
                            3D HOLOGRAM MATRIX
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#00d4ff' }}>
                            Three.js Quantum Particle WebGL Engine
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.5)', marginTop: '4px' }}>
                            Interactive arc reactor core & live audio reactive particle turbulence
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.15)', padding: '12px' }}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '11px', color: '#7fe8ff', marginBottom: '4px', letterSpacing: '0.1em' }}>
                            TACTICAL SUITE
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#00d4ff' }}>
                            Calc / Timers / System Terminal / Notes
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.5)', marginTop: '4px' }}>
                            Draggable HUD card elements with persistent layout coordinates
                        </div>
                    </div>
                </div>

                {/* Footer status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 212, 255, 0.05)', padding: '10px 14px', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                    <span style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#22c55e', letterSpacing: '0.1em' }}>
                        ● ALL SYSTEMS OPERATIONAL · STACK HEALTH 100%
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            fontFamily: 'Orbitron',
                            fontSize: '11px',
                            background: 'rgba(0, 212, 255, 0.15)',
                            border: '1px solid #00d4ff',
                            color: '#00d4ff',
                            padding: '4px 16px',
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
