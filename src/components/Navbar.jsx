'use client';

export default function Navbar({ onSettingsClick, settingsOpen }) {
    const items = ['HOME', 'DASHBOARD', 'SETTINGS', 'ABOUT'];

    const handleClick = (item) => {
        if (item === 'SETTINGS') onSettingsClick?.();
    };

    return (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'rgba(3,8,16,0.95)' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: '16px', fontWeight: '900', letterSpacing: '0.2em', color: '#00d4ff', textShadow: '0 0 10px #00d4ff66' }}>
                J.A.R.V.I.S.
            </span>

            <div style={{ display: 'flex', gap: '32px' }}>
                {items.map((item) => {
                    const isActive = item === 'DASHBOARD' || (item === 'SETTINGS' && settingsOpen);
                    return (
                        <button
                            key={item}
                            onClick={() => handleClick(item)}
                            style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.2em', color: isActive ? '#00d4ff' : 'rgba(0,212,255,0.4)', background: 'none', border: 'none', borderBottom: isActive ? '1px solid #00d4ff' : 'none', paddingBottom: '2px', cursor: item === 'SETTINGS' ? 'pointer' : 'default' }}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                {/* Wifi icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 6s4-4 11-4 11 4 11 4M5 10s2.5-2.5 7-2.5 7 2.5 7 2.5M9 14s1.5-1.5 3-1.5 3 1.5 3 1.5M12 18v1" />
                </svg>
                {/* CPU icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5">
                    <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
                    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
                </svg>
                {/* Terminal icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 9l3 3-3 3M13 15h5" />
                </svg>
            </div>
        </nav>
    );
}