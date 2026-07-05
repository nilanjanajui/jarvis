'use client';
import { useState, useEffect } from 'react';

export default function NeuralSync() {
    const [heights, setHeights] = useState(() => Array.from({ length: 38 }, () => 18)); // flat placeholder, matches server render

    useEffect(() => {
        const t = setTimeout(() => {
            setHeights(
                Array.from({ length: 38 }, (_, i) =>
                    18 + Math.sin(i * 0.55) * 14 + Math.cos(i * 0.3) * 8
                )
            );
        }, 0);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>Neural Sync<br />Link</div>
                <span className="hud-sublabel">SYS.NRL.7A2F-3</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.15em', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', padding: '2px 6px' }}>ACTIVE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '52px' }}>
                {heights.map((h, i) => (
                    <div
                        key={i}
                        className="wave-bar"
                        style={{ flex: 1, height: `${h}px`, opacity: i < 28 ? 1 : 0.3 }}
                    />
                ))}
            </div>
        </div>
    );
}