'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Self-contained fixed-position draggable tool panel.
// Does NOT use the column Draggable — it manages its own position:fixed state
// so it is always above the Three.js WebGL canvas regardless of stacking context.
// ─────────────────────────────────────────────────────────────────────────────
function Panel({ corner, width, title, onClose, children, dragId }) {
    const W = parseInt(width, 10) || 220;
    const MARGIN = 14;

    // Compute initial corner position in viewport space
    const getCornerPos = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        switch (corner) {
            case 'top-right':    return { left: vw - W - MARGIN, top: MARGIN + 60 };
            case 'bottom-right': return { left: vw - W - MARGIN, top: vh - 300 - MARGIN };
            case 'bottom-left':  return { left: MARGIN,           top: vh - 280 - MARGIN };
            default:             return { left: MARGIN,           top: MARGIN + 60 };
        }
    }, [corner, W]);

    const [pos, setPos] = useState(null);       // null = not yet initialised
    const [dragging, setDragging] = useState(false);
    const posRef    = useRef(null);
    const offsetRef = useRef({ x: 0, y: 0 });
    const boundsRef = useRef(null);

    // Init: try saved position, fall back to corner
    useEffect(() => {
        let initial = getCornerPos();
        try {
            const saved = localStorage.getItem(`jarvis-pos-${dragId}`);
            if (saved) {
                const p = JSON.parse(saved);
                if (typeof p.left === 'number' && isFinite(p.left)) initial = p;
            }
        } catch {}
        posRef.current = initial;
        setPos(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragId]);

    // Pointer-down: start drag
    const onPointerDown = useCallback((e) => {
        if (e.target.closest('button, input, textarea, select, [data-no-drag]')) return;
        const cur = posRef.current;
        if (!cur) return;
        boundsRef.current = {
            minL: 0, minT: 0,
            maxL: window.innerWidth  - W,
            maxT: window.innerHeight - 50,
        };
        offsetRef.current = { x: e.clientX - cur.left, y: e.clientY - cur.top };
        setDragging(true);
        e.preventDefault();
    }, [W]);

    useEffect(() => {
        if (!dragging) return;
        const move = (e) => {
            const { minL, minT, maxL, maxT } = boundsRef.current;
            const next = {
                left: Math.round(Math.min(Math.max(e.clientX - offsetRef.current.x, minL), maxL)),
                top:  Math.round(Math.min(Math.max(e.clientY - offsetRef.current.y, minT), maxT)),
            };
            posRef.current = next;
            setPos(next);
        };
        const up = (e) => {
            setDragging(false);
            const { minL, minT, maxL, maxT } = boundsRef.current;
            const next = {
                left: Math.round(Math.min(Math.max(e.clientX - offsetRef.current.x, minL), maxL)),
                top:  Math.round(Math.min(Math.max(e.clientY - offsetRef.current.y, minT), maxT)),
            };
            posRef.current = next;
            setPos(next);
            try { localStorage.setItem(`jarvis-pos-${dragId}`, JSON.stringify(next)); } catch {}
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup',   up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup',   up);
        };
    }, [dragging, dragId]);

    // Double-click: snap back to corner
    const onDoubleClick = useCallback((e) => {
        e.stopPropagation();
        const next = getCornerPos();
        posRef.current = next;
        setPos(next);
        try { localStorage.removeItem(`jarvis-pos-${dragId}`); } catch {}
    }, [dragId, getCornerPos]);

    if (!pos) return null;   // not yet mounted client-side

    return (
        <div
            onPointerDown={onPointerDown}
            onDoubleClick={onDoubleClick}
            style={{
                position: 'fixed',
                left: pos.left,
                top:  pos.top,
                width: W,
                zIndex: dragging ? 9999 : 300,
                cursor: dragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                transition: dragging ? 'none' : 'box-shadow 0.2s',
                boxShadow: dragging
                    ? '0 0 40px rgba(0,212,255,0.4), 0 12px 48px rgba(0,0,0,0.75)'
                    : '0 8px 28px rgba(0,212,255,0.1)',
            }}
            title="Drag to move · double-click to reset"
        >
            <div style={{
                background: 'rgba(0,12,24,0.92)',
                border: '1px solid rgba(0,212,255,0.28)',
                backdropFilter: 'blur(6px)',
                padding: '12px',
                clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '8px', letterSpacing: '0.18em', color: 'rgba(0,212,255,0.6)' }}>
                        {title}
                    </span>
                    <span
                        onClick={onClose}
                        data-no-drag
                        style={{ fontFamily: 'Orbitron', fontSize: '11px', color: 'rgba(0,212,255,0.5)', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
                    >
                        ×
                    </span>
                </div>
                {children}
            </div>
        </div>
    );
}

const keyStyle = (variant = 'default') => ({
    fontFamily: 'Orbitron',
    fontSize: '12px',
    fontWeight: '600',
    padding: '9px 0',
    textAlign: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    border: '1px solid rgba(0,212,255,0.2)',
    background: variant === 'op' ? 'rgba(0,212,255,0.12)'
        : variant === 'equal' ? 'rgba(0,212,255,0.25)'
            : variant === 'clear' ? 'rgba(239,68,68,0.12)'
                : 'rgba(0,18,36,0.6)',
    color: variant === 'clear' ? 'rgba(239,68,68,0.85)' : '#00d4ff',
    transition: 'all 0.15s',
});

// ─────────────────────────────────────────────────────────────────────────────
// Calculator — docks top-right
// ─────────────────────────────────────────────────────────────────────────────
export function CalculatorPanel({ onClose }) {
    const [expr, setExpr] = useState('');
    const [result, setResult] = useState(null);

    const evaluate = () => {
        try {
            const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
            if (!sanitized.trim()) return;
            const val = Function(`"use strict"; return (${sanitized})`)();
            setResult(typeof val === 'number' && isFinite(val) ? val : 'Error');
        } catch {
            setResult('Error');
        }
    };

    const press = (key) => {
        if (key === 'C') { setExpr(''); setResult(null); return; }
        if (key === '⌫') { setExpr((e) => e.slice(0, -1)); return; }
        if (key === '=') { evaluate(); return; }
        setExpr((e) => e + key);
    };

    const keys = [
        ['C', '⌫', '%', '/'],
        ['7', '8', '9', '*'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['0', '.', '='],
    ];

    return (
        <Panel corner="top-right" width="220px" title="CALCULATOR" onClose={onClose} dragId="calculator-panel">
            <div style={{
                background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.2)',
                padding: '10px 12px', marginBottom: '8px', minHeight: '54px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end',
            }}>
                <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.5)', minHeight: '14px', wordBreak: 'break-all' }}>
                    {expr || '0'}
                </div>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '20px', fontWeight: '700', color: '#00d4ff' }}>
                    {result !== null ? result : ''}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {keys.flat().map((k, i) => {
                    const variant = ['/', '*', '-', '+', '%'].includes(k) ? 'op'
                        : k === '=' ? 'equal'
                            : k === 'C' ? 'clear'
                                : 'default';
                    const span = k === '0' ? { gridColumn: 'span 2' } : {};
                    return (
                        <div key={i} onClick={() => press(k)} data-no-drag style={{ ...keyStyle(variant), ...span }}>
                            {k}
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timer — docks bottom-right, digital-watch styling
// ─────────────────────────────────────────────────────────────────────────────
export function TimerPanel({ onClose, activeTimers, onAddTimer }) {
    const [customMin, setCustomMin] = useState('');
    const [customSec, setCustomSec] = useState('');

    const presets = [
        { label: '1m', seconds: 60 },
        { label: '5m', seconds: 300 },
        { label: '10m', seconds: 600 },
        { label: '25m', seconds: 1500 },
    ];

    const startCustom = () => {
        const mins = parseInt(customMin || '0', 10);
        const secs = parseInt(customSec || '0', 10);
        const total = mins * 60 + secs;
        if (total <= 0) return;
        onAddTimer(total, 'Timer');
        setCustomMin(''); setCustomSec('');
    };

    const primary = activeTimers[0];

    return (
        <Panel corner="bottom-right" width="230px" title="TIMER" onClose={onClose} dragId="timer-panel">
            {/* Digital watch display */}
            <div style={{
                background: '#020608',
                border: '1px solid rgba(0,212,255,0.3)',
                padding: '14px 10px',
                marginBottom: '10px',
                textAlign: 'center',
                boxShadow: 'inset 0 0 12px rgba(0,212,255,0.08)',
            }}>
                {primary ? (
                    <DigitalWatch label={primary.label} endsAt={primary.endsAt} />
                ) : (
                    <div style={{
                        fontFamily: 'Orbitron', fontSize: '34px', fontWeight: '700',
                        color: 'rgba(0,212,255,0.18)', letterSpacing: '0.05em',
                        textShadow: '0 0 6px rgba(0,212,255,0.1)',
                    }}>
                        00:00
                    </div>
                )}
                {activeTimers.length > 1 && (
                    <div style={{ fontFamily: 'Share Tech Mono', fontSize: '8px', color: 'rgba(0,212,255,0.35)', marginTop: '4px' }}>
                        +{activeTimers.length - 1} more running
                    </div>
                )}
            </div>

            {/* Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {presets.map((p) => (
                    <div key={p.label} onClick={() => onAddTimer(p.seconds, p.label)} data-no-drag style={{ ...keyStyle('default'), fontSize: '10px', padding: '7px 0' }}>
                        {p.label}
                    </div>
                ))}
            </div>

            {/* Custom */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                    type="number" min="0" placeholder="m" value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    style={{ width: '40px', background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff', fontFamily: 'Share Tech Mono', fontSize: '11px', padding: '6px', textAlign: 'center' }}
                />
                <span style={{ color: 'rgba(0,212,255,0.4)', fontSize: '10px' }}>:</span>
                <input
                    type="number" min="0" max="59" placeholder="s" value={customSec}
                    onChange={(e) => setCustomSec(e.target.value)}
                    style={{ width: '40px', background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff', fontFamily: 'Share Tech Mono', fontSize: '11px', padding: '6px', textAlign: 'center' }}
                />
                <div onClick={startCustom} data-no-drag style={{ ...keyStyle('equal'), flex: 1, padding: '6px 0', fontSize: '10px' }}>
                    GO
                </div>
            </div>
        </Panel>
    );
}

function DigitalWatch({ label, endsAt }) {
    const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

    useEffect(() => {
        const t = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 1000);
        return () => clearInterval(t);
    }, [endsAt]);

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const blink = secs % 2 === 0;
    const low = remaining < 10000 && remaining > 0;

    return (
        <>
            <div style={{
                fontFamily: 'Orbitron', fontSize: '34px', fontWeight: '700',
                color: low ? '#ef4444' : '#00d4ff',
                letterSpacing: '0.05em',
                textShadow: low ? '0 0 12px rgba(239,68,68,0.6)' : '0 0 12px rgba(0,212,255,0.5)',
                fontVariantNumeric: 'tabular-nums',
            }}>
                {mins.toString().padStart(2, '0')}
                <span style={{ opacity: blink ? 1 : 0.25, transition: 'opacity 0.15s' }}>:</span>
                {secs.toString().padStart(2, '0')}
            </div>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: '8px', color: 'rgba(0,212,255,0.45)', letterSpacing: '0.15em', marginTop: '4px' }}>
                {label.toUpperCase()}
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notebook — docks bottom-left
// ─────────────────────────────────────────────────────────────────────────────
export function NotebookPanel({ onClose }) {
    const [text, setText] = useState(() => {
        if (typeof window === 'undefined') return '';
        try { return localStorage.getItem('jarvis-notebook') || ''; } catch { return ''; }
    });
    const [saved, setSaved] = useState(true);
    const saveTimeout = useRef(null);

    const handleChange = (e) => {
        setText(e.target.value);
        setSaved(false);
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            try {
                localStorage.setItem('jarvis-notebook', e.target.value);
                setSaved(true);
            } catch { /* ignore */ }
        }, 600);
    };

    const clearNotes = () => {
        setText('');
        localStorage.removeItem('jarvis-notebook');
        setSaved(true);
    };

    return (
        <Panel corner="bottom-left" width="240px" title="NOTEBOOK" onClose={onClose} dragId="notebook-panel">
            <textarea
                value={text}
                onChange={handleChange}
                placeholder="Start typing, sir..."
                style={{
                    width: '100%', height: '140px', resize: 'none',
                    background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.2)',
                    color: '#00d4ff', fontFamily: 'Share Tech Mono', fontSize: '11px', lineHeight: '1.5',
                    padding: '10px', outline: 'none', marginBottom: '6px',
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: '8px', color: 'rgba(0,212,255,0.35)' }}>
                    {saved ? '● saved' : '○ saving...'}
                </span>
                <span onClick={clearNotes} data-no-drag style={{ fontFamily: 'Share Tech Mono', fontSize: '8px', color: 'rgba(239,68,68,0.6)', cursor: 'pointer' }}>
                    clear
                </span>
            </div>
        </Panel>
    );
}