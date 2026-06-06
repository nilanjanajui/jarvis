'use client';
import { useState } from 'react';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    if (h < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
}

export default function CenterHUD({ status, transcript }) {
    const [greeting] = useState(getGreeting);

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

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Background glow */}
            <div style={{ position: 'absolute', width: '380px', height: '380px', borderRadius: '50%', background: `radial-gradient(circle, ${ringColor}08 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 0.5s' }} />

            {/* SVG HUD */}
            <svg viewBox="0 0 500 500" style={{ position: 'absolute', width: '420px', height: '420px' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="sphereG" cx="38%" cy="32%">
                        <stop offset="0%" stopColor="#5efff9" />
                        <stop offset="40%" stopColor="#00b8d9" />
                        <stop offset="100%" stopColor="#001f2e" />
                    </radialGradient>
                    <radialGradient id="glowG" cx="50%" cy="50%">
                        <stop offset="0%" stopColor={ringColor} stopOpacity="0.2" />
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

                {/* Outer solid ring */}
                <circle cx="250" cy="250" r="210" fill="none" stroke={ringColor} strokeWidth="1" opacity="0.2"
                    style={{ transition: 'stroke 0.5s' }} />

                {/* Mid dashed ring */}
                <circle cx="250" cy="250" r="180" fill="none" stroke={ringColor} strokeWidth="0.8" strokeDasharray="2 7" opacity="0.3"
                    style={{ transformOrigin: '250px 250px', animation: 'spin 40s linear infinite reverse', transition: 'stroke 0.5s' }} />

                {/* Inner ring */}
                <circle cx="250" cy="250" r="145" fill="none" stroke={ringColor} strokeWidth="1.2" opacity="0.5"
                    style={{ transition: 'stroke 0.5s' }} />

                {/* Scanning sweep */}
                <g style={{ transformOrigin: '250px 250px', animation: `spin ${status === 'idle' ? '8s' : '3s'} linear infinite` }}>
                    <path
                        d={`M250,250 L250,${250 - 210} A210,210 0 0,1 ${250 + 210 * Math.sin(Math.PI / 5)},${250 - 210 * Math.cos(Math.PI / 5)} Z`}
                        fill="url(#scanG)" opacity="0.7"
                    />
                </g>

                {/* Crosshairs */}
                <line x1="15" y1="250" x2="485" y2="250" stroke={ringColor} strokeWidth="0.4" opacity="0.15" />
                <line x1="250" y1="15" x2="250" y2="485" stroke={ringColor} strokeWidth="0.4" opacity="0.15" />

                {/* Cardinal ticks */}
                <line x1="250" y1="15" x2="250" y2="40" stroke={ringColor} strokeWidth="2" opacity="0.7" />
                <line x1="250" y1="460" x2="250" y2="485" stroke={ringColor} strokeWidth="2" opacity="0.7" />
                <line x1="15" y1="250" x2="40" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.7" />
                <line x1="460" y1="250" x2="485" y2="250" stroke={ringColor} strokeWidth="2" opacity="0.7" />

                {/* Pulsing glow */}
                <circle cx="250" cy="250" r="95" fill="url(#glowG)"
                    style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }} />

                {/* Main sphere */}
                <circle cx="250" cy="250" r="64" fill="url(#sphereG)" />

                {/* Specular highlight */}
                <ellipse cx="234" cy="232" rx="13" ry="8" fill="rgba(200,255,255,0.12)" transform="rotate(-25 234 232)" />

                {/* Rotating inner ring */}
                <circle cx="250" cy="250" r="82" fill="none" stroke={ringColor} strokeWidth="1" strokeDasharray="10 5" opacity="0.55"
                    style={{ transformOrigin: '250px 250px', animation: `spin ${status === 'idle' ? '10s' : '4s'} linear infinite`, transition: 'stroke 0.5s' }} />
            </svg>

            {/* Greeting + status text */}
            <div style={{ position: 'absolute', bottom: '13%', textAlign: 'center', pointerEvents: 'none' }}>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '15px', fontWeight: '700', letterSpacing: '0.25em', color: '#00d4ff', marginBottom: '8px' }}>
                    {greeting}, SIR
                </div>
                <div style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(0,212,255,0.55)', letterSpacing: '0.1em', fontStyle: transcript ? 'normal' : 'italic' }}>
                    {transcript || label}
                </div>
            </div>
        </div>
    );
}