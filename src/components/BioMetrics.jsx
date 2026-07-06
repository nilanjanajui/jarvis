'use client';
import { useState, useEffect } from 'react';

const AGENT = 'http://localhost:5001';

export default function BioMetrics() {
    const [stats, setStats] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

        const fetchStats = () => {
            if (!isLocal) return; // agent only runs locally, not reachable from deployed Vercel origin unless you set that up
            fetch(`${AGENT}/system-stats`)
                .then((res) => res.json())
                .then((data) => {
                    if (!data.error) {
                        setStats(data);
                        setConnected(true);
                    }
                })
                .catch(() => setConnected(false));
        };

        fetchStats();
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, []);

    const metrics = stats ? [
        { label: 'CPU Load', value: `${stats.cpu_percent}%`, big: true },
        { label: 'RAM Usage', value: `${stats.ram_percent}%`, big: false },
        { label: 'Disk Usage', value: `${stats.disk_percent}%`, big: true },
        { label: 'Uptime', value: stats.uptime, big: false },
    ] : [
        { label: 'CPU Load', value: connected ? '···' : 'N/A', big: true },
        { label: 'RAM Usage', value: connected ? '···' : 'N/A', big: false },
        { label: 'Disk Usage', value: connected ? '···' : 'N/A', big: true },
        { label: 'Uptime', value: connected ? '···' : 'N/A', big: false },
    ];

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>System Vitals</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            </div>
            <span className="hud-sublabel">SYS.BIO.7739-A</span>

            {!connected && (
                <div style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.35)', marginBottom: '8px' }}>
                    Agent offline — run agent.py locally for live metrics
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {metrics.map((m) => (
                    <div key={m.label}>
                        <div style={{ fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.5)', fontFamily: 'Orbitron', textTransform: 'uppercase', marginBottom: '2px' }}>
                            {m.label}
                        </div>
                        <div
                            className={m.big ? 'text-glow' : ''}
                            style={{
                                fontSize: m.big ? '18px' : '13px',
                                fontWeight: m.big ? '700' : '400',
                                color: '#00d4ff',
                                fontFamily: 'Orbitron',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {m.value}
                        </div>
                    </div>
                ))}
            </div>

            {stats?.temp_c && (
                <div style={{ marginTop: '8px', fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.5)' }}>
                    CPU Temp: {stats.temp_c}°C
                </div>
            )}
        </div>
    );
}