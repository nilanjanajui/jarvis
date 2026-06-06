'use client';
import { useState, useEffect } from 'react';

export default function SatelliteLink() {
    const [latency, setLatency] = useState(14);
    useEffect(() => {
        const t = setInterval(() => setLatency(10 + Math.floor(Math.random() * 8)), 3000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>Satellite<br />Link</div>
            </div>
            {[['LOCATION', 'MALIBU, CA'], ['COORDINATES', '34.03°N, 118.78°W'], ['LATENCY', `${latency}ms`]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.45)' }}>{l}</span>
                    <span style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: '#00d4ff' }}>{v}</span>
                </div>
            ))}
            <div style={{ height: '3px', background: 'rgba(0,212,255,0.1)', borderRadius: '2px', marginTop: '6px' }}>
                <div style={{ height: '100%', width: `${(latency / 30) * 100}%`, background: 'linear-gradient(90deg,#00d4ff,#00a8cc)', borderRadius: '2px', transition: 'width 0.5s' }} />
            </div>
        </div>
    );
}