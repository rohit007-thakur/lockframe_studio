"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ThreeRelightCanvasProps {
  imageUrl: string;
  isRelightActive: boolean;
  lightColor?: string;
  lightIntensity?: number;
  onCanvasClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
}

export default function ThreeRelightCanvas({
  imageUrl,
  isRelightActive,
  lightColor = "#00f0ff",
  lightIntensity = 1.6,
  onCanvasClick,
  children,
}: ThreeRelightCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 800;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    canvasRef.current.innerHTML = "";
    canvasRef.current.appendChild(renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform vec3 uLightPos;
      uniform vec3 uLightColor;
      uniform float uLightIntensity;
      uniform float uActive;
      uniform vec2 uResolution;
      varying vec2 vUv;

      float getLuminance(vec4 color) {
        return dot(color.rgb, vec3(0.299, 0.587, 0.114));
      }

      void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        if (texColor.a < 0.01) {
          gl_FragColor = vec4(0.0);
          return;
        }

        if (uActive < 0.5) {
          gl_FragColor = texColor;
          return;
        }

        // Real-time normal estimation using 4-point Sobel gradient
        vec2 texel = 1.0 / uResolution;
        float lLeft  = getLuminance(texture2D(uTexture, vUv - vec2(texel.x, 0.0)));
        float lRight = getLuminance(texture2D(uTexture, vUv + vec2(texel.x, 0.0)));
        float lDown  = getLuminance(texture2D(uTexture, vUv - vec2(0.0, texel.y)));
        float lUp    = getLuminance(texture2D(uTexture, vUv + vec2(0.0, texel.y)));

        float dx = (lRight - lLeft) * 3.8;
        float dy = (lUp - lDown) * 3.8;
        vec3 normal = normalize(vec3(-dx, -dy, 1.0));

        // Light vector calculation (Z-axis height gives natural depth relief)
        vec3 pixelPos = vec3(vUv.x * 2.0 - 1.0, (1.0 - vUv.y) * 2.0 - 1.0, 0.0);
        vec3 lightVector = uLightPos - pixelPos;
        vec3 lightDir = normalize(lightVector);
        float dist = length(lightVector);
        float attenuation = clamp(1.0 / (1.0 + 0.9 * dist * dist), 0.0, 1.0);

        // Blinn-Phong Shading Model with Specular Highlights
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), 28.0);

        vec3 ambient = texColor.rgb * 0.70;
        vec3 diffuse = texColor.rgb * uLightColor * diff * uLightIntensity * attenuation;
        vec3 specular = uLightColor * spec * (uLightIntensity * 0.9) * attenuation;

        gl_FragColor = vec4(ambient + diffuse + specular, texColor.a);
      }
    `;

    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uLightPos: { value: new THREE.Vector3(0.0, 0.0, 0.55) },
      uLightColor: { value: new THREE.Color(lightColor) },
      uLightIntensity: { value: lightIntensity },
      uActive: { value: isRelightActive ? 1.0 : 0.0 },
      uResolution: { value: new THREE.Vector2(width, height) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle element resize
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !materialRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      if (w > 0 && h > 0) {
        rendererRef.current.setSize(w, h);
        materialRef.current.uniforms.uResolution.value.set(w, h);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Load and cache Texture with CORS support
  useEffect(() => {
    if (!materialRef.current || !imageUrl) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
      imageUrl,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (materialRef.current) {
          materialRef.current.uniforms.uTexture.value = tex;
          materialRef.current.needsUpdate = true;
          setIsLoaded(true);
        }
      },
      undefined,
      (err) => {
        console.warn("WebGL texture load notice (using fallback):", err);
      }
    );
  }, [imageUrl]);

  // Update uniforms when props change
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uActive.value = isRelightActive ? 1.0 : 0.0;
    materialRef.current.uniforms.uLightColor.value = new THREE.Color(lightColor);
    materialRef.current.uniforms.uLightIntensity.value = lightIntensity;
  }, [isRelightActive, lightColor, lightIntensity]);

  // Mouse Move: Calculate dynamic light coordinate in normalized clip space [-1, 1]
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !materialRef.current || !isRelightActive) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
    const y = -(((e.clientY - rect.top) / rect.height) * 2.0 - 1.0);
    materialRef.current.uniforms.uLightPos.value.set(x, y, 0.55);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={onCanvasClick}
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair select-none"
    >
      {/* Three.js WebGL Canvas Layer */}
      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center"
      />

      {/* Fallback image if WebGL is initializing */}
      {!isLoaded && (
        <img
          src={imageUrl}
          alt="Canvas Base"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* Interactive Overlays (Masks, Bezier SVG, Skeletons, Click Markers) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {children}
      </div>
    </div>
  );
}
