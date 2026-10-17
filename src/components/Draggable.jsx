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
 * ── SPATIAL UI FEATURES ──
 * - Spring physics: panels move with inertia and elastic snap
 * - Breathing animation: subtle idle bobbing when not being dragged
 * - Magnetic edges: panels gently snap to nearby edges
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

    // ── Spring physics state ──
    const velocityRef = useRef({ x: 0, y: 0 });
    const springTargetRef = useRef(null);
    const springRafRef = useRef(null);

    // ── Breathing animation ──
    const breathRef = useRef(null);
    const breathOffsetRef = useRef(0);

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

    // ── Breathing animation — subtle idle floating ──
    useEffect(() => {
        if (phase !== 'fixed' || dragging) {
            if (breathRef.current) cancelAnimationFrame(breathRef.current);
            return;
        }

        // Each panel gets a unique phase offset based on its id hash
        let idHash = 0;
        for (let i = 0; i < id.length; i++) idHash += id.charCodeAt(i);
        const phaseOffset = (idHash % 100) / 100 * Math.PI * 2;
        const startTime = performance.now();

        const breathe = () => {
            const elapsed = (performance.now() - startTime) * 0.001;
            // Gentle sine wave: ±2px vertical, 0.4Hz
            breathOffsetRef.current = Math.sin(elapsed * 0.4 * Math.PI * 2 + phaseOffset) * 2;
            breathRef.current = requestAnimationFrame(breathe);
        };
        breathRef.current = requestAnimationFrame(breathe);

        return () => {
            if (breathRef.current) cancelAnimationFrame(breathRef.current);
            breathOffsetRef.current = 0;
        };
    }, [phase, dragging, id]);

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

    // ── Spring animation for post-drag momentum ──
    const startSpringAnimation = useCallback((initialVelocity) => {
        if (springRafRef.current) cancelAnimationFrame(springRafRef.current);

        const SPRING_DAMPING = 0.88;   // velocity decay per frame
        const EDGE_SNAP_DISTANCE = 30; // px — snap to edge if within this
        const MIN_VELOCITY = 0.3;

        const animate = () => {
            let vx = velocityRef.current.x * SPRING_DAMPING;
            let vy = velocityRef.current.y * SPRING_DAMPING;

            if (Math.abs(vx) < MIN_VELOCITY && Math.abs(vy) < MIN_VELOCITY) {
                velocityRef.current = { x: 0, y: 0 };
                // Final edge snapping
                setFixedPos(prev => {
                    const snapped = { ...prev };
                    if (snapped.left < EDGE_SNAP_DISTANCE) snapped.left = 0;
                    if (snapped.top < EDGE_SNAP_DISTANCE) snapped.top = 0;
                    if (window.innerWidth - snapped.left - panelW < EDGE_SNAP_DISTANCE) {
                        snapped.left = window.innerWidth - panelW;
                    }
                    if (window.innerHeight - snapped.top - placeholderH < EDGE_SNAP_DISTANCE) {
                        snapped.top = window.innerHeight - placeholderH;
                    }
                    try { localStorage.setItem(`jarvis-pos-${id}`, JSON.stringify(snapped)); } catch {}
                    return snapped;
                });
                return;
            }

            velocityRef.current = { x: vx, y: vy };

            setFixedPos(prev => {
                let newLeft = prev.left + vx;
                let newTop = prev.top + vy;

                // Bounce off edges with energy loss
                if (newLeft < 0) { newLeft = 0; vx = -vx * 0.3; velocityRef.current.x = vx; }
                if (newTop < 0) { newTop = 0; vy = -vy * 0.3; velocityRef.current.y = vy; }
                const maxL = window.innerWidth - panelW;
                const maxT = window.innerHeight - placeholderH;
                if (newLeft > maxL) { newLeft = maxL; vx = -vx * 0.3; velocityRef.current.x = vx; }
                if (newTop > maxT) { newTop = maxT; vy = -vy * 0.3; velocityRef.current.y = vy; }

                return { left: Math.round(newLeft), top: Math.round(newTop) };
            });

            springRafRef.current = requestAnimationFrame(animate);
        };

        velocityRef.current = initialVelocity;
        springRafRef.current = requestAnimationFrame(animate);
    }, [panelW, placeholderH, id]);

    // ── Pointer down ──────────────────────────────────────────────────────────
    const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });

    const handlePointerDown = useCallback((e) => {
        if (disabled || phase !== 'fixed') return;
        if (e.target.closest('button, input, textarea, select, [data-no-drag]')) return;

        // Stop any ongoing spring animation
        if (springRafRef.current) cancelAnimationFrame(springRafRef.current);
        velocityRef.current = { x: 0, y: 0 };

        boundsRef.current = {
            minL: 0, minT: 0,
            maxL: window.innerWidth  - panelW,
            maxT: window.innerHeight - placeholderH,
        };
        offsetRef.current = {
            x: e.clientX - fixedRef.current.left,
            y: e.clientY - fixedRef.current.top,
        };
        lastMoveRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
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

            // Track velocity for spring release
            const now = performance.now();
            const dt = now - lastMoveRef.current.time;
            if (dt > 0) {
                velocityRef.current = {
                    x: (e.clientX - lastMoveRef.current.x) / Math.max(dt / 16, 1),
                    y: (e.clientY - lastMoveRef.current.y) / Math.max(dt / 16, 1),
                };
            }
            lastMoveRef.current = { x: e.clientX, y: e.clientY, time: now };
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

            // Launch spring animation with accumulated velocity
            const vel = velocityRef.current;
            if (Math.abs(vel.x) > 1 || Math.abs(vel.y) > 1) {
                startSpringAnimation(vel);
            } else {
                try { localStorage.setItem(`jarvis-pos-${id}`, JSON.stringify(pos)); }
                catch {}
            }
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup',   up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup',   up);
        };
    }, [dragging, id, startSpringAnimation]);

    // ── Double-click: snap back to column home position ───────────────────────
    // We can't re-measure the column (it's a spacer now), so we reset phase
    // to 'inline' for one tick to re-measure.
    const resetPosition = useCallback((e) => {
        e.stopPropagation();
        if (springRafRef.current) cancelAnimationFrame(springRafRef.current);
        try { localStorage.removeItem(`jarvis-pos-${id}`); } catch {}
        setPhase('inline');          // will re-measure natural position
    }, [id]);

    // ── Cleanup spring animation on unmount ──
    useEffect(() => {
        return () => {
            if (springRafRef.current) cancelAnimationFrame(springRafRef.current);
            if (breathRef.current) cancelAnimationFrame(breathRef.current);
        };
    }, []);

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
    const breathY = dragging ? 0 : breathOffsetRef.current;

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
                    top:  fixedPos.top + breathY,
                    width: panelW,
                    zIndex: dragging ? 9999 : 200,
                    cursor: disabled ? 'default' : dragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    willChange: 'left, top, transform',
                    transition: dragging ? 'none' : 'box-shadow 0.3s ease, transform 0.15s ease',
                    boxShadow: dragging
                        ? '0 0 40px rgba(0,212,255,0.4), 0 12px 48px rgba(0,0,0,0.75)'
                        : '0 0 8px rgba(0,212,255,0.05)',
                    transform: dragging ? 'scale(1.02)' : 'scale(1)',
                }}
                title={disabled ? '' : 'Drag to move · double-click to reset'}
            >
                {children}
            </div>
        </>
    );
}