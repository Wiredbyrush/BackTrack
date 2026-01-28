// BackTrack - Minimal Orbit Hero Animation
// Clean, subtle motion that blends with the site palette.

(function () {
  const container = document.querySelector('.hero-visual');
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

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let dpr = 1;
  let time = 0;
  let animationId = null;
  let nodes = [];
  let themeKey = '';
  let background = null;

  const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function parseColor(value, fallback) {
    const raw = (value || '').trim() || fallback;
    if (!raw) return { r: 37, g: 99, b: 235 };
    if (raw.startsWith('#')) {
      let hex = raw.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(ch => ch + ch).join('');
      }
      const intVal = parseInt(hex, 16);
      return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255
      };
    }
    if (raw.startsWith('rgb')) {
      const parts = raw.match(/\d+\.?\d*/g) || [];
      return {
        r: Number(parts[0] || 0),
        g: Number(parts[1] || 0),
        b: Number(parts[2] || 0)
      };
    }
    return parseColor(fallback, '#2563eb');
  }

  function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  function mix(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  }

  function getTheme() {
    const style = getComputedStyle(document.body);
    const primary = parseColor(style.getPropertyValue('--accent-primary'), '#2563eb');
    const secondary = parseColor(style.getPropertyValue('--accent-secondary'), '#06b6d4');
    const bg = parseColor(style.getPropertyValue('--bg-primary'), '#000000');
    const isLight = document.body.classList.contains('light-theme');
    return {
      primary,
      secondary,
      bg,
      isLight,
      glow: isLight ? 0.25 : 0.45,
      ring: isLight ? 0.18 : 0.24,
      dot: isLight ? 0.5 : 0.7
    };
  }

  function buildScene() {
    const minSide = Math.min(w, h);
    const count = minSide < 520 ? 7 : 10;
    nodes = new Array(count).fill(0).map((_, i) => {
      return {
        angle: (Math.PI * 2 * i) / count,
        speed: 0.00025 + Math.random() * 0.00025,
        radius: 0.38 + Math.random() * 0.22,
        size: 2.4 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        tone: i % 2
      };
    });
  }

  function buildBackground(theme) {
    background = document.createElement('canvas');
    background.width = w;
    background.height = h;
    const bctx = background.getContext('2d');
    if (!bctx) return;

    const glow = bctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.7);
    glow.addColorStop(0, rgba(mix(theme.primary, theme.secondary, 0.5), theme.glow));
    glow.addColorStop(0.45, rgba(theme.primary, theme.glow * 0.35));
    glow.addColorStop(1, rgba(theme.bg, 0));
    bctx.fillStyle = glow;
    bctx.fillRect(0, 0, w, h);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.5;
    cy = h * 0.52;
    buildScene();
    themeKey = '';
  }

  function renderFrame() {
    const theme = getTheme();
    const currentKey = `${theme.isLight}-${theme.primary.r}-${theme.primary.g}-${theme.primary.b}-${theme.secondary.r}-${theme.secondary.g}-${theme.secondary.b}-${theme.bg.r}-${theme.bg.g}-${theme.bg.b}-${w}-${h}`;
    if (currentKey !== themeKey || !background) {
      themeKey = currentKey;
      buildBackground(theme);
    }

    ctx.clearRect(0, 0, w, h);
    if (background) ctx.drawImage(background, 0, 0, w, h);

    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    const parallaxX = (mouse.x - 0.5) * w * 0.04;
    const parallaxY = (mouse.y - 0.5) * h * 0.04;

    const minSide = Math.min(w, h);
    const baseRadius = minSide * 0.26;

    // Soft rings
    ctx.save();
    ctx.translate(cx + parallaxX * 0.2, cy + parallaxY * 0.2);
    ctx.strokeStyle = rgba(theme.primary, theme.ring);
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.ellipse(0, 0, baseRadius * 1.05, baseRadius * 0.65, -0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = rgba(theme.secondary, theme.ring * 0.9);
    ctx.beginPath();
    ctx.ellipse(0, 0, baseRadius * 0.65, baseRadius * 0.42, 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Minimal orbiting dots
    for (const node of nodes) {
      const angle = node.angle + time * node.speed;
      const bob = Math.sin(time * 0.001 + node.phase) * 6;
      const x = cx + Math.cos(angle) * baseRadius * node.radius + parallaxX + bob;
      const y = cy + Math.sin(angle) * baseRadius * node.radius * 0.7 + parallaxY * 0.8;

      const dotSize = node.size + (node.tone === 1 ? 1.5 : 0);
      const glowSize = dotSize * 5;
      const dotColor = node.tone === 1 ? theme.secondary : theme.primary;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      glow.addColorStop(0, rgba(dotColor, theme.dot));
      glow.addColorStop(1, rgba(dotColor, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rgba(dotColor, theme.dot + 0.15);
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle sweep arc
    ctx.save();
    ctx.translate(cx + parallaxX * 0.25, cy + parallaxY * 0.25);
    ctx.rotate(time * 0.0005);
    const arcGrad = ctx.createRadialGradient(0, 0, baseRadius * 0.4, 0, 0, baseRadius * 1.25);
    arcGrad.addColorStop(0, rgba(theme.primary, 0));
    arcGrad.addColorStop(1, rgba(theme.secondary, theme.isLight ? 0.18 : 0.25));
    ctx.strokeStyle = arcGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.02, -0.35, 0.55);
    ctx.stroke();
    ctx.restore();
  }

  function animate() {
    const motionDisabled = window.__DISABLE_ANIMATIONS__ ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (motionDisabled) {
      time = 2000;
      renderFrame();
      return;
    }

    time += 16;
    renderFrame();
    animationId = requestAnimationFrame(animate);
  }

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.targetX = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    mouse.targetY = clamp((e.clientY - rect.top) / rect.height, 0, 1);
  });

  container.addEventListener('mouseleave', () => {
    mouse.targetX = 0.5;
    mouse.targetY = 0.5;
  });

  container.addEventListener('touchmove', (e) => {
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    mouse.targetX = clamp((touch.clientX - rect.left) / rect.width, 0, 1);
    mouse.targetY = clamp((touch.clientY - rect.top) / rect.height, 0, 1);
  }, { passive: true });

  window.addEventListener('resize', () => {
    resize();
    renderFrame();
  });

  window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
  });

  resize();
  animate();
})();
