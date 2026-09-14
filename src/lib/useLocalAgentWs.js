'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const AGENT_REST_URL = 'http://localhost:5001';
const AGENT_WS_URL = 'ws://localhost:5002';

export function useLocalAgentWs() {
    const [isConnected, setIsConnected] = useState(false);
    const [isWsConnected, setIsWsConnected] = useState(false);
    const [metrics, setMetrics] = useState({
        cpu_percent: 0,
        ram_percent: 0,
        ram_used_gb: 0,
        ram_total_gb: 0,
        disk_percent: 0,
        uptime: '0h 0m',
        top_processes: [],
    });
    const [pingMs, setPingMs] = useState(0);
    const [knownApps, setKnownApps] = useState([]);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    // REST fallback health check
    const checkRestHealth = useCallback(async () => {
        try {
            const res = await fetch(`${AGENT_REST_URL}/health`, { signal: AbortSignal.timeout(2000) });
            if (res.ok) {
                const data = await res.json();
                setIsConnected(true);
                if (data.known_apps) setKnownApps(data.known_apps);
            } else {
                setIsConnected(false);
            }
        } catch {
            setIsConnected(false);
        }
    }, []);

    // Fetch fallback HTTP system stats if WebSocket fails
    const fetchHttpStats = useCallback(async () => {
        try {
            const res = await fetch(`${AGENT_REST_URL}/system-stats`, { signal: AbortSignal.timeout(2000) });
            if (res.ok) {
                const data = await res.json();
                setMetrics(prev => ({ ...prev, ...data }));
                setIsConnected(true);
            }
        } catch {
            setIsConnected(false);
        }
    }, []);

    const isWsConnectedRef = useRef(false);
    useEffect(() => {
        isWsConnectedRef.current = isWsConnected;
    }, [isWsConnected]);

    // WebSocket Connection Manager
    useEffect(() => {
        let isCancelled = false;

        const connectWs = () => {
            if (typeof window === 'undefined') return;

            try {
                const ws = new WebSocket(AGENT_WS_URL);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (isCancelled) return;
                    setIsWsConnected(true);
                    setIsConnected(true);
                    checkRestHealth();
                };

                ws.onmessage = (event) => {
                    if (isCancelled) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === 'telemetry') {
                            setMetrics(payload.data);
                            if (payload.timestamp) {
                                setPingMs(Math.max(1, Math.round(Date.now() - payload.timestamp)));
                            }
                        }
                    } catch {}
                };

                ws.onerror = () => {
                    setIsWsConnected(false);
                };

                ws.onclose = () => {
                    setIsWsConnected(false);
                    if (!isCancelled) {
                        reconnectTimerRef.current = setTimeout(connectWs, 3000);
                    }
                };
            } catch {
                setIsWsConnected(false);
            }
        };

        connectWs();
        checkRestHealth();

        // Fallback polling if WS is down
        const pollInterval = setInterval(() => {
            if (!isWsConnectedRef.current) {
                checkRestHealth();
                fetchHttpStats();
            }
        }, 3000);

        return () => {
            isCancelled = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            clearInterval(pollInterval);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [checkRestHealth, fetchHttpStats]);

    // Execute application via local agent
    const executeApp = async (appName) => {
        try {
            const res = await fetch(`${AGENT_REST_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app: appName }),
            });
            return await res.json();
        } catch (e) {
            return { success: false, message: e.message };
        }
    };

    // Kill process by PID
    const killProcess = async (pid) => {
        try {
            const res = await fetch(`${AGENT_REST_URL}/kill-process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid }),
            });
            return await res.json();
        } catch (e) {
            return { success: false, message: e.message };
        }
    };

    return {
        isConnected,
        isWsConnected,
        metrics,
        pingMs,
        knownApps,
        executeApp,
        killProcess,
    };
}
