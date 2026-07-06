'use client';
import { useState, useEffect } from 'react';

export default function AtmosphericData() {
    const [weather, setWeather] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ok | denied | error

    useEffect(() => {
        if (!navigator.geolocation) {
            setTimeout(() => setStatus('error'), 0);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
                    if (!res.ok) throw new Error('fetch failed');
                    const data = await res.json();
                    setWeather(data);
                    setStatus('ok');
                } catch {
                    setStatus('error');
                }
            },
            () => setStatus('denied'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        // Refresh every 10 minutes
        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const res = await fetch(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                    const data = await res.json();
                    setWeather(data);
                } catch { /* keep showing last known data */ }
            });
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const metrics = weather ? [
        { label: 'TEMPERATURE', value: `${weather.tempC}°C`, big: true },
        { label: 'CONDITION', value: weather.condition.toUpperCase(), big: false },
        { label: 'HUMIDITY', value: `${weather.humidity}%`, big: false },
        { label: 'WIND SPEED', value: `${weather.windKmph} KM/H`, big: false },
    ] : [
        { label: 'TEMPERATURE', value: status === 'denied' ? 'N/A' : '···', big: true },
        { label: 'CONDITION', value: status === 'denied' ? 'NO ACCESS' : 'LOADING', big: false },
        { label: 'HUMIDITY', value: '···', big: false },
        { label: 'WIND SPEED', value: '···', big: false },
    ];

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>Atmospheric Data</div>
                <span className="hud-sublabel">SYS.ATM.9F03-C</span>
                {weather && (
                    <span style={{ fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.1em', color: 'rgba(0,212,255,0.4)' }}>
                        {weather.city.toUpperCase()}
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {metrics.map((m) => (
                    <div key={m.label}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.45)', marginBottom: '3px' }}>
                            {m.label}
                        </div>
                        <div
                            className={m.big ? 'text-glow' : ''}
                            style={{
                                fontFamily: 'Orbitron',
                                fontSize: m.big ? '22px' : '13px',
                                fontWeight: m.big ? '700' : '400',
                                color: '#00d4ff',
                                whiteSpace: 'pre-line',
                                lineHeight: 1.3,
                                opacity: status === 'loading' ? 0.4 : 1,
                                transition: 'opacity 0.3s',
                            }}
                        >
                            {m.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}