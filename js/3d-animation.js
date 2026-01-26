// BackTrack - Premium Solar System Animation
// Clean, elegant orbital design representing the lost-and-found network
// Designed to impress FBLA judges

(function() {
  const container = document.querySelector('.hero-visual');
  if (!container) return;

  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w, h, centerX, centerY;
  let animId;
  let time = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let mouseInCanvas = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    centerX = w * 0.52;
    centerY = h * 0.48;
  }

  // Theme detection
  function isLightMode() {
    return document.body.classList.contains('light-theme');
  }

  function getColors() {
    const light = isLightMode();
    return {
      primary: light ? '#2563eb' : '#3b82f6',
      primaryRGB: light ? '37, 99, 235' : '59, 130, 246',
      secondary: light ? '#06b6d4' : '#22d3ee',
      secondaryRGB: light ? '6, 182, 212' : '34, 211, 238',
      accent: light ? '#8b5cf6' : '#a78bfa',
      accentRGB: light ? '139, 92, 246' : '167, 139, 250',
      text: light ? '15, 23, 42' : '255, 255, 255',
      glow: light ? '37, 99, 235' : '59, 130, 246',
    };
  }

  // ========== ORBITAL CONFIGURATION ==========
  const orbits = [
    { radius: 0.18, speed: 0.0012, items: 2, dotted: false },
    { radius: 0.32, speed: -0.0008, items: 3, dotted: true },
    { radius: 0.48, speed: 0.0005, items: 4, dotted: false },
    { radius: 0.66, speed: -0.0003, items: 3, dotted: true },
  ];

  // Items orbiting - representing lost items
  const orbitingItems = [];

  // Item icon definitions (cleaner, simpler)
  const itemShapes = [
    // Key
    (ctx, x, y, size) => {
      ctx.beginPath();
      ctx.arc(x, y - size * 0.25, size * 0.3, 0, Math.PI * 2);
      ctx.moveTo(x, y + size * 0.05);
      ctx.lineTo(x, y + size * 0.5);
      ctx.moveTo(x, y + size * 0.35);
      ctx.lineTo(x + size * 0.15, y + size * 0.35);
    },
    // Phone
    (ctx, x, y, size) => {
      ctx.beginPath();
      ctx.roundRect(x - size * 0.22, y - size * 0.4, size * 0.44, size * 0.8, size * 0.08);
    },
    // Wallet
    (ctx, x, y, size) => {
      ctx.beginPath();
      ctx.roundRect(x - size * 0.4, y - size * 0.28, size * 0.8, size * 0.56, size * 0.05);
    },
    // Bag
    (ctx, x, y, size) => {
      ctx.beginPath();
      ctx.roundRect(x - size * 0.32, y - size * 0.2, size * 0.64, size * 0.55, size * 0.08);
      ctx.moveTo(x - size * 0.18, y - size * 0.2);
      ctx.quadraticCurveTo(x - size * 0.18, y - size * 0.45, x, y - size * 0.45);
      ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.45, x + size * 0.18, y - size * 0.2);
    },
    // Watch
    (ctx, x, y, size) => {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.32, 0, Math.PI * 2);
      ctx.moveTo(x, y - size * 0.45);
      ctx.lineTo(x, y - size * 0.32);
      ctx.moveTo(x, y + size * 0.32);
      ctx.lineTo(x, y + size * 0.45);
    },
    // Headphones
    (ctx, x, y, size) => {
      ctx.beginPath();
      ctx.arc(x, y - size * 0.1, size * 0.38, Math.PI, 0);
      ctx.moveTo(x - size * 0.38, y - size * 0.1);
      ctx.lineTo(x - size * 0.38, y + size * 0.15);
      ctx.moveTo(x + size * 0.38, y - size * 0.1);
      ctx.lineTo(x + size * 0.38, y + size * 0.15);
    },
  ];

  function initOrbits() {
    orbitingItems.length = 0;
    let shapeIdx = 0;

    orbits.forEach((orbit, orbitIdx) => {
      for (let i = 0; i < orbit.items; i++) {
        const angle = (i / orbit.items) * Math.PI * 2 + orbitIdx * 0.5;
        orbitingItems.push({
          orbitIdx,
          angle,
          baseAngle: angle,
          size: 14 + Math.random() * 6,
          shape: itemShapes[shapeIdx % itemShapes.length],
          glowPhase: Math.random() * Math.PI * 2,
          trail: [],
        });
        shapeIdx++;
      }
    });
  }

  // ========== PARTICLES ==========
  const particles = [];
  const PARTICLE_COUNT = 40;

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 0.1 + Math.random() * 0.7,
        speed: (0.0001 + Math.random() * 0.0003) * (Math.random() > 0.5 ? 1 : -1),
        size: 1 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.3,
        twinkleSpeed: 0.002 + Math.random() * 0.003,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // ========== RENDER ==========
  function render() {
    const colors = getColors();
    const light = isLightMode();
    const baseRadius = Math.min(w, h) * 0.42;

    // Clear
    if (light) {
      ctx.clearRect(0, 0, w, h);
    } else {
      // Dark gradient background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.8);
      bgGrad.addColorStop(0, '#050510');
      bgGrad.addColorStop(0.5, '#020208');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // ========== AMBIENT GLOW ==========
    if (!light) {
      const ambientGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.8);
      ambientGlow.addColorStop(0, 'rgba(59, 130, 246, 0.06)');
      ambientGlow.addColorStop(0.5, 'rgba(34, 211, 238, 0.02)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, w, h);
    }

    // ========== DRAW ORBIT RINGS ==========
    orbits.forEach((orbit, idx) => {
      const radius = baseRadius * orbit.radius;
      const alpha = light ? 0.15 : 0.12;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

      if (orbit.dotted) {
        ctx.setLineDash([4, 8]);
      } else {
        ctx.setLineDash([]);
      }

      // Gradient stroke effect
      const gradient = ctx.createLinearGradient(
        centerX - radius, centerY,
        centerX + radius, centerY
      );
      gradient.addColorStop(0, `rgba(${colors.primaryRGB}, ${alpha * 0.5})`);
      gradient.addColorStop(0.5, `rgba(${colors.secondaryRGB}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${colors.primaryRGB}, ${alpha * 0.5})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = light ? 1.5 : 1;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // ========== DRAW PARTICLES ==========
    particles.forEach(p => {
      p.angle += p.speed;
      const twinkle = (Math.sin(time * p.twinkleSpeed + p.twinklePhase) + 1) / 2;
      const currentAlpha = p.alpha * (0.3 + twinkle * 0.7);

      const x = centerX + Math.cos(p.angle) * baseRadius * p.radius;
      const y = centerY + Math.sin(p.angle) * baseRadius * p.radius;

      ctx.beginPath();
      ctx.arc(x, y, p.size * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colors.text}, ${currentAlpha * (light ? 0.5 : 1)})`;
      ctx.fill();
    });

    // ========== DRAW CENTRAL CORE ==========
    // Outer glow rings
    for (let i = 3; i >= 0; i--) {
      const glowRadius = 20 + i * 12 + Math.sin(time * 0.003) * 3;
      const glowAlpha = (0.08 - i * 0.015) * (light ? 1.5 : 1);

      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colors.primaryRGB}, ${glowAlpha})`;
      ctx.fill();
    }

    // Core gradient
    const coreSize = 16 + Math.sin(time * 0.004) * 2;
    const coreGrad = ctx.createRadialGradient(
      centerX - 3, centerY - 3, 0,
      centerX, centerY, coreSize
    );
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, colors.primary);
    coreGrad.addColorStop(0.7, colors.secondary);
    coreGrad.addColorStop(1, `rgba(${colors.secondaryRGB}, 0.5)`);

    ctx.beginPath();
    ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Core shine
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    // ========== DRAW ORBITING ITEMS ==========
    orbitingItems.forEach(item => {
      const orbit = orbits[item.orbitIdx];
      item.angle += orbit.speed;

      const radius = baseRadius * orbit.radius;
      const x = centerX + Math.cos(item.angle) * radius;
      const y = centerY + Math.sin(item.angle) * radius;

      // Update trail
      item.trail.unshift({ x, y, alpha: 1 });
      if (item.trail.length > 12) item.trail.pop();

      // Draw trail
      item.trail.forEach((point, i) => {
        point.alpha *= 0.85;
        if (point.alpha > 0.05) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2 * (1 - i / 12), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colors.secondaryRGB}, ${point.alpha * 0.3})`;
          ctx.fill();
        }
      });

      // Item glow
      const glowPulse = (Math.sin(time * 0.003 + item.glowPhase) + 1) / 2;
      const glowSize = item.size * (1.8 + glowPulse * 0.4);

      const itemGlow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      itemGlow.addColorStop(0, `rgba(${colors.primaryRGB}, ${0.2 + glowPulse * 0.1})`);
      itemGlow.addColorStop(0.5, `rgba(${colors.secondaryRGB}, ${0.08 + glowPulse * 0.05})`);
      itemGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = itemGlow;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Item background circle
      ctx.beginPath();
      ctx.arc(x, y, item.size * 0.85, 0, Math.PI * 2);
      const bgGrad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, item.size * 0.85);
      bgGrad.addColorStop(0, light ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.9)');
      bgGrad.addColorStop(1, light ? 'rgba(241, 245, 249, 0.9)' : 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Item border
      ctx.strokeStyle = `rgba(${colors.primaryRGB}, ${light ? 0.4 : 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw item icon
      ctx.save();
      ctx.strokeStyle = light ? `rgba(${colors.text}, 0.7)` : `rgba(255, 255, 255, 0.8)`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      item.shape(ctx, x, y, item.size * 0.7);
      ctx.stroke();
      ctx.restore();
    });

    // ========== CONNECTION LINES (to nearby items) ==========
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < orbitingItems.length; i++) {
      const item1 = orbitingItems[i];
      const orbit1 = orbits[item1.orbitIdx];
      const x1 = centerX + Math.cos(item1.angle) * baseRadius * orbit1.radius;
      const y1 = centerY + Math.sin(item1.angle) * baseRadius * orbit1.radius;

      for (let j = i + 1; j < orbitingItems.length; j++) {
        const item2 = orbitingItems[j];
        const orbit2 = orbits[item2.orbitIdx];
        const x2 = centerX + Math.cos(item2.angle) * baseRadius * orbit2.radius;
        const y2 = centerY + Math.sin(item2.angle) * baseRadius * orbit2.radius;

        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        if (dist < 100) {
          const lineAlpha = (1 - dist / 100);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(${colors.secondaryRGB}, ${lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // ========== MOUSE INTERACTION ==========
    if (mouseInCanvas) {
      const mx = mouseX * w;
      const my = mouseY * h;

      // Subtle glow at cursor
      const cursorGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 60);
      cursorGlow.addColorStop(0, `rgba(${colors.primaryRGB}, ${light ? 0.08 : 0.04})`);
      cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cursorGlow;
      ctx.fillRect(mx - 60, my - 60, 120, 120);
    }

    // ========== OUTER DECORATIVE RING ==========
    const outerRingRadius = baseRadius * 0.82;
    const dashOffset = time * 0.3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRingRadius, 0, Math.PI * 2);
    ctx.setLineDash([2, 6]);
    ctx.lineDashOffset = dashOffset;
    ctx.strokeStyle = `rgba(${colors.primaryRGB}, ${light ? 0.1 : 0.06})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // ========== ACCENT DOTS ON OUTER RING ==========
    for (let i = 0; i < 8; i++) {
      const dotAngle = (i / 8) * Math.PI * 2 + time * 0.0002;
      const dotX = centerX + Math.cos(dotAngle) * outerRingRadius;
      const dotY = centerY + Math.sin(dotAngle) * outerRingRadius;

      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colors.secondaryRGB}, ${light ? 0.4 : 0.25})`;
      ctx.fill();
    }

    time++;
    animId = requestAnimationFrame(render);
  }

  // ========== EVENT LISTENERS ==========
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
    mouseInCanvas = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouseInCanvas = false;
  });

  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = (touch.clientX - rect.left) / rect.width;
    mouseY = (touch.clientY - rect.top) / rect.height;
    mouseInCanvas = true;
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    mouseInCanvas = false;
  });

  window.addEventListener('resize', resize);

  // ========== INIT ==========
  resize();
  initOrbits();
  initParticles();

  if (window.__DISABLE_ANIMATIONS__) {
    time = 100;
    render();
    cancelAnimationFrame(animId);
  } else {
    render();
  }

  window.addEventListener('beforeunload', () => {
    if (animId) cancelAnimationFrame(animId);
  });
})();
