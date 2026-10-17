// Multi-Monitor / Window Position Tracker
// Monitors the browser window's position across monitors and reports
// which quadrant/monitor the window is on for spatial UI adaptations.

import { useState, useEffect, useRef } from 'react';

/**
 * Returns information about the browser window's position:
 * - monitor: estimated monitor index (0-based)
 * - quadrant: 'TL' | 'TR' | 'BL' | 'BR' (which quarter of the current screen)
 * - screenX, screenY: raw window position
 * - isMultiMonitor: true if multi-monitor setup detected
 */
export function useWindowPosition() {
    const [info, setInfo] = useState({
        monitor: 0,
        quadrant: 'TL',
        screenX: 0,
        screenY: 0,
        isMultiMonitor: false,
    });

    const rafRef = useRef(null);
    const prevRef = useRef({ screenX: -1, screenY: -1 });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const poll = () => {
            const sx = window.screenX || window.screenLeft || 0;
            const sy = window.screenY || window.screenTop || 0;

            // Only update state if position actually changed
            if (sx !== prevRef.current.screenX || sy !== prevRef.current.screenY) {
                prevRef.current = { screenX: sx, screenY: sy };

                // Estimate which monitor (assumes side-by-side horizontal layout)
                const screenW = window.screen.availWidth || 1920;
                const totalW = window.screen.width || screenW; // single monitor width
                const monitor = Math.floor(Math.max(0, sx) / totalW);

                // Multi-monitor heuristic: if screenX is larger than screen width,
                // or if screen.availWidth differs from outerWidth significantly
                const isMultiMonitor = sx > screenW || sx < 0;

                // Which quadrant of the visible screen
                const centerX = sx + (window.outerWidth / 2);
                const centerY = sy + (window.outerHeight / 2);
                const localX = centerX % screenW;
                const screenH = window.screen.availHeight || 1080;
                const qX = localX > screenW / 2 ? 'R' : 'L';
                const qY = centerY > screenH / 2 ? 'B' : 'T';
                const quadrant = qY + qX;

                setInfo({
                    monitor,
                    quadrant,
                    screenX: sx,
                    screenY: sy,
                    isMultiMonitor,
                });
            }

            rafRef.current = setTimeout(poll, 500); // poll every 500ms
        };

        poll();

        return () => {
            if (rafRef.current) clearTimeout(rafRef.current);
        };
    }, []);

    return info;
}
