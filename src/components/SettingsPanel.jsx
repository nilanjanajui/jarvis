'use client';

import { useEffect, useState } from 'react';

export default function SettingsPanel({
    open,
    onClose,
    alwaysOnDefault,
    onToggleAlwaysOnDefault,
    onClearHistory,
    historyCount,
}) {
    const [keyStatus, setKeyStatus] = useState(null);
    const [keyStatusError, setKeyStatusError] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetch('/api/settings')
            .then((res) => {
                if (!res.ok) throw new Error(`status ${res.status}`);
                return res.json();
            })
            .then((data) => setKeyStatus(data.keys))
            .catch(() => setKeyStatusError(true));
    }, [open]);

    if (!open) return null;

    const keyRows = [
        { key: 'groq', label: 'GROQ (LLM)' },
        { key: 'serper', label: 'SERPER (WEB SEARCH)' },
        { key: 'elevenlabs', label: 'ELEVENLABS (VOICE)' },
    ];

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,4,10,0.75)', backdropFilter: 'blur(2px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="hud-card"
                style={{ width: '420px', maxWidth: '92vw', maxHeight: '86vh', overflowY: 'auto', background: 'rgba(3,10,20,0.97)', padding: '22px' }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '13px', fontWeight: '900', letterSpacing: '0.2em', color: '#00d4ff', textShadow: '0 0 10px #00d4ff66' }}>
                        SETTINGS
                    </span>
                    <button
                        onClick={onClose}
                        aria-label="Close settings"
                        style={{ background: 'none', border: '1px solid rgba(0,212,255,0.25)', color: 'rgba(0,212,255,0.7)', width: '22px', height: '22px', cursor: 'pointer', fontFamily: 'Share Tech Mono', fontSize: '12px', lineHeight: 1, borderRadius: '2px' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Voice activation */}
                <div className="hud-label">Voice Activation</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '10px 12px', border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.03)' }}>
                    <div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(0,212,255,0.85)', letterSpacing: '0.05em' }}>
                            Always-on by default
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.4)', marginTop: '3px' }}>
                            Start listening automatically on page load
                        </div>
                    </div>
                    <button
                        onClick={onToggleAlwaysOnDefault}
                        aria-pressed={alwaysOnDefault}
                        style={{
                            width: '38px', height: '20px', borderRadius: '10px', position: 'relative', flexShrink: 0,
                            border: `1px solid ${alwaysOnDefault ? '#22c55e' : 'rgba(0,212,255,0.3)'}`,
                            background: alwaysOnDefault ? 'rgba(34,197,94,0.15)' : 'rgba(0,212,255,0.05)',
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        <span style={{
                            position: 'absolute', top: '1px', left: alwaysOnDefault ? '19px' : '1px',
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: alwaysOnDefault ? '#22c55e' : 'rgba(0,212,255,0.5)',
                            transition: 'left 0.2s',
                        }} />
                    </button>
                </div>

                {/* Conversation data */}
                <div className="hud-label">Conversation Data</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '10px 12px', border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.03)' }}>
                    <div style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(0,212,255,0.85)', letterSpacing: '0.05em' }}>
                        {historyCount > 0 ? `${historyCount} message${historyCount === 1 ? '' : 's'} stored locally` : 'No conversation history stored'}
                    </div>
                    {historyCount > 0 && (
                        confirmClear ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => { onClearHistory(); setConfirmClear(false); }}
                                    style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.1em', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.6)', color: '#ef4444', padding: '4px 8px', cursor: 'pointer', borderRadius: '2px' }}
                                >
                                    CONFIRM
                                </button>
                                <button
                                    onClick={() => setConfirmClear(false)}
                                    style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.1em', background: 'none', border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(0,212,255,0.5)', padding: '4px 8px', cursor: 'pointer', borderRadius: '2px' }}
                                >
                                    CANCEL
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmClear(true)}
                                style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.1em', background: 'none', border: '1px solid rgba(239,68,68,0.35)', color: 'rgba(239,68,68,0.75)', padding: '4px 10px', cursor: 'pointer', borderRadius: '2px', whiteSpace: 'nowrap' }}
                            >
                                CLEAR HISTORY
                            </button>
                        )
                    )}
                </div>

                {/* API keys */}
                <div className="hud-label">API Connections</div>
                <div style={{ border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.03)' }}>
                    {keyStatusError && (
                        <div style={{ padding: '10px 12px', fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(239,68,68,0.75)' }}>
                            Unable to reach status endpoint
                        </div>
                    )}
                    {!keyStatusError && !keyStatus && (
                        <div style={{ padding: '10px 12px', fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.4)' }}>
                            Checking...
                        </div>
                    )}
                    {keyStatus && keyRows.map((row, i) => {
                        const active = keyStatus[row.key];
                        return (
                            <div
                                key={row.key}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '9px 12px',
                                    borderTop: i === 0 ? 'none' : '1px solid rgba(0,212,255,0.08)',
                                }}
                            >
                                <span style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.08em' }}>
                                    {row.label}
                                </span>
                                <span style={{
                                    fontFamily: 'Share Tech Mono', fontSize: '9px', letterSpacing: '0.1em',
                                    color: active ? '#22c55e' : 'rgba(239,68,68,0.75)',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#22c55e' : '#ef4444' }} />
                                    {active ? 'ACTIVE' : 'MISSING'}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div style={{ fontFamily: 'Share Tech Mono', fontSize: '8px', color: 'rgba(0,212,255,0.3)', marginTop: '8px', letterSpacing: '0.05em' }}>
                    Key values are never exposed to the browser — only whether each is configured on the server.
                </div>
            </div>
        </div>
    );
}