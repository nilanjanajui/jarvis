'use client';
import { useState, useEffect } from 'react';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    if (h < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
}

// Pre-calculated node positions (8 compass points, radius 205 from center 250,250)
// Computed by hand, not at render time — avoids server/client trig mismatches.
const NODES = [
    { x: 250, y: 45, label: 'CPU', value: '73%', angle: 0 },
    { x: 395, y: 105, label: 'MEM', value: '45%', angle: 45 },
    { x: 455, y: 250, label: 'NET', value: '892', angle: 90 },
    { x: 395, y: 395, label: 'PWR', value: '99%', angle: 135 },
    { x: 250, y: 455, label: 'TEMP', value: '36°', angle: 180 },
    { x: 105, y: 395, label: 'SYNC', value: '100%', angle: 225 },
    { x: 45, y: 250, label: 'SEC', value: 'OK', angle: 270 },
    { x: 105, y: 105, label: 'COMM', value: '14ms', angle: 315 },
];

// Decorative progress fractions per node (static, stylistic — like the reference image)
const NODE_PROGRESS = [0.73, 0.45, 0.6, 0.99, 0.36, 1, 0.85, 0.7];

export default function CenterHUD({ status, transcript, streamingText, bootProgress }) {
    const [greeting] = useState(getGreeting);
    const [ticks, setTicks] = useState([]);
    const [scanPath, setScanPath] = useState('');

    useEffect(() => {
        const t = setTimeout(() => {
            const computedTicks = Array.from({ length: 36 }, (_, i) => {
                const deg = i * 10;
                const rad = (deg * Math.PI) / 180;
                const isMajor = deg % 30 === 0;
                const r1 = 232, r2 = isMajor ? 220 : 226;
                return {
                    x1: 250 + r1 * Math.cos(rad),
                    y1: 250 + r1 * Math.sin(rad),
                    x2: 250 + r2 * Math.cos(rad),
                    y2: 250 + r2 * Math.sin(rad),
                    isMajor,
                };
            });
            setTicks(computedTicks);

            const sx = 250 + 210 * Math.sin(Math.PI / 5);
            const sy = 250 - 210 * Math.cos(Math.PI / 5);
            setScanPath(`M250,250 L250,${250 - 210} A210,210 0 0,1 ${sx},${sy} Z`);
        }, 0);
        return () => clearTimeout(t);
    }, []);

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

    const scanSpeed = status === 'idle' ? '8s' : '2.5s';
    const isBooting = status === 'booting';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            <div style={{
                position: 'absolute', width: '480px', height: '480px', borderRadius: '50%',
                background: `radial-gradient(circle, ${ringColor}${status === 'speaking' ? '12' : '06'} 0%, transparent 70%)`,
                pointerEvents: 'none', transition: 'background 0.5s',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
            }} />

            {status === 'speaking' && (
                <>
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', animationDelay: '0.6s', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', animationDelay: '1.2s', pointerEvents: 'none' }} />
                </>
            )}
            {status === 'listening' && (
                <>
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1px solid ${ringColor}`, animation: 'sonar 2.4s ease-out infinite', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1px solid ${ringColor}`, animation: 'sonar 2.4s ease-out infinite', animationDelay: '0.8s', pointerEvents: 'none' }} />
                </>
            )}

            <svg viewBox="0 0 500 500" style={{ position: 'absolute', width: '480px', height: '480px' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="sphereG" cx="38%" cy="32%">
                        <stop offset="0%" stopColor="#5efff9" />
                        <stop offset="40%" stopColor="#00b8d9" />
                        <stop offset="100%" stopColor="#001f2e" />
                    </radialGradient>
                    <radialGradient id="glowG" cx="50%" cy="50%">
                        <stop offset="0%" stopColor={ringColor} stopOpacity={status === 'speaking' ? '0.35' : '0.2'} />
                        <stop offset="100%" stopColor={ringColor} stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="scanG">
                        <stop offset="0%" stopColor={ringColor} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={ringColor} stopOpacity="0" />
                    </linearGradient>
                    <clipPath id="sphereClip">
                        <circle cx="250" cy="250" r="63" />
                    </clipPath>
                </defs>

                {/* ── Outer node ring — continuously rotating, always ── */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 60s linear infinite' }}>
                    <circle cx="250" cy="250" r="205" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.2" />

                    {NODES.map((n, i) => (
                        <g key={i}>
                            {/* Connector line from node to ring */}
                            <line x1={250 + (n.x - 250) * 0.82} y1={250 + (n.y - 250) * 0.82} x2={n.x} y2={n.y}
                                stroke={ringColor} strokeWidth="0.6" opacity="0.3" />

                            {/* Progress arc behind node — decorative, static */}
                            <circle cx={n.x} cy={n.y} r="13" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="2" />
                            <circle cx={n.x} cy={n.y} r="13" fill="none" stroke="#ff8c1a" strokeWidth="2"
                                strokeDasharray={`${NODE_PROGRESS[i] * 81.7} 82`}
                                transform={`rotate(-90 ${n.x} ${n.y})`}
                                opacity="0.85" />

                            {/* Node circle */}
                            <circle cx={n.x} cy={n.y} r="9" fill="rgba(0,10,20,0.8)" stroke="#ff8c1a" strokeWidth="1" />
                            <text x={n.x} y={n.y + 3} textAnchor="middle" fill="#ff8c1a" fontSize="7" fontFamily="Orbitron" fontWeight="700">
                                {n.label[0]}
                            </text>

                            {/* Label + value */}
                            <text
                                x={n.x + (n.x > 250 ? 14 : n.x < 250 ? -14 : 0)}
                                y={n.y - 4}
                                textAnchor={n.x > 250 ? 'start' : n.x < 250 ? 'end' : 'middle'}
                                fill="#ff8c1a" fontSize="6" fontFamily="Share Tech Mono" opacity="0.7"
                            >
                                {n.label}
                            </text>
                            <text
                                x={n.x + (n.x > 250 ? 14 : n.x < 250 ? -14 : 0)}
                                y={n.y + 8}
                                textAnchor={n.x > 250 ? 'start' : n.x < 250 ? 'end' : 'middle'}
                                fill={ringColor} fontSize="6" fontFamily="Share Tech Mono" opacity="0.6"
                            >
                                {n.value}
                            </text>
                        </g>
                    ))}
                </g>

                {/* Outermost dashed ring — continuous */}
                <circle cx="250" cy="250" r="240" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="3 9" opacity="0.3"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 32s linear infinite' }} />

                {/* Dense degree tick ring — continuous */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 50s linear infinite' }}>
                    {ticks.map((t, i) => (
                        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={ringColor} strokeWidth={t.isMajor ? 1.3 : 0.4} opacity={t.isMajor ? 0.5 : 0.28} />
                    ))}
                </g>

                {/* ── Segmented tick ring — 16 rectangles, rotates continuously ──
             Uses SVG rotate() with literal integer degrees, not JS Math.sin/cos,
             so it's rendered identically server and client — no hydration risk. */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin-reverse 24s linear infinite' }}>
                    {Array.from({ length: 16 }, (_, i) => (
                        <g key={i} transform={`rotate(${i * 22.5} 250 250)`}>
                            <rect x="246" y="60" width="8" height="16" rx="1" fill="none" stroke={ringColor} strokeWidth="0.8" opacity="0.4" />
                        </g>
                    ))}
                </g>

                {/* Mid dashed ring — reverse */}
                <circle cx="250" cy="250" r="172" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="2 6" opacity="0.35"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 38s linear infinite reverse' }} />

                {/* Status arc — boot / activity percentage */}
                <g opacity="0.6">
                    <path d="M 140 340 A 155 155 0 0 0 360 340" fill="none" stroke={ringColor} strokeWidth="3" strokeDasharray="4 3" opacity="0.5" />
                    <path
                        d={`M 140 340 A 155 155 0 0 0 ${140 + (360 - 140) * (isBooting ? (bootProgress || 0) / 100 : 1)} 340`}
                        fill="none" stroke={ringColor} strokeWidth="3" opacity="0.9"
                        style={{ transition: 'd 0.3s linear' }}
                    />
                </g>

                {/* Inner ring — continuous */}
                <circle cx="250" cy="250" r="140" fill="none" stroke={ringColor} strokeWidth="1.2" opacity="0.5"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 70s linear infinite reverse' }} />

                {/* Scanning sweep */}
                {scanPath && (
                    <g style={{ transformOrigin: '250px 250px', animation: `spin ${scanSpeed} linear infinite` }}>
                        <path d={scanPath} fill="url(#scanG)" opacity="0.55" />
                    </g>
                )}

                {/* Cardinal ticks */}
                <line x1="250" y1="10" x2="250" y2="32" stroke={ringColor} strokeWidth="2" opacity="0.6" />
                <line x1="250" y1="468" x2="250" y2="490" stroke={ringColor} strokeWidth="2" opacity="0.6" />
                <line x1="10" y1="250" x2="32" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.6" />
                <line x1="468" y1="250" x2="490" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.6" />

                {/* Pulsing glow behind sphere */}
                <circle cx="250" cy="250" r="95" fill="url(#glowG)"
                    style={{ animation: `pulse-glow ${status === 'speaking' ? '0.8s' : '2.5s'} ease-in-out infinite` }} />

                {/* Dashed ring around sphere — continuous, always spinning */}
                <circle cx="250" cy="250" r="82" fill="none" stroke={ringColor} strokeWidth="1" strokeDasharray="10 5" opacity="0.55"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 6s linear infinite' }} />

                {/* Main sphere base */}
                <circle cx="250" cy="250" r="64" fill="url(#sphereG)" />

                {/* Internal turbulence blobs */}
                <g clipPath="url(#sphereClip)">
                    <ellipse className="jarvis-blob-1" cx="238" cy="242" rx="34" ry="26" fill={ringColor} opacity="0.5" style={{ transformOrigin: '238px 242px', filter: 'blur(6px)' }} />
                    <ellipse className="jarvis-blob-2" cx="262" cy="258" rx="28" ry="22" fill="#5efff9" opacity="0.4" style={{ transformOrigin: '262px 258px', filter: 'blur(7px)' }} />
                    <ellipse className="jarvis-blob-3" cx="248" cy="268" rx="22" ry="18" fill={ringColor} opacity="0.35" style={{ transformOrigin: '248px 268px', filter: 'blur(5px)' }} />
                </g>

                {/* Specular */}
                <ellipse cx="234" cy="232" rx="13" ry="8" fill="rgba(200,255,255,0.12)" transform="rotate(-25 234 232)" />

                {status === 'speaking' && (
                    <circle cx="250" cy="250" r="110" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="5 3" opacity="0.4"
                        style={{ transformOrigin: '250px 250px', animation: 'spin 1.5s linear infinite reverse' }} />
                )}

                {/* Central readout — stacked percentages, decorative like the reference */}
                <text x="250" y="238" textAnchor="middle" fill={ringColor} fontSize="9" fontFamily="Share Tech Mono" opacity="0.35">73%</text>
                <text x="250" y="222" textAnchor="middle" fill={ringColor} fontSize="7" fontFamily="Share Tech Mono" opacity="0.25">45%</text>
                <text x="250" y="268" textAnchor="middle" fill="#ff8c1a" fontSize="7" fontFamily="Share Tech Mono" opacity="0.4">23%</text>
            </svg>

            {/* Greeting + status */}
            <div style={{ position: 'absolute', bottom: '10%', textAlign: 'center', pointerEvents: 'none' }}>
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