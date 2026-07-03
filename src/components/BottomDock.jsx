'use client';

// Icon glyphs — kept as simple single-stroke line art to match the rest of
// the HUD's icon language (see Navbar's wifi/cpu/terminal icons).
const ICONS = {
    calc: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="11" x2="8" y2="11" />
            <line x1="12" y1="11" x2="12" y2="11" />
            <line x1="16" y1="11" x2="16" y2="11" />
            <line x1="8" y1="15" x2="8" y2="15" />
            <line x1="12" y1="15" x2="12" y2="15" />
            <line x1="16" y1="15" x2="16" y2="15" />
            <line x1="8" y1="19" x2="8" y2="19" />
            <line x1="12" y1="19" x2="12" y2="19" />
            <line x1="16" y1="19" x2="16" y2="19" />
        </svg>
    ),
    timer: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l3 2" />
            <path d="M9 2h6" />
        </svg>
    ),
    notes: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    ),
    diagnostics: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
        </svg>
    ),
};

function DockButton({ icon, label, active, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`hud-dock-btn${active ? ' active' : ''}`}
            style={{ color: active ? '#00d4ff' : 'rgba(0,212,255,0.55)' }}
        >
            {ICONS[icon]}
            <span className="hud-dock-label">{label}</span>
        </div>
    );
}

export default function BottomDock({
    showCalculator, onToggleCalculator,
    showTimerPanel, onToggleTimerPanel,
    showNotebook, onToggleNotebook,
    showSystemDrawer, onToggleSystemDrawer,
}) {
    return (
        <div style={{
            position: 'fixed',
            bottom: '22px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '28px',
            zIndex: 40,
            padding: '8px 24px',
        }}>
            <DockButton icon="calc" label="CALC" active={showCalculator} onClick={onToggleCalculator} />
            <DockButton icon="timer" label="TIMER" active={showTimerPanel} onClick={onToggleTimerPanel} />
            <DockButton icon="notes" label="NOTES" active={showNotebook} onClick={onToggleNotebook} />
            <DockButton icon="diagnostics" label="SYSTEM" active={showSystemDrawer} onClick={onToggleSystemDrawer} />
        </div>
    );
}