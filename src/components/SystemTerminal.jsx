'use client';
import { useState, useEffect } from 'react';

export default function SystemTerminal() {
    const [lines, setLines] = useState(['USER@SYSTEM: Initializing...']);

    useEffect(() => {
        const msgs = ['SCANNING network interfaces...', 'LOADING kernel modules...', 'READY — All systems nominal.'];
        msgs.forEach((m, i) => setTimeout(() => setLines((p) => [...p, m]), (i + 1) * 1200));
    }, []);

    return (
        <div className="hud-card" style={{ background: 'rgba(0,6,14,0.92)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5ee8ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 9l3 3-3 3M13 15h5" />
                </svg>
                <div style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em', color: '#5ee8ff' }}>SYSTEM TERMINAL</div>
            </div>
            <span className="hud-sublabel" style={{ marginTop: '2px', marginLeft: '18px' }}>SYS.TRM.6B41-D</span>

            <div style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', lineHeight: '1.7', marginTop: '6px' }}>
                {lines.map((l, i) => (
                    <div key={i} style={{ color: i === 0 ? '#5ee8ff' : 'rgba(0,212,255,0.75)' }}>{l}</div>
                ))}
                <span style={{ color: '#5ee8ff', animation: 'blink 1.2s step-end infinite' }}>▮</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px solid rgba(0,212,255,0.15)', paddingTop: '4px' }}>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.5)' }}>UPTIME: 10h</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: '9px', color: 'rgba(0,212,255,0.5)' }}>v4.2.0</span>
            </div>
        </div>
    );
}