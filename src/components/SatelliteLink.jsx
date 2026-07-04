'use client';
import { useState, useEffect } from 'react';

export default function SatelliteLink() {
    const [latency, setLatency] = useState(14);
    const [location, setLocation] = useState(null); // { city, region, country, lat, lon }
    const [status, setStatus] = useState('loading');


    // Simulated latency ticker
    useEffect(() => {
        const t = setInterval(() => setLatency(10 + Math.floor(Math.random() * 8)), 3000);
        return () => clearInterval(t);
    }, []);

    // Real location + reverse geocode via weather API (already returns city/country)
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
                    // Still show raw coordinates even if reverse geocode fails
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>Satellite<br />Link</div>
                <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: status === 'ok' ? '#22c55e' : status === 'denied' ? '#f59e0b' : 'rgba(0,212,255,0.3)',
                    marginTop: '2px',
                    animation: status === 'loading' ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
                }} />
            </div>

            {rows.map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.45)' }}>
                        {l}
                    </span>
                    <span style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: '#00d4ff', textAlign: 'right' }}>
                        {v}
                    </span>
                </div>
            ))}

            <div style={{ height: '3px', background: 'rgba(0,212,255,0.1)', borderRadius: '2px', marginTop: '6px' }}>
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