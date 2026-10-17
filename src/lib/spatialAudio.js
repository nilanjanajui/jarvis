// Spatial Audio Engine — adds HRTF-based 3D directional sound
// to the Jarvis HUD. Sounds pan left/right based on the source
// element's screen position, creating an immersive Iron Man-like
// experience where sounds "come from" their visual origin.

/**
 * Get the shared AudioContext (reuse from hudSounds.js)
 */
function getCtx() {
    if (typeof window === 'undefined') return null;
    if (!window.__jarvisAudioCtx) {
        window.__jarvisAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window.__jarvisAudioCtx;
}

/**
 * Create a spatial PannerNode configured for HRTF spatialization.
 * @param {number} screenX — the x-position on screen (0 to window.innerWidth)
 * @param {number} screenY — the y-position on screen (0 to window.innerHeight)
 * @returns {PannerNode|null}
 */
export function createSpatialPanner(screenX, screenY) {
    const ctx = getCtx();
    if (!ctx) return null;

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;

    // Map screen coordinates to 3D audio space
    // x: -1 (left) to 1 (right)
    // y: -1 (top) to 1 (bottom)  — inverted for audio (top = up)
    // z: fixed at -1 (in front of listener)
    const nx = ((screenX / window.innerWidth) * 2 - 1) * 3; // multiply by 3 for stronger separation
    const ny = -((screenY / window.innerHeight) * 2 - 1); // invert Y
    panner.setPosition(nx, ny, -1);

    return panner;
}

/**
 * Play a spatial click at a given screen position.
 * Drop-in replacement for playClick() when you have screen coordinates.
 */
export function playSpatialClick(screenX, screenY) {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const panner = createSpatialPanner(screenX, screenY);
    if (!panner) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain).connect(panner).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

/**
 * Play a spatial blip at a given screen position.
 */
export function playSpatialBlip(screenX, screenY) {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const panner = createSpatialPanner(screenX, screenY);
    if (!panner) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(2600, now + 0.04);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain).connect(panner).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

/**
 * Connect an existing HTMLAudioElement (e.g., ElevenLabs TTS <audio>)
 * to spatial HRTF panning at the given screen position. This makes
 * Jarvis's voice "come from" the Arc Reactor's position on screen.
 *
 * Returns a cleanup function to disconnect the node.
 */
export function spatializeAudioElement(audioElement, screenX, screenY) {
    const ctx = getCtx();
    if (!ctx || !audioElement) return () => {};

    try {
        const source = ctx.createMediaElementSource(audioElement);
        const panner = createSpatialPanner(screenX, screenY);

        if (panner) {
            source.connect(panner).connect(ctx.destination);
        } else {
            source.connect(ctx.destination);
        }

        return () => {
            try { source.disconnect(); } catch {}
        };
    } catch {
        // MediaElementSource can only be created once per element
        return () => {};
    }
}
