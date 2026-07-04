'use client';
import { useState, useEffect } from 'react';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    if (h < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
}

// ── Static badge positions — 6 nodes at clock positions, radius 218 ──
// Literal numbers, computed by hand ahead of time (not Math.sin/cos at render)
const BADGES = [
    { x: 250, y: 40, letter: 'C', top: '827.5 GB', bottom: '747.5 GB', arcSide: 'top' },
    { x: 424, y: 130, letter: 'O', top: '929.1 GB', bottom: '827.5 GB', arcSide: 'right' },
    { x: 424, y: 370, letter: 'G', top: '863.3 GB', bottom: '52.6 GB', arcSide: 'right' },
    { x: 250, y: 460, letter: 'P', top: '1.1 TB', bottom: '1.6 TB', arcSide: 'bottom' },
    { x: 76, y: 370, letter: 'B', top: '489.9 GB', bottom: '838.8 GB', arcSide: 'left' },
    { x: 76, y: 130, letter: 'H', top: '1.1 TB', bottom: '8.1 TB', arcSide: 'left' },
];

// ── Static broken-arc segments near the outer ring, matching reference image ──
const OUTER_ARCS = [
    'M 175 62 A 210 210 0 0 1 325 62',       // top arc
    'M 438 175 A 210 210 0 0 1 438 325',     // right arc
    'M 62 175 A 210 210 0 0 0 62 325',       // left arc
    'M 175 438 A 210 210 0 0 0 325 438',     // bottom arc
];

// ── Static segmented ring "slots" — 20 rounded rectangles, literal rotate() angles ──
const SEGMENT_COUNT = 20;

export default function CenterHUD({ status, transcript, streamingText, bootProgress }) {
    const [greeting] = useState(getGreeting);
    const [progressPath, setProgressPath] = useState('');

    const isBooting = status === 'booting';   // ← moved up here, before the useEffect

    useEffect(() => {
        const t = setTimeout(() => {
            const pct = isBooting ? (bootProgress || 0) : 65;
            const angle = pct * 0.0628;
            const x = 250 + 145 * Math.sin(angle);
            const y = 250 - 145 * Math.cos(angle);
            const largeArc = pct > 50 ? 1 : 0;
            setProgressPath(`M 250 105 A 145 145 0 ${isBooting ? largeArc : 1} 1 ${x} ${y}`);
        }, 0);
        return () => clearTimeout(t);
    }, [isBooting, bootProgress]);

    const label = {
        idle: 'Standing by for instructions.',
        listening: 'Listening...',
        thinking: 'Processing query...',
        speaking: 'Relaying response...',
        booting: 'Initializing systems...',
        success: 'Response delivered.',
        error: 'Unable to process request.',
    }[status] || 'Standing by for instructions.';

    const ringColor = {
        idle: '#00d4ff',
        listening: '#22c55e',
        thinking: '#f59e0b',
        speaking: '#a855f7',
        booting: '#00d4ff',
        success: '#22c55e',
        error: '#ef4444',
    }[status] || '#00d4ff';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            <div style={{
                position: 'absolute', width: '520px', height: '520px', borderRadius: '50%',
                background: `radial-gradient(circle, ${ringColor}${status === 'speaking' ? '12' : '06'} 0%, transparent 70%)`,
                pointerEvents: 'none', transition: 'background 0.5s',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
            }} />

            {status === 'speaking' && (
                <>
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', animationDelay: '0.6s', pointerEvents: 'none' }} />
                </>
            )}
            {status === 'listening' && (
                <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1px solid ${ringColor}`, animation: 'sonar 2.4s ease-out infinite', pointerEvents: 'none' }} />
            )}

            <svg viewBox="0 0 500 500" style={{ position: 'absolute', width: '520px', height: '520px' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="sphereG" cx="42%" cy="38%">
                        <stop offset="0%" stopColor="#5efff9" stopOpacity="0.9" />
                        <stop offset="60%" stopColor="#00b8d9" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#001f2e" stopOpacity="0.2" />
                    </radialGradient>
                </defs>

                {/* ── Layer 1: Outer broken arcs (thick, cyan, gapped) — continuous slow rotation ── */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 90s linear infinite' }}>
                    {OUTER_ARCS.map((d, i) => (
                        <path key={i} d={d} fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round" opacity="0.55" />
                    ))}
                </g>

                {/* ── Layer 2: Orange drive badges with connector arcs, values, letter ──
             Counter-rotates slowly so badges drift independently of outer arcs */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin-reverse 120s linear infinite' }}>
                    {BADGES.map((b, i) => {
                        const isRight = b.x > 260;
                        const isLeft = b.x < 240;
                        const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';
                        const tx = b.x + (isRight ? 16 : isLeft ? -16 : 0);
                        return (
                            <g key={i}>
                                {/* Connector line to center-ish */}
                                <line x1={250 + (b.x - 250) * 0.78} y1={250 + (b.y - 250) * 0.78} x2={b.x} y2={b.y}
                                    stroke="#ff8c1a" strokeWidth="0.6" opacity="0.35" />

                                {/* Badge ring */}
                                <circle cx={b.x} cy={b.y} r="14" fill="rgba(0,10,20,0.85)" stroke="#ff8c1a" strokeWidth="1.5" />
                                <circle cx={b.x} cy={b.y} r="14" fill="none" stroke="#ff8c1a" strokeWidth="1.5"
                                    strokeDasharray="66 88" opacity="0.6"
                                    style={{ transformOrigin: `${b.x}px ${b.y}px`, animation: `spin ${6 + i}s linear infinite` }} />
                                <text x={b.x} y={b.y + 4} textAnchor="middle" fill="#ff8c1a" fontSize="11" fontFamily="Orbitron" fontWeight="700">
                                    {b.letter}
                                </text>

                                {/* Two-line values */}
                                <text x={tx} y={b.y - 8} textAnchor={textAnchor} fill="#ff8c1a" fontSize="7" fontFamily="Share Tech Mono" opacity="0.8">
                                    {b.top}
                                </text>
                                <text x={tx} y={b.y + 20} textAnchor={textAnchor} fill="#ff8c1a" fontSize="7" fontFamily="Share Tech Mono" opacity="0.55">
                                    {b.bottom}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* ── Layer 3: Segmented ring — 20 rounded rectangle "slots", continuous rotation ── */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 55s linear infinite' }}>
                    {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
                        const deg = (360 / SEGMENT_COUNT) * i;
                        return (
                            <g key={i} transform={`rotate(${deg} 250 250)`}>
                                <rect x="244" y="78" width="12" height="20" rx="2" fill="rgba(0,18,36,0.6)" stroke={ringColor} strokeWidth="0.7" opacity="0.5" />
                                {i % 3 === 0 && (
                                    <line x1="250" y1="84" x2="250" y2="92" stroke={ringColor} strokeWidth="1" opacity="0.6" />
                                )}
                            </g>
                        );
                    })}
                </g>

                {/* ── Layer 4: Two pill "mode" buttons at top of inner ring ── */}
                <g opacity="0.75">
                    <rect x="212" y="130" width="34" height="14" rx="7" fill="rgba(255,140,26,0.12)" stroke="#ff8c1a" strokeWidth="0.8" />
                    <text x="229" y="140" textAnchor="middle" fill="#ff8c1a" fontSize="5.5" fontFamily="Share Tech Mono">VOICE</text>
                    <rect x="254" y="130" width="34" height="14" rx="7" fill="rgba(0,212,255,0.08)" stroke={ringColor} strokeWidth="0.8" />
                    <text x="271" y="140" textAnchor="middle" fill={ringColor} fontSize="5.5" fontFamily="Share Tech Mono">AUTO</text>
                </g>

                {/* ── Layer 5: Thick dashed rotating ring ── */}
                <circle cx="250" cy="250" r="145" fill="none" stroke={ringColor} strokeWidth="6" strokeDasharray="14 10" opacity="0.55"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 20s linear infinite' }} />

                {/* ── Layer 6: Orange progress arc inside the dashed ring ── */}
                {progressPath && (
                    <path d={progressPath} fill="none" stroke="#ff8c1a" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
                )}

                {/* ── Layer 7: Center core ── */}
                <circle cx="250" cy="250" r="72" fill="url(#sphereG)" />
                <circle cx="250" cy="250" r="72" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.4" />

                {/* Stacked percentage readouts, like reference */}
                <text x="250" y="228" textAnchor="middle" fill={ringColor} fontSize="10" fontFamily="Share Tech Mono" opacity="0.55">73%</text>
                <text x="250" y="242" textAnchor="middle" fill={ringColor} fontSize="9" fontFamily="Share Tech Mono" opacity="0.4">45%</text>
                <text x="250" y="256" textAnchor="middle" fill="#ff8c1a" fontSize="9" fontFamily="Share Tech Mono" opacity="0.6">23%</text>

                {/* Small CPU readout circle at bottom of core, like reference */}
                <circle cx="250" cy="278" r="16" fill="rgba(0,10,20,0.7)" stroke={ringColor} strokeWidth="1" opacity="0.7" />
                <text x="250" y="275" textAnchor="middle" fill={ringColor} fontSize="6" fontFamily="Orbitron" opacity="0.7">CPU</text>
                <text x="250" y="285" textAnchor="middle" fill={ringColor} fontSize="6" fontFamily="Share Tech Mono" opacity="0.55">8%</text>
            </svg>

            {/* Left side vertical text list — matches reference's app/media list */}
            <div style={{
                position: 'absolute', left: '2%', top: '38%', textAlign: 'left', pointerEvents: 'none',
                fontFamily: 'Share Tech Mono', fontSize: '7px', color: '#ff8c1a', opacity: 0.55, lineHeight: '1.8',
            }}>
                <div>MEDIA</div>
                <div>SEARCH</div>
                <div>ANALYSIS</div>
                <div>MONITOR</div>
                <div>DIAGNOSTICS</div>
                <div>NETWORK</div>
            </div>

            {/* Top right readout — temperature/timestamp style, matches reference */}
            <div style={{
                position: 'absolute', right: '4%', top: '10%', textAlign: 'right', pointerEvents: 'none',
                fontFamily: 'Share Tech Mono', fontSize: '8px', color: ringColor, opacity: 0.6,
            }}>
                <div style={{ fontSize: '6px', opacity: 0.6 }}>UPDATED {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '16px', marginTop: '2px' }}>
                    {new Date().getHours() < 12 ? '18°C' : '24°C'}
                </div>
            </div>

            {/* Greeting + status */}
            <div style={{ position: 'absolute', bottom: '6%', textAlign: 'center', pointerEvents: 'none' }}>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '15px', fontWeight: '700', letterSpacing: '0.25em', color: ringColor, transition: 'color 0.3s', marginBottom: '8px' }}>
                    {isBooting ? 'INITIALIZING' : `${greeting}, SIR`}
                </div>
                <div className="jarvis-live-data" style={{
                    fontFamily: 'Share Tech Mono', fontSize: '11px',
                    color: ringColor,
                    letterSpacing: '0.1em',
                    fontStyle: transcript ? 'normal' : 'italic',
                    transition: 'color 0.3s',
                }}>
                    {transcript || streamingText || label}
                </div>
            </div>
        </div>
    );
}