'use client';
import { useState, useEffect } from 'react';

export default function BioMetrics() {
    const [hr, setHr] = useState(72);
    useEffect(() => {
        const t = setInterval(() => setHr(70 + Math.floor(Math.random() * 6)), 2000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>Bio-Metrics</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                {[
                    { label: 'Heart Rate', value: `${hr} BPM`, big: true },
                    { label: 'Neural Stress', value: '12%', big: false },
                    { label: 'Oxygen Sat', value: '99%', big: true },
                    { label: 'Body Temp', value: '36.6°C', big: false },
                ].map((m) => (
                    <div key={m.label}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.45)', textTransform: 'uppercase', marginBottom: '2px' }}>{m.label}</div>
                        <div className={m.big ? 'text-glow' : ''} style={{ fontFamily: 'Orbitron', fontSize: m.big ? '17px' : '13px', fontWeight: m.big ? '700' : '400', color: '#00d4ff', letterSpacing: '0.05em' }}>{m.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}