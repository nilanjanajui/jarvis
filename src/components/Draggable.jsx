'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function Draggable({ id, children, disabled, style }) {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const [dragging, setDragging] = useState(false);
    const offsetRef = useRef({ x: 0, y: 0 });
    const posRef = useRef(pos);
    const elRef = useRef(null);
    const boundsRef = useRef(null); // { minX, maxX, minY, maxY }

    useEffect(() => { posRef.current = pos; }, [pos]);

    const clamp = (next, bounds) => {
        if (!bounds) return next;
        return {
            x: Math.min(Math.max(next.x, bounds.minX), bounds.maxX),
            y: Math.min(Math.max(next.y, bounds.minY), bounds.maxY),
        };
    };

    // Compute how far this panel is allowed to move in each direction
    const computeBounds = useCallback(() => {
        if (!elRef.current) return null;
        const rect = elRef.current.getBoundingClientRect();
        const homeLeft = rect.left - posRef.current.x;
        const homeTop = rect.top - posRef.current.y;
        const width = rect.width;
        const height = rect.height;

        return {
            minX: -homeLeft,
            minY: -homeTop,
            maxX: window.innerWidth - width - homeLeft,
            maxY: window.innerHeight - height - homeTop,
        };
    }, []);

    // Load saved pos post-mount & re-clamp on resize
    useEffect(() => {
        const reclamp = () => {
            let targetPos = posRef.current;
            try {
                const saved = localStorage.getItem(`jarvis-pos-${id}`);
                if (saved) targetPos = JSON.parse(saved);
            } catch {}
            const bounds = computeBounds();
            setPos(bounds ? clamp(targetPos, bounds) : targetPos);
        };
        const t = setTimeout(reclamp, 0);
        window.addEventListener('resize', reclamp);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', reclamp);
        };
    }, [id, computeBounds]);

    const handlePointerDown = useCallback((e) => {
        if (disabled) return;
        // Ignore drags starting on any interactive control, however it's
        // implemented (real <button>/<input>, or a div/span with onClick) —
        // add data-no-drag to any clickable element inside a Draggable panel.
        if (e.target.closest('button, input, textarea, select, [data-no-drag]')) return;

        boundsRef.current = computeBounds();

        setDragging(true);
        offsetRef.current = {
            x: e.clientX - posRef.current.x,
            y: e.clientY - posRef.current.y,
        };
        e.preventDefault();
    }, [disabled, computeBounds]);

    useEffect(() => {
        if (!dragging) return;

        const handleMove = (e) => {
            const raw = {
                x: e.clientX - offsetRef.current.x,
                y: e.clientY - offsetRef.current.y,
            };
            setPos(clamp(raw, boundsRef.current));
        };

        const handleUp = () => {
            setDragging(false);
            try {
                localStorage.setItem(`jarvis-pos-${id}`, JSON.stringify(posRef.current));
            } catch { /* ignore */ }
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, [dragging, id]);

    const resetPosition = useCallback((e) => {
        e.stopPropagation();
        setPos({ x: 0, y: 0 });
        try { localStorage.removeItem(`jarvis-pos-${id}`); } catch { /* ignore */ }
    }, [id]);

    return (
        <div
            ref={elRef}
            onPointerDown={handlePointerDown}
            onDoubleClick={resetPosition}
            style={{
                position: 'relative',
                ...style,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                cursor: disabled ? 'default' : (dragging ? 'grabbing' : 'grab'),
                transition: dragging ? 'none' : 'transform 0.15s ease',
                zIndex: dragging ? (style?.zIndex ? style.zIndex + 50 : 50) : (style?.zIndex ?? 'auto'),
                userSelect: dragging ? 'none' : 'auto',
            }}
            title={disabled ? '' : 'Drag to move — double-click to reset position'}
        >
            {children}
        </div>
    );
}