// Spatial Mouse Tracker — provides normalized mouse position (-0.5 to 0.5)
// for parallax HUD effects. Uses a single global listener shared by all consumers.

import { useState, useEffect, useRef, useCallback } from 'react';

// Module-level shared state to avoid duplicate listeners
let listeners = [];
let currentPos = { nx: 0, ny: 0 };
let rafId = null;
let pendingEvent = null;

function ensureGlobalListener() {
    if (typeof window === 'undefined' || listeners._bound) return;
    listeners._bound = true;

    window.addEventListener('mousemove', (e) => {
        pendingEvent = e;
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (!pendingEvent) return;
                currentPos = {
                    nx: (pendingEvent.clientX / window.innerWidth) - 0.5,
                    ny: (pendingEvent.clientY / window.innerHeight) - 0.5,
                };
                pendingEvent = null;
                for (const fn of listeners) fn(currentPos);
            });
        }
    }, { passive: true });
}

/**
 * Hook returning { nx, ny } — normalized mouse coordinates from -0.5 to 0.5
 * where (0,0) is center of screen.
 */
export function useSpatialMouse() {
    const [pos, setPos] = useState({ nx: 0, ny: 0 });
    const posRef = useRef(pos);

    const handler = useCallback((p) => {
        posRef.current = p;
        setPos(p);
    }, []);

    useEffect(() => {
        ensureGlobalListener();
        listeners.push(handler);
        return () => {
            listeners = listeners.filter(fn => fn !== handler);
        };
    }, [handler]);

    return pos;
}
