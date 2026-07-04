'use client';
import { useState, useEffect } from 'react';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    if (h < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
}

export default function CenterHUD({ status, transcript, streamingText }) {
    const [greeting] = useState(getGreeting);
    const [ticks, setTicks] = useState([]);
    const [scanPath, setScanPath] = useState('');

    useEffect(() => {
        const t = setTimeout(() => {
            // Degree tick ring coordinates
            const computedTicks = Array.from({ length: 24 }, (_, i) => {
                const deg = i * 15;
                const rad = (deg * Math.PI) / 180;
                const isMajor = deg % 45 === 0;
                const r1 = 224, r2 = isMajor ? 213 : 218;
                return {
                    x1: 250 + r1 * Math.cos(rad),
                    y1: 250 + r1 * Math.sin(rad),
                    x2: 250 + r2 * Math.cos(rad),
                    y2: 250 + r2 * Math.sin(rad),
                    isMajor,
                };
            });
            setTicks(computedTicks);

            // Scanning sweep arc path
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
    }[status] || 'Standing by for instructions.';

    const ringColor = {
        idle: '#00d4ff',
        listening: '#22c55e',
        thinking: '#f59e0b',
        speaking: '#a855f7',
    }[status] || '#00d4ff';

    const scanSpeed = status === 'idle' ? '8s' : '2.5s';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Background radial glow — intensifies when speaking */}
            <div style={{
                position: 'absolute', width: '460px', height: '460px', borderRadius: '50%',
                background: `radial-gradient(circle, ${ringColor}${status === 'speaking' ? '12' : '06'} 0%, transparent 70%)`,
                pointerEvents: 'none', transition: 'background 0.5s',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
            }} />

            {/* Sonar pulse rings — only when speaking */}
            {status === 'speaking' && (
                <>
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', animationDelay: '0s', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', animationDelay: '0.6s', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1.5px solid ${ringColor}`, animation: 'sonar 1.8s ease-out infinite', animationDelay: '1.2s', pointerEvents: 'none' }} />
                </>
            )}

            {/* Sonar rings — only when listening */}
            {status === 'listening' && (
                <>
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1px solid ${ringColor}`, animation: 'sonar 2.4s ease-out infinite', animationDelay: '0s', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '128px', height: '128px', borderRadius: '50%', border: `1px solid ${ringColor}`, animation: 'sonar 2.4s ease-out infinite', animationDelay: '0.8s', pointerEvents: 'none' }} />
                </>
            )}

            {/* Main SVG HUD */}
            <svg viewBox="0 0 500 500" style={{ position: 'absolute', width: '460px', height: '460px' }} xmlns="http://www.w3.org/2000/svg">
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
                </defs>

                {/* Outermost dashed ring */}
                <circle cx="250" cy="250" r="235" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="3 9" opacity="0.35"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 30s linear infinite', transition: 'stroke 0.5s' }} />

                {/* Degree tick ring — the classic HUD detail, slow independent rotation */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 45s linear infinite' }}>
                    {ticks.map((t, i) => (
                        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={ringColor} strokeWidth={t.isMajor ? 1.2 : 0.5} opacity="0.45" />
                    ))}
                </g>

                {/* Outer solid ring */}
                <circle cx="250" cy="250" r="210" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.2"
                    style={{ transition: 'stroke 0.5s' }} />

                {/* Mid dashed ring — reverses */}
                <circle cx="250" cy="250" r="180" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="2 7" opacity="0.3"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 40s linear infinite reverse', transition: 'stroke 0.5s' }} />

                {/* Inner ring */}
                <circle cx="250" cy="250" r="145" fill="none" stroke={ringColor} strokeWidth="1.2" opacity="0.5"
                    style={{ transition: 'stroke 0.5s' }} />

                {/* Scanning sweep */}
                {scanPath && (
                    <g style={{ transformOrigin: '250px 250px', animation: `spin ${scanSpeed} linear infinite` }}>
                        <path d={scanPath} fill="url(#scanG)" opacity="0.7" />
                    </g>
                )}

                {/* Crosshairs */}
                <line x1="15" y1="250" x2="485" y2="250" stroke={ringColor} strokeWidth="0.4" opacity="0.15" />
                <line x1="250" y1="15" x2="250" y2="485" stroke={ringColor} strokeWidth="0.4" opacity="0.15" />

                {/* Cardinal ticks */}
                <line x1="250" y1="15" x2="250" y2="40" stroke={ringColor} strokeWidth="2" opacity="0.7" />
                <line x1="250" y1="460" x2="250" y2="485" stroke={ringColor} strokeWidth="2" opacity="0.7" />
                <line x1="15" y1="250" x2="40" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.7" />
                <line x1="460" y1="250" x2="485" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.7" />

                {/* Readout labels — classic HUD coordinate detail */}
                <text x="250" y="28" textAnchor="middle" fill={ringColor} opacity="0.5" fontSize="9" fontFamily="Share Tech Mono">N · 000°</text>
                <text x="475" y="254" textAnchor="middle" fill="#ffb340" opacity="0.45" fontSize="9" fontFamily="Share Tech Mono">E · 090°</text>
                <text x="250" y="480" textAnchor="middle" fill={ringColor} opacity="0.5" fontSize="9" fontFamily="Share Tech Mono">S · 180°</text>
                <text x="25" y="254" textAnchor="middle" fill="#ffb340" opacity="0.45" fontSize="9" fontFamily="Share Tech Mono">W · 270°</text>

                {/* Pulsing glow behind sphere */}
                <circle cx="250" cy="250" r="95" fill="url(#glowG)"
                    style={{ animation: `pulse-glow ${status === 'speaking' ? '0.8s' : '2.5s'} ease-in-out infinite` }} />

                {/* Main sphere */}
                <circle cx="250" cy="250" r="64" fill="url(#sphereG)" />

                {/* Specular */}
                <ellipse cx="234" cy="232" rx="13" ry="8" fill="rgba(200,255,255,0.12)" transform="rotate(-25 234 232)" />

                {/* Rotating inner ring — spins faster when active */}
                <circle cx="250" cy="250" r="82" fill="none" stroke={ringColor} strokeWidth="1" strokeDasharray="10 5" opacity="0.55"
                    style={{ transformOrigin: '250px 250px', animation: `spin ${scanSpeed} linear infinite`, transition: 'stroke 0.5s' }} />

                {/* Extra ring visible when speaking */}
                {status === 'speaking' && (
                    <circle cx="250" cy="250" r="110" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="5 3" opacity="0.4"
                        style={{ transformOrigin: '250px 250px', animation: 'spin 1.5s linear infinite reverse' }} />
                )}
            </svg>

            {/* Greeting + status */}
            <div style={{ position: 'absolute', bottom: '13%', textAlign: 'center', pointerEvents: 'none' }}>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '15px', fontWeight: '700', letterSpacing: '0.25em', color: '#00d4ff', marginBottom: '8px' }}>
                    {greeting}, SIR
                </div>
                <div className="jarvis-live-data" style={{
                    fontFamily: 'Share Tech Mono', fontSize: '11px',
                    color: status === 'speaking' ? ringColor : 'rgba(0,212,255,0.55)',
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