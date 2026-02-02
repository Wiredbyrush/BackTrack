import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function use3DAnimation(containerId: string) {
  const containerRef = useRef<HTMLElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    containerRef.current = container;

    // Clean up any existing content
    container.innerHTML = '';

    // Scene Setup
    const scene = new THREE.Scene();

    // Transparent background for seamless integration
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 20;

    // --- Objects ---

    // 1. Central Core (The "Found" Item)
    const coreGeometry = new THREE.IcosahedronGeometry(4, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Inner glowing core
    const innerCoreGeometry = new THREE.SphereGeometry(2, 32, 32);
    const innerCoreMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4
    });
    const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
    scene.add(innerCore);

    // 2. Data Stream Particles (Lost Items)
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 700;
    const posArray = new Float32Array(particleCount * 3);

    // Distributions for galaxy shape
    for (let i = 0; i < particleCount * 3; i += 3) {
      // Spiral galaxy distribution
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 15; // Distance from center
      const spiralOffset = angle * 0.5;

      // Flattened galaxy effect
      posArray[i] = Math.cos(angle + spiralOffset) * radius;     // x
      posArray[i + 1] = (Math.random() - 0.5) * 5;                 // y (thinner vertical spread)
      posArray[i + 2] = Math.sin(angle + spiralOffset) * radius;   // z
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Custom star texture hack (using canvas) to avoid loading external assets if possible
    const getStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(37, 99, 235, 1)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const texture = getStarTexture();

    const material = new THREE.PointsMaterial({
      size: 0.5,
      map: texture || undefined,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false,
      color: 0xffffff
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // --- Interaction ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!container) return;
      const windowHalfX = container.clientWidth / 2;
      const windowHalfY = container.clientHeight / 2;
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    };

    document.addEventListener('mousemove', handleMouseMove);

    // --- Responsive ---
    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    const animate = () => {
      const motionDisabled = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (motionDisabled) {
        renderer.render(scene, camera);
        return;
      }

      animationFrameId.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Rotate particles
      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x = elapsedTime * 0.01;

      // Pulse Core
      const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
      core.scale.set(scale, scale, scale);
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;

      innerCore.scale.set(scale * 0.8, scale * 0.8, scale * 0.8);

      // Mouse Interaction (Parallax)
      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;

      particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
      particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

      renderer.render(scene, camera);
    };

    animate();

    // Trigger initial fade in
    container.style.opacity = '0';
    setTimeout(() => {
      container.style.transition = 'opacity 1s ease';
      container.style.opacity = '1';
    }, 100);

    // Cleanup
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);

      if (renderer) {
        renderer.dispose();
      }

      // Dispose geometries and materials if needed, though mostly handled by gc unless excessively created
      coreGeometry.dispose();
      coreMaterial.dispose();
      innerCoreGeometry.dispose();
      innerCoreMaterial.dispose();
      particlesGeometry.dispose();
      material.dispose();
      if (texture) texture.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerId]);
}
