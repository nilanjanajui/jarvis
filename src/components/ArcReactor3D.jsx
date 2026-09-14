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

export default function ArcReactor3D({ status = 'idle', audioLevel = null }) {
    const mountRef = useRef(null);
    const analyserRef = useRef(null);
    const audioCtxRef = useRef(null);

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

        if (status === 'listening' || status === 'speaking') {
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

        // Animation Loop
        let reqId;
        const startTime = performance.now();
        const freqData = new Uint8Array(32);

        const animate = () => {
            reqId = requestAnimationFrame(animate);
            const elapsedTime = (performance.now() - startTime) * 0.001;

            // Calculate real audio energy (0 to 1) from Web Audio API analyser
            let audioEnergy = 0;
            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(freqData);
                let sum = 0;
                for (let k = 0; k < freqData.length; k++) {
                    sum += freqData[k];
                }
                audioEnergy = Math.min(1.0, (sum / freqData.length) / 128.0);
            } else if (typeof audioLevel === 'number') {
                audioEnergy = Math.min(1.0, Math.max(0, audioLevel));
            }

            // Rotate particle cloud based on audio energy
            const rotSpeedMult = 1.0 + audioEnergy * 3.0;
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
                const freqVal = freqData[i % 32] / 255.0 || 0;
                const audioDisplacement = (audioEnergy * 15.0) + (freqVal * 12.0);

                const baseOffset = Math.sin(elapsedTime * pulseSpeed + i * 0.08) * statusAmp;
                const newR = originalRadius + baseOffset + audioDisplacement;

                positionsArr[idx] = dirX * newR;
                positionsArr[idx + 1] = dirY * newR;
                positionsArr[idx + 2] = dirZ * newR;
            }
            geometry.attributes.position.needsUpdate = true;

            // Accelerate orbital rings proportional to audio energy & status
            const ringSpeedBoost = 1.0 + audioEnergy * 4.0 + (status === 'thinking' ? 2.5 : 0);
            ringGroup.children.forEach((ring) => {
                ring.rotation.x += ring.userData.baseSpeedX * ringSpeedBoost;
                ring.rotation.y += ring.userData.baseSpeedY * ringSpeedBoost;
            });

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

