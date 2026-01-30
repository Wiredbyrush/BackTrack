import { useEffect } from 'react';

export function use3DAnimation(containerId: string) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, cx = 0, cy = 0, dpr = 1, time = 0;
    let animationId: number | null = null;
    let dots: any[] = [];
    let particles: any[] = [];

    const parseColor = (value: string, fallback: string): { r: number; g: number; b: number } => {
      const raw = (value || '').trim() || fallback;
      if (!raw) return { r: 37, g: 99, b: 235 };
      if (raw.startsWith('#')) {
        let hex = raw.slice(1);
        if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
        const intVal = parseInt(hex, 16);
        return { r: (intVal >> 16) & 255, g: (intVal >> 8) & 255, b: intVal & 255 };
      }
      if (raw.startsWith('rgb')) {
        const parts = raw.match(/\d+\.?\d*/g) || [];
        return { r: Number(parts[0] || 0), g: Number(parts[1] || 0), b: Number(parts[2] || 0) };
      }
      return parseColor(fallback, '#2563eb');
    };

    const rgba = (color: { r: number; g: number; b: number }, alpha: number) =>
      `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;

    const getTheme = () => {
      const style = getComputedStyle(document.body);
      const primary = parseColor(style.getPropertyValue('--accent-primary'), '#2563eb');
      const secondary = parseColor(style.getPropertyValue('--accent-secondary'), '#06b6d4');
      const isLight = document.body.classList.contains('light-theme');
      return { primary, secondary, isLight };
    };

    const buildScene = () => {
      const radius = Math.min(w, h) * 0.28;

      // Create orbiting dots with trails
      dots = [];
      for (let i = 0; i < 12; i++) {
        dots.push({
          angle: (Math.PI * 2 * i) / 12,
          speed: 0.0005 + Math.random() * 0.0002,
          radius: radius,
          size: 4 + Math.random() * 2,
          trail: []
        });
      }

      // Floating particles with enhanced properties
      particles = [];
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = container.clientWidth;
      h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w * 0.5;
      cy = h * 0.52;
      buildScene();
    };

    const renderFrame = () => {
      const theme = getTheme();

      ctx.clearRect(0, 0, w, h);

      // Gradient background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
      bgGrad.addColorStop(0, rgba(theme.primary, theme.isLight ? 0.05 : 0.12));
      bgGrad.addColorStop(0.5, rgba(theme.primary, theme.isLight ? 0.02 : 0.06));
      bgGrad.addColorStop(1, rgba(theme.primary, 0));
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Floating particles with connections and glow
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const particlePulse = Math.sin(time * 0.001 + p.pulseOffset) * 0.3 + 0.7;

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15;
            ctx.strokeStyle = rgba(theme.secondary, alpha * (theme.isLight ? 0.4 : 0.6));
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Particle glow
        const pGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        pGlow.addColorStop(0, rgba(theme.primary, p.opacity * particlePulse * (theme.isLight ? 0.6 : 0.8)));
        pGlow.addColorStop(1, rgba(theme.primary, 0));
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Particle core
        ctx.fillStyle = rgba(theme.primary, p.opacity * (theme.isLight ? 0.6 : 0.8));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * particlePulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Center area
      const centerSize = Math.min(w, h) * 0.18;
      const pulse = Math.sin(time * 0.0012) * 0.12 + 0.88;

      // Outer center glow
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerSize * 1.2 * pulse);
      centerGlow.addColorStop(0, rgba(theme.primary, theme.isLight ? 0.25 : 0.5));
      centerGlow.addColorStop(0.5, rgba(theme.secondary, theme.isLight ? 0.12 : 0.25));
      centerGlow.addColorStop(1, rgba(theme.primary, 0));
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, centerSize * 1.2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Multiple orbit rings
      const rings = [
        { radius: 0.85, alpha: 0.35, width: 2.5 },
        { radius: 1, alpha: 0.25, width: 2 },
        { radius: 1.15, alpha: 0.15, width: 1.5 }
      ];

      rings.forEach(ring => {
        ctx.strokeStyle = rgba(theme.primary, ring.alpha * (theme.isLight ? 0.6 : 1));
        ctx.lineWidth = ring.width;
        ctx.beginPath();
        ctx.arc(cx, cy, dots[0].radius * ring.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Orbiting dots with trails and connections
      dots.forEach((dot, i) => {
        dot.angle += dot.speed;

        const x = cx + Math.cos(dot.angle) * dot.radius;
        const y = cy + Math.sin(dot.angle) * dot.radius;

        // Add to trail
        dot.trail.push({ x, y });
        if (dot.trail.length > 8) dot.trail.shift();

        // Draw trail
        for (let t = 0; t < dot.trail.length - 1; t++) {
          const alpha = (t / dot.trail.length) * 0.3;
          ctx.strokeStyle = rgba(theme.secondary, alpha * (theme.isLight ? 0.4 : 0.6));
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(dot.trail[t].x, dot.trail[t].y);
          ctx.lineTo(dot.trail[t + 1].x, dot.trail[t + 1].y);
          ctx.stroke();
        }

        // Connection to center with gradient
        const centerGrad = ctx.createLinearGradient(cx, cy, x, y);
        centerGrad.addColorStop(0, rgba(theme.primary, theme.isLight ? 0.05 : 0.08));
        centerGrad.addColorStop(1, rgba(theme.secondary, theme.isLight ? 0.15 : 0.2));
        ctx.strokeStyle = centerGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Connection to next dot
        if (i < dots.length - 1) {
          const nextDot = dots[i + 1];
          const nx = cx + Math.cos(nextDot.angle) * nextDot.radius;
          const ny = cy + Math.sin(nextDot.angle) * nextDot.radius;

          const connectionGrad = ctx.createLinearGradient(x, y, nx, ny);
          connectionGrad.addColorStop(0, rgba(theme.secondary, theme.isLight ? 0.2 : 0.35));
          connectionGrad.addColorStop(0.5, rgba(theme.primary, theme.isLight ? 0.25 : 0.4));
          connectionGrad.addColorStop(1, rgba(theme.secondary, theme.isLight ? 0.2 : 0.35));
          ctx.strokeStyle = connectionGrad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
        }

        // Dot glow layers
        const dotPulse = Math.sin(time * 0.002 + i * 0.5) * 0.2 + 0.8;

        // Outer glow
        const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, dot.size * 8 * dotPulse);
        outerGlow.addColorStop(0, rgba(theme.secondary, (theme.isLight ? 0.4 : 0.6) * dotPulse));
        outerGlow.addColorStop(0.5, rgba(theme.primary, (theme.isLight ? 0.2 : 0.3) * dotPulse));
        outerGlow.addColorStop(1, rgba(theme.secondary, 0));
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(x, y, dot.size * 8 * dotPulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, dot.size * 4 * dotPulse);
        innerGlow.addColorStop(0, rgba(theme.secondary, (theme.isLight ? 0.8 : 1) * dotPulse));
        innerGlow.addColorStop(1, rgba(theme.secondary, 0));
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(x, y, dot.size * 4 * dotPulse, 0, Math.PI * 2);
        ctx.fill();

        // Dot core
        ctx.fillStyle = rgba(theme.secondary, theme.isLight ? 0.95 : 1);
        ctx.beginPath();
        ctx.arc(x, y, dot.size * dotPulse, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer highlight
        const shimmer = Math.sin(time * 0.003 + i) * 0.3 + 0.7;
        ctx.fillStyle = rgba({ r: 255, g: 255, b: 255 }, 0.9 * shimmer);
        ctx.beginPath();
        ctx.arc(x - dot.size * 0.15, y - dot.size * 0.15, dot.size * 0.35 * dotPulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Center core with enhanced glow
      const coreSize = 14 * pulse;
      const coreShimmer = Math.sin(time * 0.0015) * 0.2 + 0.8;

      // Outer core glow
      const outerCoreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 4);
      outerCoreGlow.addColorStop(0, rgba(theme.primary, (theme.isLight ? 0.3 : 0.5) * pulse));
      outerCoreGlow.addColorStop(0.3, rgba(theme.secondary, (theme.isLight ? 0.2 : 0.3) * pulse));
      outerCoreGlow.addColorStop(1, rgba(theme.primary, 0));
      ctx.fillStyle = outerCoreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 4, 0, Math.PI * 2);
      ctx.fill();

      // Middle core glow
      const midCoreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 2.5);
      midCoreGlow.addColorStop(0, rgba(theme.primary, (theme.isLight ? 0.6 : 0.8) * pulse));
      midCoreGlow.addColorStop(0.5, rgba(theme.secondary, (theme.isLight ? 0.4 : 0.5) * pulse));
      midCoreGlow.addColorStop(1, rgba(theme.primary, 0));
      ctx.fillStyle = midCoreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner core glow
      const innerCoreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 1.5);
      innerCoreGlow.addColorStop(0, rgba(theme.secondary, (theme.isLight ? 0.8 : 1) * pulse));
      innerCoreGlow.addColorStop(1, rgba(theme.primary, (theme.isLight ? 0.5 : 0.7)));
      ctx.fillStyle = innerCoreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Core body
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      coreGrad.addColorStop(0, rgba(theme.secondary, theme.isLight ? 1 : 1));
      coreGrad.addColorStop(0.7, rgba(theme.primary, theme.isLight ? 0.95 : 1));
      coreGrad.addColorStop(1, rgba(theme.primary, theme.isLight ? 0.8 : 0.9));
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Core highlights with shimmer
      ctx.fillStyle = rgba({ r: 255, g: 255, b: 255 }, (theme.isLight ? 0.95 : 1) * coreShimmer);
      ctx.beginPath();
      ctx.arc(cx - coreSize * 0.2, cy - coreSize * 0.2, coreSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Secondary highlight
      ctx.fillStyle = rgba({ r: 255, g: 255, b: 255 }, (theme.isLight ? 0.7 : 0.85) * coreShimmer);
      ctx.beginPath();
      ctx.arc(cx + coreSize * 0.15, cy + coreSize * 0.15, coreSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      time += 16;
      renderFrame();
      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => { resize(); renderFrame(); };
    window.addEventListener('resize', handleResize);

    resize();
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [containerId]);
}
