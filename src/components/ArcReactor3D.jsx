'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const STATUS_COLORS = {
    idle: 0x00d4ff,
    listening: 0x00ff88,
    thinking: 0xffaa00,
    speaking: 0xb026ff,
    success: 0x00ff88,
    error: 0xff0044,
    booting: 0x00d4ff,
};

export default function ArcReactor3D({ status = 'idle', audioLevel = null, ttsAudioRef = null }) {
    const mountRef = useRef(null);
    const analyserRef = useRef(null);
    const audioCtxRef = useRef(null);
    const ttsAnalyserRef = useRef(null);

    // Initialize mic audio analyser when listening/speaking if available
    useEffect(() => {
        let streamTrack = null;
        let isCancelled = false;

        const initAudio = async () => {
            try {
                if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (isCancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamTrack = stream.getTracks()[0];
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ac = new AudioCtx();
                audioCtxRef.current = ac;
                const src = ac.createMediaStreamSource(stream);
                const an = ac.createAnalyser();
                an.fftSize = 64;
                an.smoothingTimeConstant = 0.8;
                src.connect(an);
                analyserRef.current = an;
            } catch {
                // Audio capture optional fallback
            }
        };

        if (status === 'listening') {
            initAudio();
        }

        return () => {
            isCancelled = true;
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => {});
            }
            if (streamTrack) {
                streamTrack.stop();
            }
            analyserRef.current = null;
            audioCtxRef.current = null;
        };
    }, [status]);

    // ── TTS Audio Reactive: connect to the <audio> element for voice reactivity ──
    useEffect(() => {
        if (status !== 'speaking' || !ttsAudioRef?.current) return;

        let cleanup = null;
        const audio = ttsAudioRef.current;

        const connectTTS = () => {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;

                // Reuse global audio context to avoid browser limits
                const ctx = window.__jarvisAudioCtx || new AudioCtx();
                window.__jarvisAudioCtx = ctx;

                // Only create MediaElementSource once per <audio> element
                if (!audio.__jarvisSourceNode) {
                    const source = ctx.createMediaElementSource(audio);
                    audio.__jarvisSourceNode = source;
                    // Always keep it connected to destination so audio plays
                    source.connect(ctx.destination);
                }

                const an = ctx.createAnalyser();
                an.fftSize = 128;  // More frequency bins for detailed reactivity
                an.smoothingTimeConstant = 0.75;
                audio.__jarvisSourceNode.connect(an);
                ttsAnalyserRef.current = an;

                cleanup = () => {
                    try { audio.__jarvisSourceNode.disconnect(an); } catch {}
                    ttsAnalyserRef.current = null;
                };
            } catch (e) {
                // MediaElementSource errors are non-fatal
                console.warn('[ArcReactor] TTS audio connect:', e.message);
            }
        };

        connectTTS();

        return () => {
            if (cleanup) cleanup();
            ttsAnalyserRef.current = null;
        };
    }, [status, ttsAudioRef]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const width = mount.clientWidth || 240;
        const height = mount.clientHeight || 240;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 180;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // Core 3D Particle Cloud
        const particleCount = 1400;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const originalRadius = 55;
        const baseDirections = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);

            const r = originalRadius + (Math.random() - 0.5) * 10;
            const dirX = Math.sin(phi) * Math.cos(theta);
            const dirY = Math.sin(phi) * Math.sin(theta);
            const dirZ = Math.cos(phi);

            baseDirections[i * 3] = dirX;
            baseDirections[i * 3 + 1] = dirY;
            baseDirections[i * 3 + 2] = dirZ;

            positions[i * 3] = dirX * r;
            positions[i * 3 + 1] = dirY * r;
            positions[i * 3 + 2] = dirZ * r;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const targetColor = new THREE.Color(STATUS_COLORS[status] || 0x00d4ff);
        const material = new THREE.PointsMaterial({
            color: targetColor,
            size: 2.0,
            transparent: true,
            opacity: 0.88,
            blending: THREE.AdditiveBlending,
        });

        const particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        // Concentric Orbital Rings with Energy Accents
        const ringGroup = new THREE.Group();
        const createRing = (radius, color, speedX, speedY) => {
            const ringGeo = new THREE.RingGeometry(radius, radius + 0.8, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.userData = { speedX, speedY, baseSpeedX: speedX, baseSpeedY: speedY };
            ringGroup.add(ringMesh);
        };

        createRing(48, targetColor, 0.008, 0.005);
        createRing(62, targetColor, -0.006, 0.012);
        createRing(76, targetColor, 0.004, -0.009);
        scene.add(ringGroup);

        // ── Burst Particles — emitted on voice peaks ──
        const burstCount = 200;
        const burstGeo = new THREE.BufferGeometry();
        const burstPositions = new Float32Array(burstCount * 3);
        const burstVelocities = new Float32Array(burstCount * 3);
        const burstLifetimes = new Float32Array(burstCount);
        burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));

        const burstMat = new THREE.PointsMaterial({
            color: targetColor,
            size: 1.5,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });
        const burstSystem = new THREE.Points(burstGeo, burstMat);
        scene.add(burstSystem);

        let burstIndex = 0;
        let lastBurstTime = 0;

        // Animation Loop
        let reqId;
        const startTime = performance.now();
        const freqData = new Uint8Array(64); // larger FFT for TTS
        const micFreqData = new Uint8Array(32);

        const animate = () => {
            reqId = requestAnimationFrame(animate);
            const now = performance.now();
            const elapsedTime = (now - startTime) * 0.001;

            // ── Determine audio energy from the best available source ──
            let audioEnergy = 0;
            let lowEnergy = 0;  // bass → reactor glow
            let midEnergy = 0;  // mids → ring speed
            let highEnergy = 0; // highs → particle burst

            // Prefer TTS analyser when speaking, mic when listening
            const activeAnalyser = ttsAnalyserRef.current || analyserRef.current;
            const activeFreqData = ttsAnalyserRef.current ? freqData : micFreqData;
            const binCount = ttsAnalyserRef.current ? 64 : 32;

            if (activeAnalyser) {
                activeAnalyser.getByteFrequencyData(activeFreqData);
                let sum = 0, lowSum = 0, midSum = 0, highSum = 0;
                const third = Math.floor(binCount / 3);

                for (let k = 0; k < binCount; k++) {
                    const val = activeFreqData[k];
                    sum += val;
                    if (k < third) lowSum += val;
                    else if (k < third * 2) midSum += val;
                    else highSum += val;
                }
                audioEnergy = Math.min(1.0, (sum / binCount) / 128.0);
                lowEnergy = Math.min(1.0, (lowSum / third) / 128.0);
                midEnergy = Math.min(1.0, (midSum / third) / 128.0);
                highEnergy = Math.min(1.0, (highSum / (binCount - third * 2)) / 128.0);
            } else if (typeof audioLevel === 'number') {
                audioEnergy = Math.min(1.0, Math.max(0, audioLevel));
                lowEnergy = midEnergy = highEnergy = audioEnergy;
            }

            // ── Glow intensity from low frequencies ──
            const glowIntensity = 0.88 + lowEnergy * 0.12;
            material.opacity = glowIntensity;

            // Rotate particle cloud — bass drives rotation speed
            const rotSpeedMult = 1.0 + lowEnergy * 4.0;
            particleSystem.rotation.y = elapsedTime * 0.2 * rotSpeedMult;
            particleSystem.rotation.x = Math.sin(elapsedTime * 0.1) * 0.15;

            // Pulse particles based on status + real-time FFT audio energy
            const positionsArr = geometry.attributes.position.array;
            const statusAmp = status === 'speaking' ? 4.5 : status === 'listening' ? 3.0 : status === 'thinking' ? 5.0 : 1.0;
            const pulseSpeed = status === 'thinking' ? 9.0 : status === 'speaking' ? 6.0 : 2.5;

            for (let i = 0; i < particleCount; i++) {
                const idx = i * 3;
                const dirX = baseDirections[idx];
                const dirY = baseDirections[idx + 1];
                const dirZ = baseDirections[idx + 2];

                // Frequency band index modulation
                const freqVal = activeFreqData[i % binCount] / 255.0 || 0;
                const audioDisplacement = (audioEnergy * 15.0) + (freqVal * 12.0);

                const baseOffset = Math.sin(elapsedTime * pulseSpeed + i * 0.08) * statusAmp;
                const newR = originalRadius + baseOffset + audioDisplacement;

                positionsArr[idx] = dirX * newR;
                positionsArr[idx + 1] = dirY * newR;
                positionsArr[idx + 2] = dirZ * newR;
            }
            geometry.attributes.position.needsUpdate = true;

            // ── Ring speed driven by mid frequencies ──
            const ringSpeedBoost = 1.0 + midEnergy * 5.0 + (status === 'thinking' ? 2.5 : 0);
            ringGroup.children.forEach((ring) => {
                ring.rotation.x += ring.userData.baseSpeedX * ringSpeedBoost;
                ring.rotation.y += ring.userData.baseSpeedY * ringSpeedBoost;
            });

            // ── Burst particles on high-frequency peaks ──
            if (highEnergy > 0.4 && now - lastBurstTime > 80) {
                lastBurstTime = now;
                const burstAmount = Math.floor(highEnergy * 8);
                for (let b = 0; b < burstAmount; b++) {
                    const bi = (burstIndex % burstCount) * 3;
                    const bAngle = Math.random() * Math.PI * 2;
                    const bPhi = Math.random() * Math.PI;
                    burstPositions[bi] = Math.sin(bPhi) * Math.cos(bAngle) * originalRadius;
                    burstPositions[bi + 1] = Math.sin(bPhi) * Math.sin(bAngle) * originalRadius;
                    burstPositions[bi + 2] = Math.cos(bPhi) * originalRadius;
                    burstVelocities[bi] = Math.sin(bPhi) * Math.cos(bAngle) * (1.5 + highEnergy * 3);
                    burstVelocities[bi + 1] = Math.sin(bPhi) * Math.sin(bAngle) * (1.5 + highEnergy * 3);
                    burstVelocities[bi + 2] = Math.cos(bPhi) * (1.5 + highEnergy * 3);
                    burstLifetimes[burstIndex % burstCount] = 1.0;
                    burstIndex++;
                }
            }

            // Update burst particles
            for (let i = 0; i < burstCount; i++) {
                if (burstLifetimes[i] > 0) {
                    burstLifetimes[i] -= 0.025;
                    const bi = i * 3;
                    burstPositions[bi] += burstVelocities[bi];
                    burstPositions[bi + 1] += burstVelocities[bi + 1];
                    burstPositions[bi + 2] += burstVelocities[bi + 2];
                    // Slow down
                    burstVelocities[bi] *= 0.96;
                    burstVelocities[bi + 1] *= 0.96;
                    burstVelocities[bi + 2] *= 0.96;
                } else {
                    // Hide dead particles
                    burstPositions[i * 3] = 0;
                    burstPositions[i * 3 + 1] = 0;
                    burstPositions[i * 3 + 2] = 9999;
                }
            }
            burstGeo.attributes.position.needsUpdate = true;
            burstMat.opacity = 0.3 + highEnergy * 0.5;

            renderer.render(scene, camera);
        };

        animate();

        // Handle Resize
        const handleResize = () => {
            if (!mount) return;
            const w = mount.clientWidth || 240;
            const h = mount.clientHeight || 240;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(reqId);
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            burstGeo.dispose();
            burstMat.dispose();
            renderer.dispose();
        };
    }, [status, audioLevel]);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        />
    );
}
