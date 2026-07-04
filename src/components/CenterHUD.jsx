'use client';
import { useState, useEffect } from 'react';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    if (h < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
}

// ── Design tokens, from spec ──
const TOKENS = {
    primary: '#00F5FF',
    secondary: '#00D9E8',
    accent: '#FF6A00',
    text: '#EAFDFF',
    grid: '#10353C',
    radiusOuter: 220, // scaled down from 350 to fit our 500x500 viewBox (center at 250,250)
    radiusMain: 170,
    radiusInner: 120,
    radiusCore: 46,
};

// ── Layer 3: Six data nodes, evenly spaced (60° apart), literal pre-computed coords ──
// radius 220 from center (250,250), angles 0/60/120/180/240/300
const DATA_NODES = [
    { x: 250, y: 30, label: 'CPU', value: '73.15' },
    { x: 440, y: 140, label: 'RAM', value: '45.02' },
    { x: 440, y: 360, label: 'NET', value: '892.4' },
    { x: 250, y: 470, label: 'SYS', value: '99.81' },
    { x: 60, y: 360, label: 'CTRL', value: '36.60' },
    { x: 60, y: 140, label: 'COM', value: '14.20' },
];

// ── Layer 2: Outer broken ring — segments with 15° gaps ──
// Precomputed arc paths at radius 220, each segment ~45° with 15° gaps between
const OUTER_ARC_SEGMENTS = [
    'M 407.8 91.2 A 220 220 0 0 1 447.1 217.4',
    'M 447.1 282.6 A 220 220 0 0 1 407.8 408.8',
    'M 342.6 465.5 A 220 220 0 0 1 217.4 469.9',
    'M 152.6 465.5 A 220 220 0 0 1 92.2 408.8',
    'M 52.9 282.6 A 220 220 0 0 1 52.9 217.4',
    'M 92.2 91.2 A 220 220 0 0 1 152.6 34.5',
];

// ── Layer 4: Main segmented ring — 22 blocks ──
const MAIN_RING_BLOCKS = 22;

// ── Layer 5: Inner rotating broken ring — 18 segments ──
const INNER_RING_SEGMENTS = 18;

export default function CenterHUD({ status, transcript, streamingText, bootProgress }) {
    const [greeting] = useState(getGreeting);
    const isBooting = status === 'booting';

    const [cpuArcPath, setCpuArcPath] = useState('');
    const [innerArcPath, setInnerArcPath] = useState('');

    // Two CPU progress rings (75% outer / 45% inner per spec) — computed once client-side
    useEffect(() => {
        const t = setTimeout(() => {
            const outerPct = isBooting ? (bootProgress || 0) : 75;
            const innerPct = isBooting ? Math.min(100, (bootProgress || 0) * 1.3) : 45;

            const arcFor = (radius, pct) => {
                const angle = (pct / 100) * 360 * (Math.PI / 180);
                const x = 250 + radius * Math.sin(angle);
                const y = 250 - radius * Math.cos(angle);
                const largeArc = pct > 50 ? 1 : 0;
                return `M 250 ${250 - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`;
            };

            setCpuArcPath(arcFor(56, outerPct));
            setInnerArcPath(arcFor(44, innerPct));
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
        idle: TOKENS.primary,
        listening: '#22c55e',
        thinking: '#f59e0b',
        speaking: '#a855f7',
        booting: TOKENS.primary,
        success: '#22c55e',
        error: '#ef4444',
    }[status] || TOKENS.primary;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Background glow */}
            <div style={{
                position: 'absolute', width: '540px', height: '540px', borderRadius: '50%',
                background: `radial-gradient(circle, ${ringColor}${status === 'speaking' ? '14' : '08'} 0%, transparent 70%)`,
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

            <svg viewBox="0 0 500 500" style={{ position: 'absolute', width: '540px', height: '540px' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="coreGrad" cx="42%" cy="38%">
                        <stop offset="0%" stopColor="#bafcff" stopOpacity="0.95" />
                        <stop offset="55%" stopColor={TOKENS.primary} stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#001f24" stopOpacity="0.15" />
                    </radialGradient>
                    <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* ── Layer 1: Background grid dots + cross markers, 15% opacity ── */}
                <g opacity="0.15">
                    {Array.from({ length: 8 }, (_, i) => (
                        <circle key={`dot-${i}`} cx={60 + i * 50} cy={40} r="1" fill={TOKENS.grid} />
                    ))}
                    <line x1="20" y1="250" x2="35" y2="250" stroke={TOKENS.grid} strokeWidth="1" />
                    <line x1="465" y1="250" x2="480" y2="250" stroke={TOKENS.grid} strokeWidth="1" />
                    <line x1="250" y1="20" x2="250" y2="35" stroke={TOKENS.grid} strokeWidth="1" />
                    <line x1="250" y1="465" x2="250" y2="480" stroke={TOKENS.grid} strokeWidth="1" />
                </g>

                {/* ── Layer 2: Outer broken ring — 8px stroke, radius 220, 30s rotation ── */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 30s linear infinite' }} filter="url(#glowFilter)">
                    {OUTER_ARC_SEGMENTS.map((d, i) => (
                        <path key={i} d={d} fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round" opacity="0.75" />
                    ))}
                </g>

                {/* ── Layer 3: Six data nodes — orange outer stroke, cyan inner circle ── */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin-reverse 45s linear infinite' }}>
                    {DATA_NODES.map((n, i) => {
                        const isRight = n.x > 260;
                        const isLeft = n.x < 240;
                        const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle';
                        const tx = n.x + (isRight ? 16 : isLeft ? -16 : 0);
                        return (
                            <g key={i} className="jarvis-amber-pulse" style={{ animationDelay: `${i * 0.4}s` }}>
                                <circle cx={n.x} cy={n.y} r="15" fill="rgba(6,20,26,0.85)" stroke={TOKENS.accent} strokeWidth="2" />
                                <circle cx={n.x} cy={n.y} r="10" fill="none" stroke={TOKENS.primary} strokeWidth="1.2" opacity="0.7" />
                                <text x={n.x} y={n.y - 20 * Math.sign(n.y - 250 || -1)} textAnchor="middle" fill={TOKENS.accent} fontSize="6" fontFamily="Orbitron" letterSpacing="0.1em" opacity="0.85">
                                    {n.label}
                                </text>
                                <text x={n.x} y={n.y + 3} textAnchor="middle" fill={TOKENS.text} fontSize="6.5" fontFamily="Share Tech Mono" opacity="0.9">
                                    {n.value}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* ── Layer 4: Main segmented ring — 22 blocks, 2px cyan stroke, corner radius 4 ── */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 55s linear infinite' }}>
                    {Array.from({ length: MAIN_RING_BLOCKS }, (_, i) => {
                        const deg = (360 / MAIN_RING_BLOCKS) * i;
                        return (
                            <g key={i} transform={`rotate(${deg} 250 250)`}>
                                <rect x="243" y="82" width="14" height="18" rx="4" fill="rgba(0,18,36,0.5)" stroke={TOKENS.primary} strokeWidth="2" opacity="0.5" />
                            </g>
                        );
                    })}
                </g>

                {/* ── Layer 5: Inner rotating broken ring — 18 segments, 8px stroke, 20s reverse ── */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin-reverse 20s linear infinite' }}>
                    {Array.from({ length: INNER_RING_SEGMENTS }, (_, i) => {
                        const deg = (360 / INNER_RING_SEGMENTS) * i;
                        return (
                            <g key={i} transform={`rotate(${deg} 250 250)`}>
                                <path d="M 250 130 A 120 120 0 0 1 260 130.4" fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round" opacity="0.55" />
                            </g>
                        );
                    })}
                </g>

                {/* ── Layer 6: CPU dual progress rings — outer 75% orange, inner 45% cyan ── */}
                <circle cx="250" cy="250" r="56" fill="none" stroke={TOKENS.grid} strokeWidth="5" opacity="0.4" />
                {cpuArcPath && (
                    <path d={cpuArcPath} fill="none" stroke={TOKENS.accent} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
                )}
                <circle cx="250" cy="250" r="44" fill="none" stroke={TOKENS.grid} strokeWidth="4" opacity="0.4" />
                {innerArcPath && (
                    <path d={innerArcPath} fill="none" stroke={TOKENS.primary} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                )}

                {/* ── Layer 7: Core — small central circle, glowing cyan border ── */}
                <circle cx="250" cy="250" r={TOKENS.radiusCore} fill="url(#coreGrad)" filter="url(#glowFilter)"
                    style={{ transformOrigin: '250px 250px', animation: 'core-scale 2s ease-in-out infinite' }} />
                <circle cx="250" cy="250" r={TOKENS.radiusCore} fill="none" stroke={TOKENS.primary} strokeWidth="1.5" opacity="0.8" />
                <text x="250" y="245" textAnchor="middle" fill={TOKENS.primary} fontSize="8" fontFamily="Orbitron" letterSpacing="0.1em" opacity="0.85">
                    CPU
                </text>
                <text x="250" y="260" textAnchor="middle" fill={TOKENS.text} fontSize="11" fontFamily="Share Tech Mono" fontWeight="700">
                    {isBooting ? `${Math.round(bootProgress || 0)}%` : '13%'}
                </text>
            </svg>

            {/* ── Layer 8: Side info — right side, monospaced, muted cyan ── */}
            <div style={{
                position: 'absolute', right: '2%', top: '30%', textAlign: 'right', pointerEvents: 'none',
                fontFamily: 'Share Tech Mono', fontSize: '8px', color: TOKENS.secondary, opacity: 0.65, lineHeight: '1.9',
            }}>
                <div style={{ opacity: 0.5, fontSize: '6px', letterSpacing: '0.1em' }}>TEMPERATURE</div>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '15px', color: TOKENS.primary, marginBottom: '6px' }}>15°C</div>
                <div style={{ opacity: 0.5, fontSize: '6px', letterSpacing: '0.1em' }}>HUMIDITY</div>
                <div style={{ marginBottom: '6px' }}>62%</div>
                <div style={{ opacity: 0.5, fontSize: '6px', letterSpacing: '0.1em' }}>PRESSURE</div>
                <div style={{ marginBottom: '6px' }}>1013 hPa</div>
                <div style={{ opacity: 0.5, fontSize: '6px', letterSpacing: '0.1em' }}>SUNRISE</div>
                <div style={{ marginBottom: '6px' }}>05:42</div>
                <div style={{ opacity: 0.5, fontSize: '6px', letterSpacing: '0.1em' }}>SUNSET</div>
                <div>18:57</div>
            </div>

            {/* ── Layer 9: Small distributed labels ── */}
            <div style={{
                position: 'absolute', left: '3%', top: '35%', textAlign: 'left', pointerEvents: 'none',
                fontFamily: 'Share Tech Mono', fontSize: '7px', color: TOKENS.accent, opacity: 0.5, letterSpacing: '0.1em', lineHeight: '2',
            }}>
                <div>SYS</div>
                <div>RAM</div>
                <div>NET</div>
                <div>CTRL</div>
                <div>COM</div>
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