'use client';
import { useState, useEffect } from 'react';

export default function SystemTopology() {
    const [lines, setLines] = useState([]);
    const [pts, setPts] = useState([]);

    useEffect(() => {
        const t = setTimeout(() => {
            const cols = 10, rows = 7, W = 220, H = 110;
            const points = [];
            for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++) {
                    const x = (c / (cols - 1)) * W;
                    const z = Math.sin(c * 0.8) * 12 + Math.cos(r * 1.1) * 10 + Math.sin((c + r) * 0.5) * 8;
                    points.push({ x, y: (r / (rows - 1)) * H + z, r, c });
                }

            const get = (r, c) => points.find((p) => p.r === r && p.c === c);
            const lns = [];
            for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols - 1; c++) {
                    const a = get(r, c), b = get(r, c + 1);
                    if (a && b) lns.push(`M${a.x},${a.y}L${b.x},${b.y}`);
                }
            for (let r = 0; r < rows - 1; r++)
                for (let c = 0; c < cols; c++) {
                    const a = get(r, c), b = get(r + 1, c);
                    if (a && b) lns.push(`M${a.x},${a.y}L${b.x},${b.y}`);
                }

            setPts(points);
            setLines(lns);
        }, 0);
        return () => clearTimeout(t);
    }, []);

    const W = 220, H = 110;

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>System<br />Topology</div>
                <span style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.15em', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', padding: '2px 6px' }}>SYNCED</span>
            </div>
            <div style={{ background: 'rgba(0,10,20,0.5)', padding: '8px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent)', animation: 'scan-line 3s linear infinite' }} />
                <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" style={{ display: 'block', filter: 'blur(0.4px)', opacity: 0.9 }}>
                    {lines.map((d, i) => <path key={i} d={d} fill="none" stroke="#00d4ff" strokeWidth="0.7" opacity="0.4" />)}
                    {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#00d4ff" opacity="0.6" />)}
                </svg>
            </div>
        </div>
    );
}