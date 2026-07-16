(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  let absMouseX = -1000, absMouseY = -1000;
  let scrollProgress = 0;

  function updateScrollProgress(){
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = docH > 0 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
    if(prefersReducedMotion) draw();
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  updateScrollProgress();

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    absMouseX = e.clientX;
    absMouseY = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    absMouseX = -1000;
    absMouseY = -1000;
  });

  // ---------- helpers ----------
  function smoothstep(edge0, edge1, x){
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function lerpRGB(c1, c2, t){
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t))
    ];
  }

  // Palette: dark charcoal / deep blue with cyan highlights
  const COL_BG_TOP_A = [11, 11, 15];      // #0B0B0F
  const COL_BG_TOP_B = [15, 18, 38];      // deep-blue tinted
  const COL_BG_BOTTOM_A = [26, 26, 26];   // #1A1A1A
  const COL_BG_BOTTOM_B = [18, 37, 110];  // #12256E
  const ACCENT = { r: 39, g: 72, b: 224 };   // #2748E0
  const CYAN = { r: 34, g: 211, b: 238 };    // cyan highlight

  // ---------- ambient orbs + reactive particles (persistent base layer) ----------
  function makeOrbs(){
    const palette = [
      { r: 39, g: 72, b: 224 },
      { r: 34, g: 211, b: 238 },
      { r: 18, g: 37, b: 110 }
    ];
    const orbs = [];
    for(let i = 0; i < 5; i++){
      const c = palette[i % palette.length];
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.4 + Math.random() * 0.6,
        baseR: 170 + Math.random() * 200,
        color: c,
        angle: Math.random() * Math.PI * 2,
        speed: 0.05 + Math.random() * 0.08,
        orbitR: 60 + Math.random() * 120,
        pulseSpeed: 0.4 + Math.random() * 0.5,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
    return orbs;
  }

  function makeParticles(){
    const count = Math.round((width * height) / 10000);
    const particles = [];
    for(let i = 0; i < count; i++){
      const z = 0.2 + Math.random() * 0.8;
      particles.push({
        baseX: Math.random() * width,
        y: Math.random() * height,
        vx: 0, vy: 0,
        z: z,
        r: 0.5 + z * 1.5,
        speed: 0.05 + z * 0.13,
        twinkleSpeed: 0.5 + Math.random() * 1.2,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
    return particles;
  }

  // ---------- scene: circuit board traces ----------
  function makeCircuits(){
    const paths = [];
    const count = 7;
    for(let i = 0; i < count; i++){
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const pts = [{ x: startX, y: startY }];
      let cx = startX, cy = startY;
      const segments = 3 + Math.floor(Math.random() * 3);
      for(let s = 0; s < segments; s++){
        if(Math.random() > 0.5){
          cx += (Math.random() - 0.5) * 260;
        } else {
          cy += (Math.random() - 0.5) * 200;
        }
        pts.push({ x: cx, y: cy });
      }
      paths.push({ pts, speed: 0.15 + Math.random() * 0.2, offset: Math.random() });
    }
    return paths;
  }

  // ---------- scene: floating code fragments ----------
  const FRAGMENT_LABELS = ['HTML', 'CSS', 'JS', 'PYTHON', 'C++', 'MongoDB', '{ }', '</>', 'SQL', 'git', '<div>', 'def main():'];
  function makeFragments(){
    return FRAGMENT_LABELS.map((label) => {
      const z = 0.35 + Math.random() * 0.65;
      return {
        label,
        baseX: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: 0, vy: 0,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.15 + Math.random() * 0.2
      };
    });
  }

  // ---------- scene: neural network ----------
  function makeNeuralNodes(){
    const count = Math.max(24, Math.round((width * height) / 32000));
    const nodes = [];
    for(let i = 0; i < count; i++){
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
    // connect each node to its 2-3 nearest neighbors
    const edges = [];
    nodes.forEach((n, i) => {
      const dists = nodes.map((m, j) => ({ j, d: (i === j) ? Infinity : Math.hypot(n.x - m.x, n.y - m.y) }));
      dists.sort((a, b) => a.d - b.d);
      const linkCount = 2 + Math.floor(Math.random() * 2);
      for(let k = 0; k < linkCount; k++){
        const j = dists[k].j;
        if(j > i){ edges.push({ a: i, b: j, phase: Math.random() * Math.PI * 2, speed: 0.2 + Math.random() * 0.3 }); }
      }
    });
    return { nodes, edges };
  }

  let orbs = makeOrbs();
  let particles = makeParticles();
  let circuits = makeCircuits();
  let fragments = makeFragments();
  let neural = makeNeuralNodes();

  window.addEventListener('resize', () => {
    resize();
    orbs = makeOrbs();
    particles = makeParticles();
    circuits = makeCircuits();
    fragments = makeFragments();
    neural = makeNeuralNodes();
  });

  let t = 0;

  // ---------- scene draw functions ----------
  const bootLines = [
    '> booting developer workspace...',
    '> loading modules: html css js python c++ [ok]',
    '> mounting portfolio profile...',
    '> connection secure. welcome.'
  ];

  function drawBoot(alpha, localProgress){
    if(alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textBaseline = 'middle';
    ctx.font = '15px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
    const fullText = bootLines.join('\n');
    const chars = Math.floor(fullText.length * smoothstep(0, 1, localProgress));
    const shown = fullText.slice(0, chars);
    const lines = shown.split('\n');
    const startY = height / 2 - (bootLines.length * 26) / 2;
    const blockW = 460;
    const startX = width / 2 - blockW / 2;
    ctx.shadowColor = 'rgba(34,211,238,0.55)';
    ctx.shadowBlur = 10;
    lines.forEach((ln, i) => {
      ctx.fillStyle = 'rgba(148,233,255,0.92)';
      ctx.fillText(ln, startX, startY + i * 26);
      if(i === lines.length - 1){
        const w = ctx.measureText(ln).width;
        const blink = Math.sin(t * 6) > 0;
        if(blink){
          ctx.fillStyle = 'rgba(34,211,238,0.9)';
          ctx.fillRect(startX + w + 4, startY + i * 26 - 8, 8, 16);
        }
      }
    });
    ctx.restore();
  }

  function drawCircuits(alpha){
    if(alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    circuits.forEach(path => {
      ctx.beginPath();
      path.pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = 'rgba(39,72,224,0.35)';
      ctx.shadowColor = 'rgba(34,211,238,0.4)';
      ctx.shadowBlur = 6;
      ctx.stroke();

      // node dots at bends
      path.pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,211,238,0.5)';
        ctx.fill();
      });

      // traveling pulse along path
      const total = path.pts.length - 1;
      const prog = ((t * path.speed) + path.offset) % 1;
      const segF = prog * total;
      const segIdx = Math.min(total - 1, Math.floor(segF));
      const segT = segF - segIdx;
      const p0 = path.pts[segIdx];
      const p1 = path.pts[segIdx + 1] || p0;
      const px = lerp(p0.x, p1.x, segT);
      const py = lerp(p0.y, p1.y, segT);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148,233,255,0.95)';
      ctx.shadowBlur = 12;
      ctx.fill();
    });
    ctx.restore();
  }

  const codeSampleLines = [
    'const app = () => {',
    '  const [ready] = useState(true);',
    '  return <Portfolio dev="Debanjan" />;',
    '};',
    '',
    'def main():',
    '    print("shipping features...")',
    ''
  ];

  function drawLaptop(alpha){
    if(alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const cx = width / 2, cy = height / 2;
    const screenW = Math.min(420, width * 0.5);
    const screenH = screenW * 0.62;
    const sx = cx - screenW / 2, sy = cy - screenH / 2 - 16;

    // screen glow
    const glow = ctx.createRadialGradient(cx, sy + screenH / 2, 10, cx, sy + screenH / 2, screenW);
    glow.addColorStop(0, 'rgba(39,72,224,0.25)');
    glow.addColorStop(1, 'rgba(39,72,224,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 100, sy - 100, screenW + 200, screenH + 200);

    // screen body
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(sx, sy, screenW, screenH, 10) : ctx.rect(sx, sy, screenW, screenH);
    ctx.fillStyle = 'rgba(10,12,20,0.92)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(39,72,224,0.6)';
    ctx.shadowColor = 'rgba(34,211,238,0.5)';
    ctx.shadowBlur = 14;
    ctx.stroke();

    // base
    ctx.shadowBlur = 0;
    const baseW = screenW * 1.14;
    ctx.beginPath();
    ctx.moveTo(cx - baseW / 2, sy + screenH + 14);
    ctx.lineTo(cx + baseW / 2, sy + screenH + 14);
    ctx.lineTo(cx + baseW / 2 - 14, sy + screenH + 22);
    ctx.lineTo(cx - baseW / 2 + 14, sy + screenH + 22);
    ctx.closePath();
    ctx.fillStyle = 'rgba(20,22,30,0.9)';
    ctx.fill();

    // code lines inside screen, gently scrolling
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx + 14, sy + 14, screenW - 28, screenH - 28);
    ctx.clip();
    ctx.font = `${Math.max(10, screenW * 0.032)}px "SFMono-Regular", Consolas, monospace`;
    ctx.textBaseline = 'top';
    const lineH = screenW * 0.052;
    const totalH = codeSampleLines.length * lineH;
    const scrollOffset = (t * 8) % totalH;
    for(let i = -1; i < codeSampleLines.length + 1; i++){
      const ln = codeSampleLines[((i % codeSampleLines.length) + codeSampleLines.length) % codeSampleLines.length];
      const y = sy + 14 + i * lineH - scrollOffset;
      const isKeyword = /const|return|def|print/.test(ln);
      ctx.fillStyle = isKeyword ? 'rgba(34,211,238,0.9)' : 'rgba(200,215,255,0.75)';
      ctx.fillText(ln, sx + 18, y);
    }
    ctx.restore();
    ctx.restore();
  }

  function drawFragments(alpha){
    if(alpha <= 0.01) return;
    ctx.save();
    ctx.font = '13px "SFMono-Regular", Consolas, monospace';
    ctx.textBaseline = 'middle';
    fragments.forEach((f, idx) => {
      const driftX = Math.sin(t * f.driftSpeed + f.driftPhase) * 30;
      const driftY = Math.cos(t * f.driftSpeed * 0.8 + f.driftPhase) * 22;
      let px = f.baseX + driftX;
      let py = f.y + driftY;

      const dx = px - absMouseX;
      const dy = py - absMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pushRadius = 110;
      if(dist < pushRadius && dist > 0.01){
        const force = (pushRadius - dist) / pushRadius;
        f.vx += ((dx / dist) * force * 4 - f.vx) * 0.15;
        f.vy += ((dy / dist) * force * 4 - f.vy) * 0.15;
      } else {
        f.vx *= 0.94;
        f.vy *= 0.94;
      }
      px += f.vx;
      py += f.vy;

      const depthAlpha = 0.3 + f.z * 0.55;
      const fontSize = 11 + f.z * 8;
      ctx.font = `${fontSize}px "SFMono-Regular", Consolas, monospace`;
      const textW = ctx.measureText(f.label).width;
      const padX = 10, padY = 6;
      ctx.globalAlpha = alpha * depthAlpha;
      ctx.fillStyle = 'rgba(20,26,46,0.55)';
      ctx.strokeStyle = 'rgba(34,211,238,0.35)';
      ctx.lineWidth = 1;
      const bw = textW + padX * 2, bh = fontSize + padY * 2;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(px - bw / 2, py - bh / 2, bw, bh, 8); else ctx.rect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(180,220,255,0.9)';
      ctx.fillText(f.label, px - textW / 2, py + 1);
    });
    ctx.restore();
  }

  function drawNeural(alpha){
    if(alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    neural.nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if(n.x < 0 || n.x > width) n.vx *= -1;
      if(n.y < 0 || n.y > height) n.vy *= -1;
    });

    neural.edges.forEach(e => {
      const a = neural.nodes[e.a], b = neural.nodes[e.b];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const maxD = 260;
      if(d > maxD) return;
      const baseA = (1 - d / maxD) * 0.35;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(39,72,224,${baseA})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      const prog = ((t * e.speed) + e.phase / (Math.PI * 2)) % 1;
      const px = lerp(a.x, b.x, prog);
      const py = lerp(a.y, b.y, prog);
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148,233,255,0.85)';
      ctx.shadowColor = 'rgba(34,211,238,0.7)';
      ctx.shadowBlur = 8;
      ctx.fill();
    });

    neural.nodes.forEach(n => {
      const pulse = 1 + Math.sin(t * 1.2 + n.pulseOffset) * 0.35;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148,233,255,0.9)';
      ctx.shadowColor = 'rgba(39,72,224,0.6)';
      ctx.shadowBlur = 6;
      ctx.fill();
    });

    ctx.restore();
  }

  function draw(){
    t += 0.008;

    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    // background gradient shifts subtly deeper/bluer as the page scrolls
    const topColor = lerpRGB(COL_BG_TOP_A, COL_BG_TOP_B, scrollProgress);
    const bottomColor = lerpRGB(COL_BG_BOTTOM_A, COL_BG_BOTTOM_B, scrollProgress);
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, `rgb(${topColor[0]},${topColor[1]},${topColor[2]})`);
    grad.addColorStop(1, `rgb(${bottomColor[0]},${bottomColor[1]},${bottomColor[2]})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // ambient orbs
    orbs.forEach(o => {
      o.angle += o.speed * 0.02;
      const parallax = 24 * o.z;
      const ox = o.x + Math.cos(o.angle) * o.orbitR + mouseX * parallax;
      const oy = o.y + Math.sin(o.angle) * o.orbitR * 0.6 + mouseY * parallax;
      const pulse = 1 + Math.sin(t * o.pulseSpeed + o.pulseOffset) * 0.08;
      const radius = o.baseR * o.z * pulse;
      const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
      const { r, g, b } = o.color;
      rg.addColorStop(0, `rgba(${r},${g},${b},${0.3 * o.z})`);
      rg.addColorStop(0.5, `rgba(${r},${g},${b},${0.12 * o.z})`);
      rg.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(ox, oy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // reactive particle field
    particles.forEach(p => {
      p.y -= p.speed;
      if(p.y < -10){
        p.y = height + 10;
        p.baseX = Math.random() * width;
        p.vx = 0; p.vy = 0;
      }
      const parallax = 12 * p.z;
      let px = p.baseX + mouseX * parallax;
      let py = p.y + mouseY * parallax;
      const dx = px - absMouseX, dy = py - absMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pushRadius = 120;
      if(dist < pushRadius && dist > 0.01){
        const force = (pushRadius - dist) / pushRadius;
        p.vx += ((dx / dist) * force * 4.5 * (p.z * 1.5) - p.vx) * 0.15;
        p.vy += ((dy / dist) * force * 4.5 * (p.z * 1.5) - p.vy) * 0.15;
      } else {
        p.vx *= 0.94; p.vy *= 0.94;
      }
      px += p.vx; py += p.vy;
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * p.twinkleSpeed + p.twinkleOffset));
      ctx.fillStyle = `rgba(190,215,255,${0.6 * p.z * twinkle})`;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ---- scroll-scrubbed narrative scenes with smooth crossfades ----
    const bootAlpha = 1 - smoothstep(0.0, 0.10, scrollProgress);
    const bootLocal = smoothstep(0.0, 0.09, scrollProgress);

    const circuitAlpha = smoothstep(0.06, 0.14, scrollProgress) * (1 - smoothstep(0.26, 0.34, scrollProgress));
    const laptopAlpha = smoothstep(0.26, 0.34, scrollProgress) * (1 - smoothstep(0.46, 0.54, scrollProgress));
    const fragmentsAlpha = smoothstep(0.46, 0.54, scrollProgress) * (1 - smoothstep(0.68, 0.76, scrollProgress));
    const neuralAlpha = smoothstep(0.68, 0.78, scrollProgress);

    drawBoot(bootAlpha, bootLocal);
    drawCircuits(circuitAlpha);
    drawLaptop(laptopAlpha);
    drawFragments(fragmentsAlpha);
    drawNeural(neuralAlpha);

    if(!prefersReducedMotion){
      requestAnimationFrame(draw);
    }
  }

  if(prefersReducedMotion){
    draw();
  } else {
    requestAnimationFrame(draw);
  }
})();
