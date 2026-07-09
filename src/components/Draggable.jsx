'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function Draggable({ id, children, disabled }) {
    const [pos, setPos] = useState(() => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        try {
            const saved = localStorage.getItem(`jarvis-pos-${id}`);
            return saved ? JSON.parse(saved) : { x: 0, y: 0 };
        } catch {
            return { x: 0, y: 0 };
        }
    });

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

    const handlePointerDown = useCallback((e) => {
        if (disabled) return;
        if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        // Compute how far this panel is allowed to move in each direction,
        // based on its CURRENT on-screen rect (which already includes any
        // existing translate offset) minus the current pos, giving us the
        // panel's untranslated "home" rect.
        const rect = elRef.current.getBoundingClientRect();
        const homeLeft = rect.left - posRef.current.x;
        const homeTop = rect.top - posRef.current.y;
        const width = rect.width;
        const height = rect.height;

        boundsRef.current = {
            minX: -homeLeft,
            minY: -homeTop,
            maxX: window.innerWidth - width - homeLeft,
            maxY: window.innerHeight - height - homeTop,
        };

        setDragging(true);
        offsetRef.current = {
            x: e.clientX - posRef.current.x,
            y: e.clientY - posRef.current.y,
        };
        e.preventDefault();
    }, [disabled]);

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
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                cursor: disabled ? 'default' : (dragging ? 'grabbing' : 'grab'),
                transition: dragging ? 'none' : 'transform 0.15s ease',
                position: 'relative',
                zIndex: dragging ? 50 : 'auto',
                userSelect: dragging ? 'none' : 'auto',
            }}
            title={disabled ? '' : 'Drag to move — double-click to reset position'}
        >
            {children}
        </div>
    );
}