// BackTrack - Hero 3D Sphere Mesh Animation
// Premium interactive wireframe sphere with mouse tracking

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

  let w, h;
  let animId;
  let time = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let mouseInCanvas = false;
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- Generate sphere vertices ---
  const RINGS = 14;
  const SEGMENTS = 20;
  const vertices = [];
  const edges = [];

  // Generate vertices on a unit sphere
  for (let i = 0; i <= RINGS; i++) {
    const phi = (i / RINGS) * Math.PI;
    for (let j = 0; j < SEGMENTS; j++) {
      const theta = (j / SEGMENTS) * Math.PI * 2;
      vertices.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
        baseX: Math.sin(phi) * Math.cos(theta),
        baseY: Math.cos(phi),
        baseZ: Math.sin(phi) * Math.sin(theta),
      });
    }
  }

  // Generate edges (connect adjacent vertices)
  for (let i = 0; i <= RINGS; i++) {
    for (let j = 0; j < SEGMENTS; j++) {
      const idx = i * SEGMENTS + j;
      const nextJ = (j + 1) % SEGMENTS;

      // Horizontal edge
      if (i < RINGS) {
        edges.push([idx, i * SEGMENTS + nextJ]);
      }
      // Vertical edge
      if (i < RINGS) {
        edges.push([idx, (i + 1) * SEGMENTS + j]);
      }
      // Diagonal for visual interest
      if (i < RINGS && j % 2 === 0) {
        edges.push([idx, (i + 1) * SEGMENTS + nextJ]);
      }
    }
  }

  // --- Floating particles around the sphere ---
  const PARTICLE_COUNT = 24;
  const floatingParticles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const dist = 1.15 + Math.random() * 0.6;
    floatingParticles.push({
      x: Math.sin(phi) * Math.cos(theta) * dist,
      y: Math.cos(phi) * dist,
      z: Math.sin(phi) * Math.sin(theta) * dist,
      size: 0.6 + Math.random() * 1.1,
      speed: 0.00015 + Math.random() * 0.0002,
      offset: Math.random() * Math.PI * 2,
      opacity: 0.08 + Math.random() * 0.18,
    });
  }

  // --- 3D math ---
  function rotatePoint(x, y, z, rx, ry) {
    // Rotate around Y
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    let nx = x * cosY - z * sinY;
    let nz = x * sinY + z * cosY;
    // Rotate around X
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    let ny = y * cosX - nz * sinX;
    nz = y * sinX + nz * cosX;
    return { x: nx, y: ny, z: nz };
  }

  function project(x, y, z) {
    const perspective = 3.5;
    const scale = perspective / (perspective + z);
    const size = Math.min(w, h) * 0.38;
    return {
      x: w * 0.5 + x * size * scale,
      y: h * 0.5 - y * size * scale,
      z: z,
      scale: scale,
    };
  }

  // --- Hot nodes (vertices that pulse brighter) ---
  const HOT_NODE_COUNT = 5;
  const hotNodes = [];
  for (let i = 0; i < HOT_NODE_COUNT; i++) {
    hotNodes.push({
      idx: Math.floor(Math.random() * vertices.length),
      phase: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.02,
    });
  }

  // --- Render ---
  function render() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Smooth rotation toward mouse
    if (mouseInCanvas) {
      targetRotY = (mouseX - 0.5) * 1.2;
      targetRotX = -(mouseY - 0.5) * 0.8;
    } else {
      targetRotY = time * 0.0004;
      targetRotX = Math.sin(time * 0.0002) * 0.3;
    }
    currentRotX += (targetRotX - currentRotX) * 0.03;
    currentRotY += (targetRotY - currentRotY) * 0.03;

    const autoRotY = time * 0.0004;
    const ry = currentRotY + autoRotY;
    const rx = currentRotX;

    // Breathe effect
    const breathe = 1 + Math.sin(time * 0.002) * 0.02;

    // Scan line position (sweeps vertically through sphere)
    const scanY = Math.sin(time * 0.003) * 0.9;

    // --- Ambient glow behind sphere ---
    const gcx = w * 0.5;
    const gcy = h * 0.5;
    const glowRadius = Math.min(w, h) * 0.42;
    const ambientGlow = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, glowRadius);
    ambientGlow.addColorStop(0, 'rgba(255, 255, 255, 0.018)');
    ambientGlow.addColorStop(0.4, 'rgba(255, 255, 255, 0.006)');
    ambientGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = ambientGlow;
    ctx.fillRect(0, 0, w, h);

    // --- Outer halo ring ---
    const haloRadius = Math.min(w, h) * 0.4;
    const haloAlpha = 0.014 + Math.sin(time * 0.001) * 0.006;
    ctx.beginPath();
    ctx.arc(gcx, gcy, haloRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${haloAlpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Second inner halo
    ctx.beginPath();
    ctx.arc(gcx, gcy, haloRadius * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${haloAlpha * 0.5})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // --- Project all vertices ---
    const projected = vertices.map((v, idx) => {
      const bx = v.baseX * breathe;
      const by = v.baseY * breathe;
      const bz = v.baseZ * breathe;
      const rotated = rotatePoint(bx, by, bz, rx, ry);
      const p = project(rotated.x, rotated.y, rotated.z);
      p.worldY = rotated.y; // store for scan line
      p.vertIdx = idx;
      return p;
    });

    // --- Draw edges ---
    const mx = mouseInCanvas ? mouseX * w : -999;
    const my = mouseInCanvas ? mouseY * h : -999;

    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i];
      const pa = projected[a];
      const pb = projected[b];

      const avgZ = (pa.z + pb.z) / 2;
      const depthAlpha = Math.max(0, (avgZ + 1.2) / 2.4);

      // Scan line boost
      const avgWorldY = (pa.worldY + pb.worldY) / 2;
      const scanDist = Math.abs(avgWorldY - scanY);
      const scanBoost = scanDist < 0.15 ? (1 - scanDist / 0.15) * 0.15 : 0;

      // Mouse proximity boost for edges
      const edgeMidX = (pa.x + pb.x) / 2;
      const edgeMidY = (pa.y + pb.y) / 2;
      const mouseDist = Math.sqrt((edgeMidX - mx) ** 2 + (edgeMidY - my) ** 2);
      const mouseBoost = mouseDist < 100 ? (1 - mouseDist / 100) * 0.12 : 0;

      const alpha = depthAlpha * 0.09 + scanBoost + mouseBoost * 0.6;

      if (alpha < 0.005) continue;

      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(alpha, 0.4)})`;
      ctx.lineWidth = 0.5 + depthAlpha * 0.5 + (mouseBoost > 0 ? 0.3 : 0);
      ctx.stroke();
    }

    // --- Draw vertices ---
    // Pre-calculate hot node set
    const hotNodeSet = new Set(hotNodes.map(h => h.idx));

    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const depthAlpha = Math.max(0, (p.z + 1.2) / 2.4);

      // Scan line boost for vertices
      const scanDist = Math.abs(p.worldY - scanY);
      const scanBoost = scanDist < 0.12 ? (1 - scanDist / 0.12) * 0.25 : 0;

      // Mouse proximity boost
      const vMouseDist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
      const vMouseBoost = vMouseDist < 80 ? (1 - vMouseDist / 80) * 0.35 : 0;

      // Hot node pulse
      let hotBoost = 0;
      if (hotNodeSet.has(i)) {
        const hn = hotNodes.find(h => h.idx === i);
        hotBoost = (Math.sin(time * hn.speed + hn.phase) * 0.5 + 0.5) * 0.25;
      }

      const alpha = depthAlpha * 0.38 + scanBoost + vMouseBoost + hotBoost;
      const radius = 1 + depthAlpha * 1.4 + (vMouseBoost > 0 ? vMouseBoost * 1.5 : 0) + hotBoost * 1.1;

      if (alpha < 0.02) continue;

      // Glow for bright vertices
      if (alpha > 0.25 || vMouseBoost > 0.12 || hotBoost > 0.18) {
        const glowSize = radius * (4 + vMouseBoost * 4 + hotBoost * 3);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        glow.addColorStop(0, `rgba(255, 255, 255, ${Math.min(alpha * 0.24, 0.14)})`);
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.min(radius, 5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha, 0.7)})`;
      ctx.fill();
    }

    // --- Scan line horizontal glow ---
    const scanScreenY = h * 0.5 - scanY * Math.min(w, h) * 0.38 * (3.5 / (3.5 + 0));
    const scanLineGrad = ctx.createLinearGradient(gcx - haloRadius, scanScreenY, gcx + haloRadius, scanScreenY);
    scanLineGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    scanLineGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.01)');
    scanLineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.018)');
    scanLineGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.01)');
    scanLineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = scanLineGrad;
    ctx.fillRect(gcx - haloRadius, scanScreenY - 2, haloRadius * 2, 4);

    // --- Floating particles ---
    for (const fp of floatingParticles) {
      const angle = time * fp.speed + fp.offset;
      const fx = fp.x * Math.cos(angle * 0.3) - fp.z * Math.sin(angle * 0.3);
      const fz = fp.x * Math.sin(angle * 0.3) + fp.z * Math.cos(angle * 0.3);
      const fy = fp.y + Math.sin(time * 0.001 + fp.offset) * 0.1;

      const rotated = rotatePoint(fx * breathe, fy * breathe, fz * breathe, rx, ry);
      const p = project(rotated.x, rotated.y, rotated.z);

      const depthAlpha = Math.max(0, (p.z + 1.5) / 3);
      const alpha = depthAlpha * fp.opacity;

      if (alpha < 0.01) continue;

      // Particle glow
      if (alpha > 0.12) {
        const pGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, fp.size * p.scale * 3);
        pGlow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.12})`);
        pGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = pGlow;
        const gs = fp.size * p.scale * 3;
        ctx.fillRect(p.x - gs, p.y - gs, gs * 2, gs * 2);
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, fp.size * p.scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // --- Mouse interactive spotlight ---
    if (mouseInCanvas) {
      const highlightGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
      highlightGlow.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      highlightGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.007)');
      highlightGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGlow;
      ctx.fillRect(mx - 100, my - 100, 200, 200);
    }

    // --- Shimmer (random vertex flash) ---
    if (time % 45 === 0) {
      // Reassign one hot node to a new random vertex
      const idx = Math.floor(Math.random() * HOT_NODE_COUNT);
      hotNodes[idx].idx = Math.floor(Math.random() * vertices.length);
      hotNodes[idx].phase = Math.random() * Math.PI * 2;
    }

    time++;
    animId = requestAnimationFrame(render);
  }

  // --- Events ---
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
    mouseInCanvas = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouseInCanvas = false;
  });

  // Touch support
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

  // --- Init ---
  resize();

  if (window.__DISABLE_ANIMATIONS__) {
    time = 100;
    currentRotX = -0.2;
    currentRotY = 0.5;
    targetRotX = currentRotX;
    targetRotY = currentRotY;
    render();
    cancelAnimationFrame(animId);
  } else {
    render();
  }

  window.addEventListener('beforeunload', () => {
    if (animId) cancelAnimationFrame(animId);
  });
})();
