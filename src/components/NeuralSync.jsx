'use client';
import { useState, useEffect } from 'react';

export default function NeuralSync() {
    const [heights, setHeights] = useState(() => Array.from({ length: 38 }, () => 18));

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="hud-label" style={{ marginBottom: 0 }}>Neural Sync<br />Link</div>
                    <span className="hud-sublabel">SYS.NRL.7A2F-3</span>
                </div>
                <span style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em', color: '#5ee8ff', border: '1px solid rgba(0,212,255,0.4)', padding: '2px 7px', marginTop: '2px' }}>ACTIVE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '52px', marginTop: '6px' }}>
                {heights.map((h, i) => (
                    <div
                        key={i}
                        className="wave-bar"
                        style={{ flex: 1, height: `${h}px`, opacity: i < 28 ? 1 : 0.4 }}
                    />
                ))}
            </div>
        </div>
    );
}