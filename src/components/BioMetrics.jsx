'use client';
import { useState, useEffect } from 'react';

const AGENT = 'http://localhost:5001';

export default function BioMetrics() {
    const [stats, setStats] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

        const fetchStats = () => {
            if (!isLocal) return;
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="hud-label" style={{ marginBottom: 0 }}>System Vitals</div>
                    <span className="hud-sublabel">SYS.BIO.7739-A</span>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5ee8ff" strokeWidth="1.5" style={{ marginTop: '2px' }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            </div>

            {!connected && (
                <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.55)', marginTop: '4px', marginBottom: '8px' }}>
                    Agent offline — run agent.py locally for live metrics
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                {metrics.map((m) => (
                    <div key={m.label}>
                        <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.7)', fontFamily: 'Orbitron', textTransform: 'uppercase', marginBottom: '2px' }}>
                            {m.label}
                        </div>
                        <div
                            className={m.big ? 'text-glow' : ''}
                            style={{
                                fontSize: m.big ? '18px' : '14px',
                                fontWeight: m.big ? '700' : '500',
                                color: '#5ee8ff',
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
                <div style={{ marginTop: '8px', fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.7)' }}>
                    CPU Temp: {stats.temp_c}°C
                </div>
            )}
        </div>
    );
}