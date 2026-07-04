// Synthesizes a mechanical "power-on" sound using the Web Audio API.
// No audio file needed — built entirely from oscillators + noise.
export function playBootSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;

        // ── Layer 1: Rising power hum (like a reactor spinning up) ──
        const hum = ctx.createOscillator();
        const humGain = ctx.createGain();
        hum.type = 'sawtooth';
        hum.frequency.setValueAtTime(60, now);
        hum.frequency.exponentialRampToValueAtTime(220, now + 1.1);
        humGain.gain.setValueAtTime(0.0001, now);
        humGain.gain.exponentialRampToValueAtTime(0.15, now + 0.9);
        humGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        hum.connect(humGain).connect(ctx.destination);

        // ── Layer 2: High-frequency sync sweep ──
        const sweep = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweep.type = 'sine';
        sweep.frequency.setValueAtTime(800, now + 0.3);
        sweep.frequency.exponentialRampToValueAtTime(1800, now + 1.0);
        sweepGain.gain.setValueAtTime(0.0001, now + 0.3);
        sweepGain.gain.exponentialRampToValueAtTime(0.05, now + 0.7);
        sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        sweep.connect(sweepGain).connect(ctx.destination);

        // ── Layer 3: Mechanical "click" (short noise burst) when systems lock in ──
        const bufferSize = ctx.sampleRate * 0.08;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1500;
        noiseGain.gain.setValueAtTime(0.3, now + 1.15);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);

        // ── Layer 4: Final confirmation "chime" (like HUD lock-on) ──
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(1200, now + 1.35);
        chimeGain.gain.setValueAtTime(0.0001, now + 1.35);
        chimeGain.gain.exponentialRampToValueAtTime(0.08, now + 1.4);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
        chime.connect(chimeGain).connect(ctx.destination);

        hum.start(now);
        hum.stop(now + 1.7);
        sweep.start(now + 0.3);
        sweep.stop(now + 1.3);
        noise.start(now + 1.15);
        chime.start(now + 1.35);
        chime.stop(now + 2.0);

        return 2000; // total duration in ms, so the caller knows when it's done
    } catch (err) {
        console.error('Boot sound failed:', err);
        return 0;
    }
}