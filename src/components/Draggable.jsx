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

    useEffect(() => { posRef.current = pos; }, [pos]);

    const handlePointerDown = useCallback((e) => {
        if (disabled) return;
        // Ignore drags starting on interactive elements (buttons, inputs, textareas)
        if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

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
            const next = {
                x: e.clientX - offsetRef.current.x,
                y: e.clientY - offsetRef.current.y,
            };
            setPos(next);
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