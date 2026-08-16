(function (global) {
    const PRESETS = [
        { id: 'cat', name: 'Cat' },
        { id: 'slime', name: 'Slime' },
        { id: 'bunny', name: 'Bunny' },
        { id: 'chick', name: 'Chick' },
        { id: 'fox', name: 'Fox' }
    ];
    const DEFAULT_ID = 'cat';
    const BASE_SIZE = 64;

    let root = null;
    let img = null;
    let raf = 0;
    let running = false;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let facing = 1;
    let scale = 1;
    let speed = 76;
    let lastTs = 0;
    let pauseUntil = 0;
    let placed = false;
    let dragging = false;
    let moved = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pointerStart = null;
    let hopUntil = 0;
    let hopAmount = 0;

    function prefersReducedMotion() {
        return Boolean(global.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    }

    function viewport() {
        const vv = global.visualViewport;
        return {
            x: vv ? vv.offsetLeft : 0,
            y: vv ? vv.offsetTop : 0,
            w: vv ? vv.width : global.innerWidth,
            h: vv ? vv.height : global.innerHeight
        };
    }

    function petSize() {
        return Math.max(36, Math.round(BASE_SIZE * scale));
    }

    function bounds() {
        const view = viewport();
        const size = petSize();
        const pad = 10;
        const minX = view.x + pad;
        const minY = view.y + pad;
        const maxX = view.x + Math.max(pad, view.w - size - pad);
        const maxY = view.y + Math.max(pad, view.h - size - pad - 18);
        return { minX, minY, maxX: Math.max(minX, maxX), maxY: Math.max(minY, maxY) };
    }

    function clampToBounds() {
        const box = bounds();
        x = Math.min(box.maxX, Math.max(box.minX, x));
        y = Math.min(box.maxY, Math.max(box.minY, y));
    }

    function pickTarget() {
        const box = bounds();
        tx = box.minX + Math.random() * (box.maxX - box.minX);
        ty = box.minY + Math.random() * (box.maxY - box.minY);
        speed = prefersReducedMotion() ? 22 : 58 + Math.random() * 42;
    }

    function poke() {
        const now = performance.now();
        hopUntil = now + 420;
        hopAmount = prefersReducedMotion() ? 6 : 16;
        facing *= -1;
        pauseUntil = hopUntil + 280 + Math.random() * 400;
        pickTarget();
        if (root) {
            root.classList.remove('is-poked');
            void root.offsetWidth;
            root.classList.add('is-poked');
            global.setTimeout(() => root?.classList.remove('is-poked'), 450);
        }
        paint();
    }

    function onPointerDown(e) {
        if (!running || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        moved = false;
        pointerStart = { x: e.clientX, y: e.clientY };
        dragOffsetX = e.clientX - x;
        dragOffsetY = e.clientY - y;
        pauseUntil = Number.POSITIVE_INFINITY;
        root.classList.add('is-held');
        root.setPointerCapture?.(e.pointerId);
        root.addEventListener('pointermove', onPointerMove);
        root.addEventListener('pointerup', onPointerUp);
        root.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerMove(e) {
        if (!dragging) return;
        const dx = e.clientX - pointerStart.x;
        const dy = e.clientY - pointerStart.y;
        if (Math.hypot(dx, dy) > 7) moved = true;
        x = e.clientX - dragOffsetX;
        y = e.clientY - dragOffsetY;
        clampToBounds();
        paint();
    }

    function onPointerUp(e) {
        if (!dragging) return;
        dragging = false;
        root.classList.remove('is-held');
        try { root.releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
        root.removeEventListener('pointermove', onPointerMove);
        root.removeEventListener('pointerup', onPointerUp);
        root.removeEventListener('pointercancel', onPointerUp);
        if (!moved) {
            poke();
            return;
        }
        pauseUntil = performance.now() + 360;
        pickTarget();
        paint();
    }

    function onKeyDown(e) {
        if (!running) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            poke();
        }
    }

    function ensureDom() {
        if (root && img) return;
        root = document.getElementById('roam-pet');
        if (!root) {
            root = document.createElement('div');
            root.id = 'roam-pet';
            document.body.appendChild(root);
        }
        root.className = 'roam-pet';
        root.setAttribute('aria-hidden', 'false');
        root.setAttribute('role', 'img');
        root.setAttribute('aria-label', 'Pet — tap or drag');
        root.title = 'Tap or drag me';
        root.tabIndex = 0;
        img = root.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            img.alt = '';
            img.draggable = false;
            root.appendChild(img);
        }
        if (!root.dataset.orbitBound) {
            root.dataset.orbitBound = '1';
            root.addEventListener('pointerdown', onPointerDown);
            root.addEventListener('keydown', onKeyDown);
            root.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    function hopOffset() {
        const now = performance.now();
        if (now >= hopUntil) return 0;
        const t = 1 - (hopUntil - now) / 420;
        return Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * hopAmount;
    }

    function paint() {
        if (!root || !img) return;
        const size = petSize();
        root.style.width = `${size}px`;
        root.style.height = `${size}px`;
        root.style.transform = `translate3d(${x}px, ${y - hopOffset()}px, 0)`;
        img.classList.toggle('is-left', facing < 0);
    }

    function tick(ts) {
        if (!running) return;
        raf = global.requestAnimationFrame(tick);
        if (document.hidden) {
            lastTs = ts;
            return;
        }
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.05, (ts - lastTs) / 1000);
        lastTs = ts;

        if (dragging) {
            paint();
            return;
        }
        if (ts < pauseUntil) {
            paint();
            return;
        }

        const dx = tx - x;
        const dy = ty - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 5) {
            pauseUntil = ts + (prefersReducedMotion() ? 2200 : 700) + Math.random() * 1800;
            pickTarget();
            paint();
            return;
        }

        const step = speed * dt;
        x += (dx / dist) * step;
        y += (dy / dist) * step;
        if (Math.abs(dx) > 1.5) facing = dx < 0 ? -1 : 1;
        paint();
    }

    function startLoop() {
        if (raf) cancelAnimationFrame(raf);
        lastTs = 0;
        raf = global.requestAnimationFrame(tick);
    }

    function normalize(choice) {
        if (choice === 'custom') return 'custom';
        if (PRESETS.some((pet) => pet.id === choice)) return choice;
        return DEFAULT_ID;
    }

    function presetSrc(id, base) {
        const safe = normalize(id === 'custom' ? DEFAULT_ID : id);
        const rootPath = String(base || './assets/pets/').replace(/\/?$/, '/');
        return `${rootPath}${safe}.gif`;
    }

    const OrbitPet = {
        PRESETS,
        DEFAULT: DEFAULT_ID,
        normalize,
        presetSrc,
        start(options = {}) {
            ensureDom();
            const nextScale = Number(options.scale);
            if (Number.isFinite(nextScale) && nextScale > 0) scale = nextScale;
            if (options.src) OrbitPet.setSrc(options.src);
            root.hidden = false;
            running = true;
            if (!placed) {
                const box = bounds();
                x = box.minX + Math.random() * (box.maxX - box.minX);
                y = box.minY + Math.random() * (box.maxY - box.minY);
                placed = true;
            } else {
                clampToBounds();
            }
            pickTarget();
            paint();
            startLoop();
        },
        stop() {
            running = false;
            placed = false;
            dragging = false;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            if (root) {
                root.hidden = true;
                root.classList.remove('is-held', 'is-poked');
            }
        },
        setScale(next) {
            const value = Number(next);
            if (!Number.isFinite(value) || value <= 0) return;
            scale = value;
            clampToBounds();
            paint();
        },
        setSrc(src) {
            ensureDom();
            if (!src || !img) return;
            if (img.getAttribute('src') === src) return;
            img.src = src;
        }
    };

    global.addEventListener('resize', () => {
        if (!running) return;
        clampToBounds();
        pickTarget();
        paint();
    });
    global.visualViewport?.addEventListener('resize', () => {
        if (!running) return;
        clampToBounds();
        paint();
    });

    global.OrbitPet = OrbitPet;
})(window);
