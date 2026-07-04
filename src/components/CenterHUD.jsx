'use client';
import { useState, useEffect } from 'react';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    if (h < 21) return 'GOOD NIGHT';
    return 'GOOD NIGHT';
}

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
                const r1 = 228, r2 = isMajor ? 216 : 222;
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
    }[status] || 'Standing by for instructions.';

    const ringColor = {
        idle: '#00d4ff',
        listening: '#22c55e',
        thinking: '#f59e0b',
        speaking: '#a855f7',
        booting: '#00d4ff',
    }[status] || '#00d4ff';

    const scanSpeed = status === 'idle' ? '8s' : '2.5s';
    const isBooting = status === 'booting';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Background radial glow */}
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

            {/* Main SVG HUD */}
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

                {/* Outermost dashed ring */}
                <circle cx="250" cy="250" r="240" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="3 9" opacity="0.3"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 32s linear infinite' }} />

                {/* Dense degree tick ring */}
                <g style={{ transformOrigin: '250px 250px', animation: 'spin 50s linear infinite' }}>
                    {ticks.map((t, i) => (
                        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={ringColor} strokeWidth={t.isMajor ? 1.3 : 0.4} opacity={t.isMajor ? 0.55 : 0.3} />
                    ))}
                </g>

                {/* Outer solid ring */}
                <circle cx="250" cy="250" r="205" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.25" />

                {/* Mid dashed ring — reverses */}
                <circle cx="250" cy="250" r="172" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="2 6" opacity="0.35"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 38s linear infinite reverse' }} />

                {/* Status arc — segmented percentage-style ring at bottom, like reference image */}
                <g opacity="0.6">
                    <path d="M 140 340 A 155 155 0 0 0 360 340" fill="none" stroke={ringColor} strokeWidth="3" strokeDasharray="4 3" opacity="0.5" />
                    <path
                        d={`M 140 340 A 155 155 0 0 0 ${140 + (360 - 140) * (isBooting ? (bootProgress || 0) / 100 : 1)} 340`}
                        fill="none" stroke={ringColor} strokeWidth="3" opacity="0.9"
                        style={{ transition: 'd 0.3s linear' }}
                    />
                </g>

                {/* Inner ring */}
                <circle cx="250" cy="250" r="140" fill="none" stroke={ringColor} strokeWidth="1.2" opacity="0.5" />

                {/* Scanning sweep */}
                {scanPath && (
                    <g style={{ transformOrigin: '250px 250px', animation: `spin ${scanSpeed} linear infinite` }}>
                        <path d={scanPath} fill="url(#scanG)" opacity="0.6" />
                    </g>
                )}

                {/* Crosshairs */}
                <line x1="10" y1="250" x2="490" y2="250" stroke={ringColor} strokeWidth="0.4" opacity="0.12" />
                <line x1="250" y1="10" x2="250" y2="490" stroke={ringColor} strokeWidth="0.4" opacity="0.12" />

                {/* Cardinal ticks */}
                <line x1="250" y1="10" x2="250" y2="35" stroke={ringColor} strokeWidth="2" opacity="0.65" />
                <line x1="250" y1="465" x2="250" y2="490" stroke={ringColor} strokeWidth="2" opacity="0.65" />
                <line x1="10" y1="250" x2="35" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.65" />
                <line x1="465" y1="250" x2="490" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.65" />

                {/* Readout labels */}
                <text x="250" y="26" textAnchor="middle" fill={ringColor} opacity="0.5" fontSize="9" fontFamily="Share Tech Mono">N · 000°</text>
                <text x="480" y="254" textAnchor="middle" fill="#ffb340" opacity="0.4" fontSize="9" fontFamily="Share Tech Mono">E · 090°</text>
                <text x="250" y="488" textAnchor="middle" fill={ringColor} opacity="0.5" fontSize="9" fontFamily="Share Tech Mono">S · 180°</text>
                <text x="20" y="254" textAnchor="middle" fill="#ffb340" opacity="0.4" fontSize="9" fontFamily="Share Tech Mono">W · 270°</text>

                {/* Pulsing glow behind sphere */}
                <circle cx="250" cy="250" r="95" fill="url(#glowG)"
                    style={{ animation: `pulse-glow ${status === 'speaking' ? '0.8s' : '2.5s'} ease-in-out infinite` }} />

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

                {/* Rotating inner ring */}
                <circle cx="250" cy="250" r="82" fill="none" stroke={ringColor} strokeWidth="1" strokeDasharray="10 5" opacity="0.55"
                    style={{ transformOrigin: '250px 250px', animation: `spin ${scanSpeed} linear infinite` }} />

                {status === 'speaking' && (
                    <circle cx="250" cy="250" r="110" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="5 3" opacity="0.4"
                        style={{ transformOrigin: '250px 250px', animation: 'spin 1.5s linear infinite reverse' }} />
                )}

                {/* ── Left flanking diagnostic panel (angled trapezoid, like reference) ── */}
                <g opacity={isBooting ? 1 : 0.55} style={{ transition: 'opacity 0.6s' }}>
                    <path d="M 70 200 L 150 210 L 150 290 L 70 300 Z" fill="rgba(0,18,36,0.5)" stroke={ringColor} strokeWidth="0.6" opacity="0.7" />
                    <text x="80" y="220" fill={ringColor} fontSize="7" fontFamily="Share Tech Mono" opacity="0.7">SYS.DIAG</text>
                    <text x="80" y="235" fill={ringColor} fontSize="6" fontFamily="Share Tech Mono" opacity="0.45">CORE.7A</text>
                    <rect x="80" y="245" width="60" height="3" fill="none" stroke={ringColor} strokeWidth="0.5" opacity="0.5" />
                    <rect x="80" y="245" width={isBooting ? (bootProgress || 0) * 0.6 : 42} height="3" fill={ringColor} opacity="0.7" />
                    <text x="80" y="262" fill={ringColor} fontSize="6" fontFamily="Share Tech Mono" opacity="0.45">NEURAL.SYNC</text>
                    <text x="80" y="280" fill="#ffb340" fontSize="6" fontFamily="Share Tech Mono" opacity="0.5">0x4F2A.9B</text>
                </g>

                {/* ── Right flanking diagnostic panel ── */}
                <g opacity={isBooting ? 1 : 0.55} style={{ transition: 'opacity 0.6s' }}>
                    <path d="M 430 200 L 350 210 L 350 290 L 430 300 Z" fill="rgba(0,18,36,0.5)" stroke={ringColor} strokeWidth="0.6" opacity="0.7" />
                    <text x="420" y="220" textAnchor="end" fill={ringColor} fontSize="7" fontFamily="Share Tech Mono" opacity="0.7">COMMS</text>
                    <text x="420" y="235" textAnchor="end" fill={ringColor} fontSize="6" fontFamily="Share Tech Mono" opacity="0.45">LINK.ACTIVE</text>
                    <text x="420" y="252" textAnchor="end" fill={ringColor} fontSize="6" fontFamily="Share Tech Mono" opacity="0.45">SAT.14MS</text>
                    <text x="420" y="269" textAnchor="end" fill="#ffb340" fontSize="6" fontFamily="Share Tech Mono" opacity="0.5">ENC.AES256</text>
                    <text x="420" y="286" textAnchor="end" fill={ringColor} fontSize="6" fontFamily="Share Tech Mono" opacity="0.45">v4.2.0</text>
                </g>
            </svg>

            {/* Greeting + status */}
            <div style={{ position: 'absolute', bottom: '10%', textAlign: 'center', pointerEvents: 'none' }}>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '15px', fontWeight: '700', letterSpacing: '0.25em', color: '#00d4ff', marginBottom: '8px' }}>
                    {isBooting ? 'INITIALIZING' : `${greeting}, SIR`}
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