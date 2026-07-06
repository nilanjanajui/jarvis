'use client';
import { useEffect, useRef } from 'react';

export default function AudioVisualizer() {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const analyserRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const W = canvas.width, H = canvas.height;

        navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
            const ac = new AudioContext();
            const src = ac.createMediaStreamSource(stream);
            const an = ac.createAnalyser();
            an.fftSize = 128;
            src.connect(an);
            analyserRef.current = an;
        }).catch(() => { });

        const draw = () => {
            animRef.current = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, W, H);
            let data;
            if (analyserRef.current) {
                const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(buf);
                data = buf;
            } else {
                data = Array.from({ length: 64 }, (_, i) =>
                    Math.max(10, 80 + Math.sin(i * 0.4 + Date.now() * 0.001) * 40 + Math.cos(i * 0.2) * 20)
                );
            }
            const bw = (W / data.length) * 1.8;
            data.forEach((val, i) => {
                const h = (val / 255) * H * 0.85;
                ctx.fillStyle = `rgba(94,232,255,${0.5 + (val / 255) * 0.5})`;
                ctx.fillRect(i * (W / data.length), H - h, bw - 1, h);
            });
        };
        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    return (
        <div className="hud-card" style={{ marginBottom: '8px' }}>
            <div className="hud-label" style={{ marginBottom: 0 }}>Audio Visualizer</div>
            <span className="hud-sublabel">SYS.AUD.4C10-E</span>
            <canvas ref={canvasRef} style={{ width: '100%', height: '48px', display: 'block', marginTop: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontFamily: 'Share Tech Mono', fontSize: '9px', color: 'rgba(0,212,255,0.55)' }}>
                <span>20Hz</span><span>20kHz</span>
            </div>
        </div>
    );
}