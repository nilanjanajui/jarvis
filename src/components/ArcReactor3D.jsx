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

export default function ArcReactor3D({ status = 'idle' }) {
    const mountRef = useRef(null);

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
        const particleCount = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const originalRadius = 55;

        for (let i = 0; i < particleCount; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);

            const r = originalRadius + (Math.random() - 0.5) * 8;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const targetColor = new THREE.Color(STATUS_COLORS[status] || 0x00d4ff);
        const material = new THREE.PointsMaterial({
            color: targetColor,
            size: 1.8,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
        });

        const particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        // Concentric Orbital Rings
        const ringGroup = new THREE.Group();
        const createRing = (radius, color, speedX, speedY) => {
            const ringGeo = new THREE.RingGeometry(radius, radius + 0.6, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.userData = { speedX, speedY };
            ringGroup.add(ringMesh);
        };

        createRing(48, targetColor, 0.008, 0.005);
        createRing(62, targetColor, -0.005, 0.01);
        createRing(75, targetColor, 0.003, -0.008);
        scene.add(ringGroup);

        // Animation Loop
        let reqId;
        const startTime = performance.now();

        const animate = () => {
            reqId = requestAnimationFrame(animate);
            const elapsedTime = (performance.now() - startTime) * 0.001;

            // Rotate particle cloud
            particleSystem.rotation.y = elapsedTime * 0.2;
            particleSystem.rotation.x = Math.sin(elapsedTime * 0.1) * 0.15;

            // Pulse particles based on status
            const positionsArr = geometry.attributes.position.array;
            const pulseAmp = status === 'speaking' ? 3.5 : status === 'listening' ? 2.0 : status === 'thinking' ? 4.0 : 0.8;
            const pulseSpeed = status === 'thinking' ? 8.0 : status === 'speaking' ? 5.0 : 2.0;

            for (let i = 0; i < particleCount; i++) {
                const idx = i * 3;
                const x = positionsArr[idx];
                const y = positionsArr[idx + 1];
                const z = positionsArr[idx + 2];
                const len = Math.sqrt(x * x + y * y + z * z);
                const dirX = x / len;
                const dirY = y / len;
                const dirZ = z / len;

                const offset = Math.sin(elapsedTime * pulseSpeed + i * 0.1) * pulseAmp;
                const newR = originalRadius + offset;

                positionsArr[idx] = dirX * newR;
                positionsArr[idx + 1] = dirY * newR;
                positionsArr[idx + 2] = dirZ * newR;
            }
            geometry.attributes.position.needsUpdate = true;

            // Rotate orbital rings
            ringGroup.children.forEach((ring) => {
                ring.rotation.x += ring.userData.speedX;
                ring.rotation.y += ring.userData.speedY;
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
    }, [status]);

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
