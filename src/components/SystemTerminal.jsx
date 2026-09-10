'use client';
import { useState, useEffect } from 'react';

const AGENT = 'http://localhost:5001';

export default function SystemTerminal({ pendingCommand, onClearCommand }) {
    const [lines, setLines] = useState(['USER@SYSTEM: Initializing...']);
    const [executing, setExecuting] = useState(false);

    useEffect(() => {
        const msgs = ['SCANNING network interfaces...', 'LOADING kernel modules...', 'READY — All systems nominal.'];
        msgs.forEach((m, i) => setTimeout(() => setLines((p) => [...p, m]), (i + 1) * 1200));
    }, []);

    const runCommand = async () => {
        if (!pendingCommand) return;
        setExecuting(true);
        setLines((prev) => [...prev, `$ ${pendingCommand}`]);

        try {
            const res = await fetch(`${AGENT}/shell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: pendingCommand }),
            });
            const data = await res.json();
            if (data.output) {
                const outputLines = data.output.split('\n').slice(0, 8);
                setLines((prev) => [...prev, ...outputLines]);
            } else {
                setLines((prev) => [...prev, '[Process completed]']);
            }
        } catch (e) {
            setLines((prev) => [...prev, `ERR: Agent offline or failed`]);
        } finally {
            setExecuting(false);
            if (onClearCommand) onClearCommand();
        }
    };

    return (
        <div className="hud-card" style={{ background: 'rgba(0,6,14,0.92)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5ee8ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 9l3 3-3 3M13 15h5" />
                </svg>
                <div style={{ fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '0.15em', color: '#5ee8ff' }}>SYSTEM TERMINAL</div>
            </div>
            <span className="hud-sublabel" style={{ marginTop: '2px', marginLeft: '18px' }}>SYS.TRM.6B41-D</span>

            {pendingCommand && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,170,0,0.1)', border: '1px solid #ffaa00', borderRadius: '4px' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: '9px', color: '#ffaa00', letterSpacing: '0.1em', marginBottom: '4px' }}>
                        COMMAND APPROVAL REQUIRED
                    </div>
                    <div style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#fff', marginBottom: '6px' }}>
                        $ {pendingCommand}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={runCommand}
                            disabled={executing}
                            style={{
                                fontFamily: 'Orbitron', fontSize: '9px', padding: '3px 8px', background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff', cursor: 'pointer'
                            }}>
                            {executing ? 'RUNNING...' : 'EXECUTE'}
                        </button>
                        <button
                            onClick={() => onClearCommand?.()}
                            style={{
                                fontFamily: 'Orbitron', fontSize: '9px', padding: '3px 8px', background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer'
                            }}>
                            REJECT
                        </button>
                    </div>
                </div>
            )}

            <div style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', lineHeight: '1.7', marginTop: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {lines.map((l, i) => (
                    <div key={i} style={{ color: i === 0 ? '#5ee8ff' : 'rgba(0,212,255,0.75)' }}>{l}</div>
                ))}
                <span style={{ color: '#5ee8ff', animation: 'blink 1.2s step-end infinite' }}>▮</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px solid rgba(0,212,255,0.15)', paddingTop: '4px' }}>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.5)' }}>MODE: Interactive</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: '9px', color: 'rgba(0,212,255,0.5)' }}>v4.3.0</span>
            </div>
        </div>
    );
}