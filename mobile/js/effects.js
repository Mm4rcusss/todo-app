(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const BITS_THEMES = [
        { id: 'rb-aurora', name: 'Aurora', color: '#7cff67', effect: 'aurora' },
        { id: 'rb-particles', name: 'Particles', color: '#b19eef', effect: 'particles' },
        { id: 'rb-waves', name: 'Waves', color: '#22d3ee', effect: 'waves' },
        { id: 'rb-silk', name: 'Silk', color: '#c4b5fd', effect: 'silk' },
        { id: 'rb-orbs', name: 'Orbs', color: '#fb7185', effect: 'orbs' },
        { id: 'rb-lightning', name: 'Lightning', color: '#a78bfa', effect: 'lightning' },
        { id: 'rb-grid', name: 'Grid', color: '#38bdf8', effect: 'grid' },
        { id: 'rb-plasma', name: 'Plasma', color: '#f472b6', effect: 'plasma' }
    ];

    const PARAM_DEFAULTS = {
        aurora: {
            color1: '#22d3ee', color2: '#34d399', color3: '#a78bfa', color4: '#60a5fa',
            speed: 1, intensity: 1
        },
        particles: { color: '#b19eef', density: 1, speed: 1, link: 120 },
        waves: { color1: '#0891b2', color2: '#22d3ee', color3: '#67e8f9', speed: 1, amplitude: 1 },
        silk: { color: '#c4b5fd', speed: 1 },
        orbs: { color1: '#fb7185', color2: '#a78bfa', color3: '#38bdf8', speed: 1 },
        lightning: { color: '#c4b5fd', frequency: 1 },
        grid: { color: '#38bdf8', speed: 1 },
        plasma: { speed: 1, saturation: 80, hue: 0 }
    };

    const PARAM_SCHEMA = {
        aurora: [
            { key: 'color1', type: 'color', label: 'Band 1' },
            { key: 'color2', type: 'color', label: 'Band 2' },
            { key: 'color3', type: 'color', label: 'Band 3' },
            { key: 'color4', type: 'color', label: 'Band 4' },
            { key: 'speed', type: 'range', label: 'Speed', min: 0.3, max: 3, step: 0.1 },
            { key: 'intensity', type: 'range', label: 'Glow', min: 0.3, max: 2, step: 0.1 }
        ],
        particles: [
            { key: 'color', type: 'color', label: 'Links' },
            { key: 'density', type: 'range', label: 'Density', min: 0.4, max: 2.2, step: 0.1 },
            { key: 'speed', type: 'range', label: 'Speed', min: 0.3, max: 3, step: 0.1 },
            { key: 'link', type: 'range', label: 'Link distance', min: 60, max: 220, step: 5 }
        ],
        waves: [
            { key: 'color1', type: 'color', label: 'Wave 1' },
            { key: 'color2', type: 'color', label: 'Wave 2' },
            { key: 'color3', type: 'color', label: 'Wave 3' },
            { key: 'speed', type: 'range', label: 'Speed', min: 0.3, max: 3, step: 0.1 },
            { key: 'amplitude', type: 'range', label: 'Height', min: 0.4, max: 2.2, step: 0.1 }
        ],
        silk: [
            { key: 'color', type: 'color', label: 'Silk color' },
            { key: 'speed', type: 'range', label: 'Speed', min: 0.3, max: 3, step: 0.1 }
        ],
        orbs: [
            { key: 'color1', type: 'color', label: 'Orb 1' },
            { key: 'color2', type: 'color', label: 'Orb 2' },
            { key: 'color3', type: 'color', label: 'Orb 3' },
            { key: 'speed', type: 'range', label: 'Speed', min: 0.3, max: 3, step: 0.1 }
        ],
        lightning: [
            { key: 'color', type: 'color', label: 'Bolt' },
            { key: 'frequency', type: 'range', label: 'Frequency', min: 0.3, max: 3, step: 0.1 }
        ],
        grid: [
            { key: 'color', type: 'color', label: 'Grid' },
            { key: 'speed', type: 'range', label: 'Speed', min: 0.3, max: 3, step: 0.1 }
        ],
        plasma: [
            { key: 'hue', type: 'range', label: 'Hue shift', min: 0, max: 360, step: 5 },
            { key: 'saturation', type: 'range', label: 'Saturation', min: 20, max: 100, step: 5 },
            { key: 'speed', type: 'range', label: 'Speed', min: 0.3, max: 3, step: 0.1 }
        ]
    };

    let active = null;
    let canvas = null;
    let raf = 0;
    let currentParams = {};
    let rebuildFn = null;

    function params() {
        return currentParams;
    }

    function findTheme(effectId) {
        return BITS_THEMES.find((item) => item.id === effectId || item.effect === effectId);
    }

    function ensureCanvas(container) {
        if (canvas && canvas.parentElement === container) return canvas;
        canvas = document.createElement('canvas');
        canvas.className = 'bits-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        container.appendChild(canvas);
        return canvas;
    }

    function isCompactFx() {
        return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    }

    function resizeCanvas(target) {
        const dpr = Math.min(window.devicePixelRatio || 1, isCompactFx() ? 1.25 : 1.75);
        const { clientWidth: w, clientHeight: h } = target.parentElement;
        target.width = Math.max(1, Math.floor(w * dpr));
        target.height = Math.max(1, Math.floor(h * dpr));
        target.style.width = '100%';
        target.style.height = '100%';
        return { w: target.width, h: target.height, dpr };
    }

    function stop() {
        cancelAnimationFrame(raf);
        raf = 0;
        rebuildFn = null;
        if (active?.destroy) active.destroy();
        active = null;
        if (canvas) {
            canvas.remove();
            canvas = null;
        }
    }

    function start(effectId, container, userParams) {
        stop();
        if (!container || reducedMotion) return;
        const theme = findTheme(effectId);
        if (!theme) return;
        const target = ensureCanvas(container);
        const engine = engines[theme.effect];
        if (!engine) return;
        currentParams = { ...PARAM_DEFAULTS[theme.effect], ...userParams };
        active = engine(target);
    }

    function updateParams(partial) {
        Object.assign(currentParams, partial);
        if (typeof rebuildFn === 'function') rebuildFn();
    }

    function getDefaults(effectId) {
        const theme = findTheme(effectId);
        return theme ? { ...PARAM_DEFAULTS[theme.effect] } : {};
    }

    function getSchema(effectId) {
        const theme = findTheme(effectId);
        return theme ? PARAM_SCHEMA[theme.effect] || [] : [];
    }

    function loop(step) {
        const tick = (time) => {
            if (document.hidden) {
                raf = requestAnimationFrame(tick);
                return;
            }
            step(time);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
    }

    const engines = {
        aurora(target) {
            const ctx = target.getContext('2d');
            const onResize = () => resizeCanvas(target);
            onResize();
            window.addEventListener('resize', onResize);
            loop((time) => {
                const p = params();
                const { width: w, height: h } = target;
                const t = time * 0.00018 * (Number(p.speed) || 1);
                const glow = Number(p.intensity) || 1;
                ctx.fillStyle = '#050816';
                ctx.fillRect(0, 0, w, h);
                const bands = [
                    [p.color1, 0.18],
                    [p.color2, 0.16],
                    [p.color3, 0.14],
                    [p.color4, 0.12]
                ];
                bands.forEach(([color, alpha], i) => {
                    ctx.beginPath();
                    for (let x = 0; x <= w; x += 8) {
                        const n = x / w;
                        const y = h * (0.28 + i * 0.12)
                            + Math.sin(n * 6 + t * 4 + i) * h * 0.08
                            + Math.sin(n * 13 + t * 2.4 + i * 1.7) * h * 0.05;
                        if (x === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.lineTo(w, h);
                    ctx.lineTo(0, h);
                    ctx.closePath();
                    const g = ctx.createLinearGradient(0, 0, 0, h);
                    g.addColorStop(0, hexAlpha(color, 0));
                    g.addColorStop(0.35, hexAlpha(color, alpha * glow));
                    g.addColorStop(1, hexAlpha(color, 0));
                    ctx.fillStyle = g;
                    ctx.fill();
                });
            });
            return { destroy: () => window.removeEventListener('resize', onResize) };
        },

        particles(target) {
            const ctx = target.getContext('2d');
            let dots = [];
            const rebuild = () => {
                const { w, h } = resizeCanvas(target);
                const density = Number(params().density) || 1;
                const compact = isCompactFx();
                const area = compact ? 32000 : 18000;
                const cap = compact ? 48 : 140;
                const count = Math.min(cap, Math.max(10, Math.floor((w * h) / area * density)));
                dots = Array.from({ length: count }, () => ({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.35,
                    vy: (Math.random() - 0.5) * 0.35
                }));
            };
            rebuild();
            rebuildFn = rebuild;
            window.addEventListener('resize', rebuild);
            loop(() => {
                const p = params();
                const { width: w, height: h } = target;
                const speed = Number(p.speed) || 1;
                const link = isCompactFx() ? Math.min(Number(p.link) || 120, 90) : (Number(p.link) || 120);
                ctx.fillStyle = '#07060f';
                ctx.fillRect(0, 0, w, h);
                dots.forEach((dot) => {
                    dot.x += dot.vx * speed;
                    dot.y += dot.vy * speed;
                    if (dot.x < 0 || dot.x > w) dot.vx *= -1;
                    if (dot.y < 0 || dot.y > h) dot.vy *= -1;
                });
                for (let i = 0; i < dots.length; i++) {
                    for (let j = i + 1; j < dots.length; j++) {
                        const dx = dots[i].x - dots[j].x;
                        const dy = dots[i].y - dots[j].y;
                        const dist = Math.hypot(dx, dy);
                        if (dist < link) {
                            ctx.strokeStyle = hexAlpha(p.color, 1 - dist / link);
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(dots[i].x, dots[i].y);
                            ctx.lineTo(dots[j].x, dots[j].y);
                            ctx.stroke();
                        }
                    }
                }
                ctx.fillStyle = '#e9e4ff';
                dots.forEach((dot) => {
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, 1.6, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
            return { destroy: () => window.removeEventListener('resize', rebuild) };
        },

        waves(target) {
            const ctx = target.getContext('2d');
            const onResize = () => resizeCanvas(target);
            onResize();
            window.addEventListener('resize', onResize);
            loop((time) => {
                const p = params();
                const { width: w, height: h } = target;
                const t = time * 0.001 * (Number(p.speed) || 1);
                const amp = Number(p.amplitude) || 1;
                const colors = [p.color1, p.color2, p.color3];
                ctx.fillStyle = '#042f3a';
                ctx.fillRect(0, 0, w, h);
                colors.forEach((color, i) => {
                    ctx.beginPath();
                    const base = h * (0.45 + i * 0.12);
                    for (let x = 0; x <= w; x += 6) {
                        const y = base + Math.sin(x * 0.008 + t * (1.1 + i * 0.25) + i) * (28 + i * 10) * amp;
                        if (x === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.lineTo(w, h);
                    ctx.lineTo(0, h);
                    ctx.closePath();
                    ctx.fillStyle = hexAlpha(color, 0.22 + i * 0.08);
                    ctx.fill();
                });
            });
            return { destroy: () => window.removeEventListener('resize', onResize) };
        },

        silk(target) {
            const ctx = target.getContext('2d');
            const buffer = document.createElement('canvas');
            const bctx = buffer.getContext('2d');
            const onResize = () => resizeCanvas(target);
            onResize();
            window.addEventListener('resize', onResize);
            loop((time) => {
                const p = params();
                const { width: w, height: h } = target;
                const t = time * 0.0004 * (Number(p.speed) || 1);
                const [br, bg, bb] = hexToRgb(p.color);
                const scale = isCompactFx() ? 8 : 6;
                const bw = Math.max(120, Math.floor(w / scale));
                const bh = Math.max(70, Math.floor(h / scale));
                if (buffer.width !== bw || buffer.height !== bh) {
                    buffer.width = bw;
                    buffer.height = bh;
                }
                const image = bctx.createImageData(bw, bh);
                const data = image.data;
                for (let y = 0; y < bh; y++) {
                    for (let x = 0; x < bw; x++) {
                        const n = Math.sin(x * 0.08 + t) + Math.sin(y * 0.09 - t * 1.3) + Math.sin((x + y) * 0.05 + t * 0.7);
                        const v = (n + 3) / 6;
                        const i = (y * bw + x) * 4;
                        data[i] = Math.round(br * (0.35 + v * 0.75));
                        data[i + 1] = Math.round(bg * (0.35 + v * 0.75));
                        data[i + 2] = Math.round(bb * (0.4 + v * 0.7));
                        data[i + 3] = 255;
                    }
                }
                bctx.putImageData(image, 0, 0);
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(buffer, 0, 0, w, h);
            });
            return { destroy: () => window.removeEventListener('resize', onResize) };
        },

        orbs(target) {
            const ctx = target.getContext('2d');
            let orbs = [];
            const rebuild = () => {
                const { w, h } = resizeCanvas(target);
                orbs = [
                    { x: w * 0.25, y: h * 0.35, r: Math.min(w, h) * 0.28, a: 0 },
                    { x: w * 0.7, y: h * 0.55, r: Math.min(w, h) * 0.32, a: 1.7 },
                    { x: w * 0.5, y: h * 0.25, r: Math.min(w, h) * 0.22, a: 3.4 }
                ];
            };
            rebuild();
            window.addEventListener('resize', rebuild);
            loop((time) => {
                const p = params();
                const { width: w, height: h } = target;
                const t = time * 0.0004 * (Number(p.speed) || 1);
                const colors = [p.color1, p.color2, p.color3];
                ctx.fillStyle = '#120814';
                ctx.fillRect(0, 0, w, h);
                ctx.globalCompositeOperation = 'lighter';
                orbs.forEach((orb, i) => {
                    const x = orb.x + Math.sin(t + orb.a) * 40;
                    const y = orb.y + Math.cos(t * 0.8 + orb.a) * 30;
                    const g = ctx.createRadialGradient(x, y, 0, x, y, orb.r);
                    g.addColorStop(0, hexAlpha(colors[i], 0.7));
                    g.addColorStop(1, hexAlpha(colors[i], 0));
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(x, y, orb.r, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalCompositeOperation = 'source-over';
            });
            return { destroy: () => window.removeEventListener('resize', rebuild) };
        },

        lightning(target) {
            const ctx = target.getContext('2d');
            let bolts = [];
            const onResize = () => resizeCanvas(target);
            onResize();
            window.addEventListener('resize', onResize);

            const makeBolt = () => {
                const { width: w, height: h } = target;
                const points = [{ x: Math.random() * w, y: 0 }];
                while (points[points.length - 1].y < h) {
                    const last = points[points.length - 1];
                    points.push({
                        x: last.x + (Math.random() - 0.5) * 70,
                        y: last.y + 18 + Math.random() * 28
                    });
                }
                bolts.push({ points, life: 1 });
            };

            let next = 0;
            loop((time) => {
                const p = params();
                const { width: w, height: h } = target;
                ctx.fillStyle = 'rgba(6, 4, 16, 0.35)';
                ctx.fillRect(0, 0, w, h);
                const freq = Math.max(0.25, Number(p.frequency) || 1);
                if (time > next) {
                    makeBolt();
                    next = time + (700 + Math.random() * 1400) / freq;
                }
                bolts = bolts.filter((bolt) => bolt.life > 0);
                bolts.forEach((bolt) => {
                    ctx.strokeStyle = hexAlpha(p.color, bolt.life);
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 18;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    bolt.points.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
                    ctx.stroke();
                    bolt.life -= 0.04;
                });
                ctx.shadowBlur = 0;
            });
            return { destroy: () => window.removeEventListener('resize', onResize) };
        },

        grid(target) {
            const ctx = target.getContext('2d');
            const onResize = () => resizeCanvas(target);
            onResize();
            window.addEventListener('resize', onResize);
            loop((time) => {
                const p = params();
                const { width: w, height: h } = target;
                const t = time * 0.0008 * (Number(p.speed) || 1);
                ctx.fillStyle = '#04111a';
                ctx.fillRect(0, 0, w, h);
                ctx.strokeStyle = hexAlpha(p.color, 0.28);
                ctx.lineWidth = 1;
                const horizon = h * 0.38;
                for (let i = 0; i < 18; i++) {
                    const prog = (i / 18 + t) % 1;
                    const y = horizon + prog * prog * (h - horizon);
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.stroke();
                }
                for (let i = -16; i <= 16; i++) {
                    ctx.beginPath();
                    ctx.moveTo(w / 2 + i * 36, horizon);
                    ctx.lineTo(w / 2 + i * 140, h);
                    ctx.stroke();
                }
                const glow = ctx.createLinearGradient(0, 0, 0, horizon);
                glow.addColorStop(0, hexAlpha(p.color, 0.22));
                glow.addColorStop(1, 'rgba(8, 47, 73, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, w, horizon);
            });
            return { destroy: () => window.removeEventListener('resize', onResize) };
        },

        plasma(target) {
            const ctx = target.getContext('2d');
            const buffer = document.createElement('canvas');
            const bctx = buffer.getContext('2d');
            const onResize = () => resizeCanvas(target);
            onResize();
            window.addEventListener('resize', onResize);
            loop((time) => {
                const p = params();
                const { width: w, height: h } = target;
                const t = time * 0.0012 * (Number(p.speed) || 1);
                const sat = Number(p.saturation) || 80;
                const hueShift = Number(p.hue) || 0;
                const scale = isCompactFx() ? 8 : 6;
                const bw = Math.max(120, Math.floor(w / scale));
                const bh = Math.max(70, Math.floor(h / scale));
                if (buffer.width !== bw || buffer.height !== bh) {
                    buffer.width = bw;
                    buffer.height = bh;
                }
                const image = bctx.createImageData(bw, bh);
                const data = image.data;
                for (let y = 0; y < bh; y++) {
                    for (let x = 0; x < bw; x++) {
                        const v = 0.5 + 0.5 * Math.sin(x * 0.12 + t)
                            + 0.5 * Math.sin(y * 0.1 + t * 1.3)
                            + 0.5 * Math.sin((x + y) * 0.07 + t * 0.7);
                        const hue = (v * 70 + t * 20 + hueShift) % 360;
                        const [r, g, b] = hslToRgb(hue, sat, 55);
                        const i = (y * bw + x) * 4;
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                        data[i + 3] = 255;
                    }
                }
                bctx.putImageData(image, 0, 0);
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(buffer, 0, 0, w, h);
            });
            return { destroy: () => window.removeEventListener('resize', onResize) };
        }
    };

    function hexToRgb(hex) {
        const n = String(hex || '#ffffff').replace('#', '');
        if (n.length !== 6) return [255, 255, 255];
        return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
    }

    function hexAlpha(hex, alpha) {
        const [r, g, b] = hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const k = (n) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
    }

    function spark(x, y) {
        if (reducedMotion) return;
        const root = document.createElement('span');
        root.className = 'click-spark';
        root.style.left = `${x}px`;
        root.style.top = `${y}px`;
        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('span');
            ray.style.setProperty('--angle', `${i * 45}deg`);
            root.appendChild(ray);
        }
        document.body.appendChild(root);
        setTimeout(() => root.remove(), 450);
    }

    function bindClickSpark() {
        document.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (!e.isPrimary) return;
            spark(e.clientX, e.clientY);
        });
    }

    function bindMagnet(el) {
        if (!el || reducedMotion) return;
        const strength = 12;
        el.addEventListener('pointermove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
            el.style.transform = `translate(${x}px, ${y}px)`;
        });
        el.addEventListener('pointerleave', () => {
            el.style.transform = '';
        });
    }

    function bindSpotlight(el) {
        if (!el) return;
        el.classList.add('spotlight-card');
        el.addEventListener('pointermove', (e) => {
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
            el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
        });
    }

    function enhanceTodo(el) {
        bindSpotlight(el);
    }

    function initUI({ addBtn }) {
        bindClickSpark();
        bindMagnet(addBtn);
    }

    window.BitsFX = {
        themes: BITS_THEMES,
        start,
        stop,
        updateParams,
        getDefaults,
        getSchema,
        isBitsTheme: (id) => BITS_THEMES.some((theme) => theme.id === id),
        initUI,
        enhanceTodo
    };
})();
