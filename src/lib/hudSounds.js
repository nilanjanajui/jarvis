// Synthesized HUD/UI sound library — no audio files needed, all built from
// Web Audio API oscillators and noise. Shares a single cached AudioContext
// across every sound to avoid browser limits on concurrent contexts.

function getCtx() {
    if (typeof window === 'undefined') return null;
    if (!window.__jarvisAudioCtx) {
        window.__jarvisAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window.__jarvisAudioCtx;
}

// ── UI Interaction: neutral beep/click, for buttons and toggles ──
export function playClick() {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

// ── UI Interaction: soft hover/hologram blip, for panel toggles ──
export function playBlip() {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(2600, now + 0.04);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

// ── System Feedback: "Access Granted" — ascending confirm tone ──
export function playAccessGranted() {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.0001, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.09, now + i * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.25);
    });
}

// ── System Feedback: "Access Denied" — descending error buzz ──
export function playAccessDenied() {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(200, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(90, now + 0.4);
    gain2.gain.setValueAtTime(0.0001, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
}

// ── Data & Processing: subtle "thinking/scanning" tick ──
export function playProcessingTick() {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = 1600 + Math.random() * 800;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
}

// ── Atmospheric: short glitch burst, for state transitions ──
export function playGlitch() {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0.2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
}

// ── System Boot: mechanical power-on sequence — hum, sweep, click, chime ──
export function playBootSound() {
    const ctx = getCtx();
    if (!ctx) return 0;
    const now = ctx.currentTime;

    // Layer 1: Rising power hum (reactor spinning up)
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(60, now);
    hum.frequency.exponentialRampToValueAtTime(220, now + 1.1);
    humGain.gain.setValueAtTime(0.0001, now);
    humGain.gain.exponentialRampToValueAtTime(0.15, now + 0.9);
    humGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    hum.connect(humGain).connect(ctx.destination);

    // Layer 2: High-frequency sync sweep
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(800, now + 0.3);
    sweep.frequency.exponentialRampToValueAtTime(1800, now + 1.0);
    sweepGain.gain.setValueAtTime(0.0001, now + 0.3);
    sweepGain.gain.exponentialRampToValueAtTime(0.05, now + 0.7);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    sweep.connect(sweepGain).connect(ctx.destination);

    // Layer 3: Mechanical "click" — systems locking in
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

    // Layer 4: Confirmation chime — HUD lock-on
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

    return 2000; // total duration in ms
}