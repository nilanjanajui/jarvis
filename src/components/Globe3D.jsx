'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const width = mount.clientWidth || 180;
        const height = mount.clientHeight || 120;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 120;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // 3D Wireframe Earth Sphere
        const radius = 35;
        const sphereGeo = new THREE.SphereGeometry(radius, 24, 18);
        const wireframeMat = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            wireframe: true,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
        });
        const globe = new THREE.Mesh(sphereGeo, wireframeMat);
        scene.add(globe);

        // Satellite Orbit Trajectory Ring
        const ringGeo = new THREE.RingGeometry(radius + 12, radius + 12.8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x5ee8ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
        });
        const orbitRing = new THREE.Mesh(ringGeo, ringMat);
        orbitRing.rotation.x = Math.PI / 3;
        scene.add(orbitRing);

        // Satellite Marker
        const satGeo = new THREE.SphereGeometry(1.8, 8, 8);
        const satMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        const satellite = new THREE.Mesh(satGeo, satMat);
        scene.add(satellite);

        // Location Pin Point
        const pinGeo = new THREE.SphereGeometry(2.2, 12, 12);
        const pinMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(0, radius * 0.7, radius * 0.7);
        globe.add(pin);

        // Animation Loop
        let reqId;
        const startTime = performance.now();

        const animate = () => {
            reqId = requestAnimationFrame(animate);
            const elapsedTime = (performance.now() - startTime) * 0.001;

            globe.rotation.y = elapsedTime * 0.15;
            orbitRing.rotation.z = elapsedTime * 0.3;

            // Move satellite along orbit ring
            const satAngle = elapsedTime * 0.8;
            const orbitR = radius + 12;
            satellite.position.x = Math.cos(satAngle) * orbitR;
            satellite.position.y = Math.sin(satAngle) * orbitR * Math.cos(Math.PI / 3);
            satellite.position.z = Math.sin(satAngle) * orbitR * Math.sin(Math.PI / 3);

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(reqId);
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
            sphereGeo.dispose();
            wireframeMat.dispose();
            ringGeo.dispose();
            ringMat.dispose();
            satGeo.dispose();
            satMat.dispose();
            pinGeo.dispose();
            pinMat.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height: '110px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        />
    );
}
