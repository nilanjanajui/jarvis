'use client';
import { useState, useEffect } from 'react';

export default function SatelliteLink() {
    const [latency, setLatency] = useState(14);
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const t = setInterval(() => setLatency(10 + Math.floor(Math.random() * 8)), 3000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            setTimeout(() => setStatus('error'), 0);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    setLocation({
                        city: data.city,
                        region: data.region,
                        country: data.countryCode || data.country,
                        lat: latitude,
                        lon: longitude,
                    });
                    setStatus('ok');
                } catch {
                    setLocation({ city: null, lat: latitude, lon: longitude });
                    setStatus('ok');
                }
            },
            () => setStatus('denied'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    const formatCoord = (val, posLabel, negLabel) => {
        if (val === undefined || val === null) return '···';
        const abs = Math.abs(val).toFixed(2);
        return `${abs}°${val >= 0 ? posLabel : negLabel}`;
    };

    const rows = [
        [
            'LOCATION',
            status === 'denied' ? 'ACCESS DENIED'
                : location?.city ? `${location.city}${location.region ? ', ' + location.region : ''}`.toUpperCase()
                    : status === 'ok' ? 'UNKNOWN'
                        : '···',
        ],
        [
            'COORDINATES',
            location
                ? `${formatCoord(location.lat, 'N', 'S')}, ${formatCoord(location.lon, 'E', 'W')}`
                : '···',
        ],
        ['LATENCY', `${latency}ms`],
    ];

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="hud-label" style={{ marginBottom: 0 }}>Satellite<br />Link</div>
                    <span className="hud-sublabel">SYS.SAT.2E88-1</span>
                </div>
                <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: status === 'ok' ? '#22c55e' : status === 'denied' ? '#f59e0b' : 'rgba(0,212,255,0.4)',
                    marginTop: '3px',
                    animation: status === 'loading' ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
                }} />
            </div>

            <div style={{ marginTop: '4px' }}>
                {rows.map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.65)' }}>
                            {l}
                        </span>
                        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#5ee8ff', textAlign: 'right' }}>
                            {v}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{ height: '3px', background: 'rgba(0,212,255,0.15)', borderRadius: '2px', marginTop: '6px' }}>
                <div style={{
                    height: '100%',
                    width: `${(latency / 30) * 100}%`,
                    background: latency > 20 ? 'linear-gradient(90deg,#ffb340,#ff8c1a)' : 'linear-gradient(90deg,#00d4ff,#00a8cc)',
                    borderRadius: '2px',
                    transition: 'width 0.5s, background 0.4s',
                }} />
            </div>
        </div>
    );
}