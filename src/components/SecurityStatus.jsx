'use client';

export default function SecurityStatus() {
    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div className="hud-label" style={{ marginBottom: 0 }}>Security<br />Status</div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00d4ff', animation: 'pulse-glow 2s infinite' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {[
                    { label: 'FIREWALL', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', amber: false },
                    { label: 'ENCRYPT', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 11v-1a3 3 0 0 1 6 0v1', amber: false },
                    { label: 'THREATS', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', amber: true },
                ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div
                            className={item.amber ? 'jarvis-amber-pulse' : ''}
                            style={{
                                width: '36px', height: '36px',
                                border: `1px solid ${item.amber ? 'rgba(255,179,64,0.3)' : 'rgba(0,212,255,0.25)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: item.amber ? 'rgba(255,179,64,0.04)' : 'rgba(0,212,255,0.04)',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.amber ? '#ffb340' : '#00d4ff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={item.path} />
                                {item.label === 'THREATS' && <polyline points="9 12 11 14 15 10" />}
                            </svg>
                        </div>
                        <span style={{ fontFamily: 'Orbitron', fontSize: '7px', letterSpacing: '0.1em', color: item.amber ? 'rgba(255,179,64,0.6)' : 'rgba(0,212,255,0.5)' }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}