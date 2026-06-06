'use client';

export default function AtmosphericData() {
    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div className="hud-label">Atmospheric Data</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                    { label: 'TEMPERATURE', value: '24°C', big: true },
                    { label: 'CONDITION', value: 'CLEAR\nSKIES', big: false },
                    { label: 'HUMIDITY', value: '42%', big: false },
                    { label: 'WIND SPEED', value: '12 KM/H', big: false },
                ].map((m) => (
                    <div key={m.label}>
                        <div style={{ fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.45)', marginBottom: '3px' }}>{m.label}</div>
                        <div className={m.big ? 'text-glow' : ''} style={{ fontFamily: 'Orbitron', fontSize: m.big ? '22px' : '13px', fontWeight: m.big ? '700' : '400', color: '#00d4ff', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{m.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}