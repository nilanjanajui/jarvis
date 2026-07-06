'use client';

export default function SecurityStatus() {
    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="hud-label" style={{ marginBottom: 0 }}>Security<br />Status</div>
                    <span className="hud-sublabel">SYS.SEC.3A7D-9</span>
                </div>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#00d4ff', marginTop: '2px', animation: 'pulse-glow 2s infinite' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '6px' }}>
                {[
                    { label: 'FIREWALL', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', amber: false },
                    { label: 'ENCRYPT', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 11v-1a3 3 0 0 1 6 0v1', amber: false },
                    { label: 'THREATS', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', amber: true },
                ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div
                            className={item.amber ? 'jarvis-amber-pulse' : ''}
                            style={{
                                width: '38px', height: '38px',
                                border: `1.5px solid ${item.amber ? 'rgba(255,179,64,0.5)' : 'rgba(0,212,255,0.4)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: item.amber ? 'rgba(255,179,64,0.06)' : 'rgba(0,212,255,0.06)',
                            }}
                        >
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={item.amber ? '#ffb340' : '#5ee8ff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={item.path} />
                                {item.label === 'THREATS' && <polyline points="9 12 11 14 15 10" />}
                            </svg>
                        </div>
                        <span style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.1em', color: item.amber ? 'rgba(255,179,64,0.8)' : 'rgba(0,212,255,0.7)' }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}