'use client';
import { useState, useEffect, useRef, useMemo } from 'react';

const MESSAGES = [
    'Uplink established: 0.002ms',
    'Processing visual kernels...',
    'AI Core temperature nominal',
    'Minor interference in Sector 7',
    'Protocols updated to v4.2.0',
    'Background synthesis complete',
    'Monitoring persistent states...',
    'Neural pathway calibrated',
    'Firewall scan complete — 0 threats',
    'Satellite lock acquired',
    'Voice recognition module active',
    'Memory allocation optimized',
];

export default function SystemLog({ extraLine }) {
    const [lines, setLines] = useState(MESSAGES.slice(0, 5));
    const bottomRef = useRef(null);

    useEffect(() => {
        const t = setInterval(() => {
            setLines((p) => [...p.slice(-10), MESSAGES[Math.floor(Math.random() * MESSAGES.length)]]);
        }, 2500);
        return () => clearInterval(t);
    }, []);

    const displayLines = useMemo(() =>
        extraLine
            ? [...lines.slice(-9), extraLine]
            : lines,
        [lines, extraLine]
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayLines]);

    return (
        <div className="hud-card" style={{ height: '156px' }}>
            <div className="hud-label">System Metrics Log</div>
            <span className="hud-sublabel">SYS.LOG.0091-F</span>
            <div style={{ overflow: 'hidden', height: '104px' }}>
                {displayLines.map((line, i) => (
                    <div
                        key={i}
                        style={{
                            fontFamily: 'Share Tech Mono',
                            fontSize: '11px',
                            color: i === displayLines.length - 1 ? '#5ee8ff' : 'rgba(0,212,255,0.7)',
                            marginBottom: '3px',
                            letterSpacing: '0.03em',
                        }}
                    >
                        &gt; {line}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}