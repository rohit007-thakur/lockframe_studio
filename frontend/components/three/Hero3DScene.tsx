"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Hero3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement("canvas");
      if (!window.WebGLRenderingContext || (!testCanvas.getContext("webgl") && !testCanvas.getContext("experimental-webgl"))) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const container = mountRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Central Stylized Floating Geometric Bust / Cyber Artifact
    const group = new THREE.Group();
    scene.add(group);

    // Core Gem / Bust Geometry
    const coreGeo = new THREE.IcosahedronGeometry(1.0, 3);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x11111a,
      emissive: 0x050510,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Outer Wireframe Cage
    const wireGeo = new THREE.IcosahedronGeometry(1.28, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    group.add(wireMesh);

    // Orbital Ring 1
    const ringGeo1 = new THREE.TorusGeometry(1.65, 0.015, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    group.add(ringMesh1);

    // Orbital Ring 2
    const ringGeo2 = new THREE.TorusGeometry(1.85, 0.012, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    group.add(ringMesh2);

    // 4. Lights: Ambient + Mouse-Driven Interactive PointLight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mousePointLight = new THREE.PointLight(0x22d3ee, 5, 10);
    mousePointLight.position.set(1.5, 1.5, 2.5);
    scene.add(mousePointLight);

    const backRimLight = new THREE.PointLight(0xa855f7, 4, 10);
    backRimLight.position.set(-2, -1.5, -2);
    scene.add(backRimLight);

    // Mouse Tracking for dynamic 3D rim lighting
    let targetX = 0;
    let targetY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 2.8;
      targetY = y * 2.8;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 5. Render Loop (Smooth 60fps)
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth float and rotation
      group.rotation.y = elapsed * 0.25;
      group.rotation.x = Math.sin(elapsed * 0.3) * 0.15;
      group.position.y = Math.sin(elapsed * 1.2) * 0.08;

      ringMesh1.rotation.z = elapsed * 0.35;
      ringMesh2.rotation.z = -elapsed * 0.25;

      // Smoothly interpolate mouse point light
      mousePointLight.position.x += (targetX - mousePointLight.position.x) * 0.08;
      mousePointLight.position.y += (targetY - mousePointLight.position.y) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="w-full h-full min-h-[420px] rounded-3xl bg-gradient-to-tr from-[#11111a] via-[#1a1429] to-[#0d1624] border border-studioBorder flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accentCyan to-accentViolet blur-xl mx-auto opacity-70 animate-pulse" />
          <div className="text-slate-300 font-display font-semibold text-lg">LockFrame Interactive 3D</div>
          <div className="text-xs text-slate-500 font-mono">Hardware acceleration recommended</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[420px] relative flex items-center justify-center select-none overflow-hidden cursor-crosshair"
    />
  );
}
