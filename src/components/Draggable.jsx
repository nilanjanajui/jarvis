'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * TRUE fixed-position draggable panel — panels are ALWAYS position:fixed.
 *
 * This completely escapes all parent stacking contexts, so panels can never
 * be hidden behind the Three.js WebGL canvas or any other composited layer.
 *
 * How it works:
 * 1. On first mount, the panel renders inside the column (position: relative)
 *    so we can measure its natural size and position with getBoundingClientRect.
 * 2. After the first paint we "promote" it: switch to position:fixed at the
 *    same screen coordinates. Children only ever exist in ONE place.
 * 3. An invisible placeholder div (height = measured height) keeps the column
 *    from collapsing.
 *
 * Double-click resets to home. Drag saves {left,top} in localStorage.
 */
export default function Draggable({ id, children, disabled, style }) {
    // 'inline'  = first render, measuring
    // 'fixed'   = promoted to fixed position
    const [phase, setPhase]     = useState('inline');
    const [fixedPos, setFixedPos] = useState({ left: 0, top: 0 });
    const [placeholderH, setPlaceholderH] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [panelW, setPanelW]   = useState(0);

    const elRef      = useRef(null);   // the panel div
    const fixedRef   = useRef({ left: 0, top: 0 });
    const offsetRef  = useRef({ x: 0, y: 0 });
    const boundsRef  = useRef(null);

    // Sync ref
    useEffect(() => { fixedRef.current = fixedPos; }, [fixedPos]);

    // ── Phase 1: measure inline, then promote to fixed ────────────────────────
    useEffect(() => {
        if (phase !== 'inline' || !elRef.current) return;

        // Wait a tick for layout to complete
        const t = setTimeout(() => {
            if (!elRef.current) return;
            const r = elRef.current.getBoundingClientRect();
            if (r.width === 0) return;   // not laid out yet

            setPlaceholderH(r.height);
            setPanelW(r.width);

            // Restore saved position, or use natural inline position
            let pos = { left: r.left, top: r.top };
            try {
                const saved = localStorage.getItem(`jarvis-pos-${id}`);
                if (saved) {
                    const p = JSON.parse(saved);
                    if (typeof p.left === 'number' && isFinite(p.left) &&
                        typeof p.top  === 'number' && isFinite(p.top)) {
                        pos = {
                            left: Math.round(Math.min(Math.max(p.left, 0), window.innerWidth  - r.width)),
                            top:  Math.round(Math.min(Math.max(p.top,  0), window.innerHeight - r.height)),
                        };
                    }
                }
            } catch {}

            fixedRef.current = pos;
            setFixedPos(pos);
            setPhase('fixed');
        }, 0);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, id]);

    // ── Re-clamp on resize ────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'fixed') return;
        const onResize = () => {
            if (!panelW) return;
            setFixedPos(prev => ({
                left: Math.round(Math.min(Math.max(prev.left, 0), window.innerWidth  - panelW)),
                top:  Math.round(Math.min(Math.max(prev.top,  0), window.innerHeight - placeholderH)),
            }));
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [phase, panelW, placeholderH]);

    // ── Pointer down ──────────────────────────────────────────────────────────
    const handlePointerDown = useCallback((e) => {
        if (disabled || phase !== 'fixed') return;
        if (e.target.closest('button, input, textarea, select, [data-no-drag]')) return;

        boundsRef.current = {
            minL: 0, minT: 0,
            maxL: window.innerWidth  - panelW,
            maxT: window.innerHeight - placeholderH,
        };
        offsetRef.current = {
            x: e.clientX - fixedRef.current.left,
            y: e.clientY - fixedRef.current.top,
        };
        setDragging(true);
        e.preventDefault();
    }, [disabled, phase, panelW, placeholderH]);

    // ── Global pointer events while dragging ──────────────────────────────────
    useEffect(() => {
        if (!dragging) return;

        const move = (e) => {
            const { minL, minT, maxL, maxT } = boundsRef.current;
            const pos = {
                left: Math.round(Math.min(Math.max(e.clientX - offsetRef.current.x, minL), maxL)),
                top:  Math.round(Math.min(Math.max(e.clientY - offsetRef.current.y, minT), maxT)),
            };
            fixedRef.current = pos;
            setFixedPos(pos);
        };

        const up = (e) => {
            setDragging(false);
            const { minL, minT, maxL, maxT } = boundsRef.current;
            const pos = {
                left: Math.round(Math.min(Math.max(e.clientX - offsetRef.current.x, minL), maxL)),
                top:  Math.round(Math.min(Math.max(e.clientY - offsetRef.current.y, minT), maxT)),
            };
            fixedRef.current = pos;
            setFixedPos(pos);
            try { localStorage.setItem(`jarvis-pos-${id}`, JSON.stringify(pos)); }
            catch {}
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup',   up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup',   up);
        };
    }, [dragging, id]);

    // ── Double-click: snap back to column home position ───────────────────────
    // We can't re-measure the column (it's a spacer now), so we reset phase
    // to 'inline' for one tick to re-measure.
    const resetPosition = useCallback((e) => {
        e.stopPropagation();
        try { localStorage.removeItem(`jarvis-pos-${id}`); } catch {}
        setPhase('inline');          // will re-measure natural position
    }, [id]);

    // ── Render ────────────────────────────────────────────────────────────────

    if (phase === 'inline') {
        // Render normally so we can measure; invisible to avoid flash.
        return (
            <div
                ref={elRef}
                style={{
                    ...style,
                    position: 'relative',
                    opacity: 0,           // measure-only; hide flash
                    pointerEvents: 'none',
                }}
            >
                {children}
            </div>
        );
    }

    // phase === 'fixed'
    return (
        <>
            {/* Invisible spacer — keeps column height so other panels don't jump */}
            <div
                aria-hidden="true"
                style={{
                    ...style,
                    height: placeholderH,
                    pointerEvents: 'none',
                    visibility: 'hidden',
                    flexShrink: 0,
                }}
            />

            {/* Real panel — always fixed, always above WebGL / HUD */}
            <div
                onPointerDown={handlePointerDown}
                onDoubleClick={resetPosition}
                style={{
                    position: 'fixed',
                    left: fixedPos.left,
                    top:  fixedPos.top,
                    width: panelW,
                    zIndex: dragging ? 9999 : 200,
                    cursor: disabled ? 'default' : dragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    willChange: 'left, top',
                    transition: dragging ? 'none' : 'box-shadow 0.2s',
                    boxShadow: dragging
                        ? '0 0 40px rgba(0,212,255,0.4), 0 12px 48px rgba(0,0,0,0.75)'
                        : 'none',
                }}
                title={disabled ? '' : 'Drag to move · double-click to reset'}
            >
                {children}
            </div>
        </>
    );
}