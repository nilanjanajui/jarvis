'use client';
import { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared HUD button style
// ─────────────────────────────────────────────────────────────────────────────
const keyStyle = (variant = 'default') => ({
    fontFamily: 'Orbitron',
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '0.02em',
    padding: '14px 0',
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
// Calculator
// ─────────────────────────────────────────────────────────────────────────────
function Calculator() {
    const [expr, setExpr] = useState('');
    const [result, setResult] = useState(null);

    const evaluate = () => {
        try {
            const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
            if (!sanitized.trim()) return;
            const val = Function(`"use strict"; return (${sanitized})`)();
            if (typeof val !== 'number' || !isFinite(val)) { setResult('Error'); return; }
            setResult(val);
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
        ['0', '.', '=', ''],
    ];

    return (
        <div style={{ width: '320px' }}>
            {/* Display */}
            <div style={{
                background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.25)',
                padding: '18px 16px', marginBottom: '10px', minHeight: '80px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end',
            }}>
                <div style={{ fontFamily: 'Share Tech Mono', fontSize: '13px', color: 'rgba(0,212,255,0.5)', minHeight: '18px', wordBreak: 'break-all' }}>
                    {expr || '0'}
                </div>
                <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '30px', fontWeight: '700', color: '#00d4ff', marginTop: '4px' }}>
                    {result !== null ? result : ''}
                </div>
            </div>

            {/* Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {keys.flat().map((k, i) => {
                    if (k === '') return <div key={i} />;
                    const variant = ['/', '*', '-', '+', '%'].includes(k) ? 'op'
                        : k === '=' ? 'equal'
                            : k === 'C' ? 'clear'
                                : 'default';
                    return (
                        <div key={i} onClick={() => press(k)} style={keyStyle(variant)}>
                            {k}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timer
// ─────────────────────────────────────────────────────────────────────────────
function Timer({ activeTimers, onAddTimer }) {
    const [customMin, setCustomMin] = useState('');
    const [customSec, setCustomSec] = useState('');

    const presets = [
        { label: '1 min', seconds: 60 },
        { label: '5 min', seconds: 300 },
        { label: '10 min', seconds: 600 },
        { label: '25 min', seconds: 1500 },
    ];

    const startCustom = () => {
        const mins = parseInt(customMin || '0', 10);
        const secs = parseInt(customSec || '0', 10);
        const total = mins * 60 + secs;
        if (total <= 0) return;
        onAddTimer(total, 'Custom timer');
        setCustomMin(''); setCustomSec('');
    };

    return (
        <div style={{ width: '320px' }}>
            {/* Active countdowns */}
            {activeTimers.length > 0 ? (
                <div style={{ marginBottom: '20px' }}>
                    {activeTimers.map((t) => (
                        <BigCountdown key={t.id} label={t.label} endsAt={t.endsAt} />
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', padding: '30px 0', marginBottom: '20px',
                    fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'rgba(0,212,255,0.35)',
                }}>
                    No active timers
                </div>
            )}

            {/* Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {presets.map((p) => (
                    <div
                        key={p.label}
                        onClick={() => onAddTimer(p.seconds, p.label)}
                        style={{ ...keyStyle('default'), fontSize: '11px', padding: '10px 0' }}
                    >
                        {p.label}
                    </div>
                ))}
            </div>

            {/* Custom */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                    type="number" min="0" placeholder="min" value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    style={{
                        width: '60px', background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.25)',
                        color: '#00d4ff', fontFamily: 'Share Tech Mono', fontSize: '12px', padding: '8px', textAlign: 'center',
                    }}
                />
                <span style={{ color: 'rgba(0,212,255,0.4)', fontSize: '11px' }}>:</span>
                <input
                    type="number" min="0" max="59" placeholder="sec" value={customSec}
                    onChange={(e) => setCustomSec(e.target.value)}
                    style={{
                        width: '60px', background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.25)',
                        color: '#00d4ff', fontFamily: 'Share Tech Mono', fontSize: '12px', padding: '8px', textAlign: 'center',
                    }}
                />
                <div onClick={startCustom} style={{ ...keyStyle('equal'), flex: 1, padding: '9px 0', fontSize: '11px' }}>
                    START
                </div>
            </div>
        </div>
    );
}

function BigCountdown({ label, endsAt }) {
    const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

    useEffect(() => {
        const t = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 1000);
        return () => clearInterval(t);
    }, [endsAt]);

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const totalSecs = Math.max(1, Math.floor((endsAt - (endsAt - remaining - remaining)) / 1000)); // unused fallback

    return (
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: '10px', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.15em', marginBottom: '4px' }}>
                {label.toUpperCase()}
            </div>
            <div className="text-glow" style={{ fontFamily: 'Orbitron', fontSize: '42px', fontWeight: '700', color: '#00d4ff' }}>
                {mins}:{secs.toString().padStart(2, '0')}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notebook
// ─────────────────────────────────────────────────────────────────────────────
function Notebook() {
    const [text, setText] = useState(() => {
        if (typeof window === 'undefined') return '';
        try {
            return localStorage.getItem('jarvis-notebook') || '';
        } catch {
            return '';
        }
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
        <div style={{ width: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.4)', letterSpacing: '0.1em' }}>
                    {saved ? '● SAVED' : '○ SAVING...'}
                </span>
                <span
                    onClick={clearNotes}
                    style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(239,68,68,0.6)', letterSpacing: '0.1em', cursor: 'pointer' }}
                >
                    CLEAR
                </span>
            </div>

            <textarea
                value={text}
                onChange={handleChange}
                placeholder="Start typing, sir..."
                style={{
                    width: '100%', height: '280px', resize: 'none',
                    background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.25)',
                    color: '#00d4ff', fontFamily: 'Share Tech Mono', fontSize: '12px', lineHeight: '1.6',
                    padding: '14px', outline: 'none',
                }}
            />

            <div style={{ marginTop: '6px', textAlign: 'right', fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.3)' }}>
                {text.length} characters
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — mode switcher wrapper
// ─────────────────────────────────────────────────────────────────────────────
export default function HudTools({ mode, activeTimers, onAddTimer }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {mode === 'calculator' && <Calculator />}
            {mode === 'timer' && <Timer activeTimers={activeTimers} onAddTimer={onAddTimer} />}
            {mode === 'notebook' && <Notebook />}
        </div>
    );
}