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
    const MAX_PETS = 32;

    const flock = new Map();
    let layer = null;
    let raf = 0;
    let lastTs = 0;
    let globalScale = 1;
    let paused = false;

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

    function petSizeFor(scale) {
        return Math.max(36, Math.round(BASE_SIZE * scale));
    }

    function boundsFor(scale) {
        const view = viewport();
        const size = petSizeFor(scale);
        const pad = 10;
        const minX = view.x + pad;
        const minY = view.y + pad;
        const maxX = view.x + Math.max(pad, view.w - size - pad);
        const maxY = view.y + Math.max(pad, view.h - size - pad - 18);
        return { minX, minY, maxX: Math.max(minX, maxX), maxY: Math.max(minY, maxY) };
    }

    function ensureLayer() {
        if (layer) return layer;
        layer = document.getElementById('roam-pet-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'roam-pet-layer';
            document.body.appendChild(layer);
        }
        layer.setAttribute('aria-hidden', 'true');
        return layer;
    }

    function createWalker(id) {
        const pet = {
            id,
            root: null,
            img: null,
            x: 0,
            y: 0,
            tx: 0,
            ty: 0,
            facing: Math.random() < 0.5 ? -1 : 1,
            scale: globalScale,
            speed: 70,
            pauseUntil: 0,
            dragging: false,
            moved: false,
            dragOffsetX: 0,
            dragOffsetY: 0,
            pointerStart: null,
            hopUntil: 0,
            hopAmount: 0,
            placed: false
        };

        function clampToBounds() {
            const box = boundsFor(pet.scale);
            pet.x = Math.min(box.maxX, Math.max(box.minX, pet.x));
            pet.y = Math.min(box.maxY, Math.max(box.minY, pet.y));
        }

        function pickTarget() {
            const box = boundsFor(pet.scale);
            pet.tx = box.minX + Math.random() * (box.maxX - box.minX);
            pet.ty = box.minY + Math.random() * (box.maxY - box.minY);
            pet.speed = prefersReducedMotion() ? 22 : 52 + Math.random() * 50;
        }

        function hopOffset() {
            const now = performance.now();
            if (now >= pet.hopUntil) return 0;
            const t = 1 - (pet.hopUntil - now) / 420;
            return Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * pet.hopAmount;
        }

        function paint() {
            if (!pet.root || !pet.img) return;
            const size = petSizeFor(pet.scale);
            pet.root.style.width = `${size}px`;
            pet.root.style.height = `${size}px`;
            pet.root.style.transform = `translate3d(${pet.x}px, ${pet.y - hopOffset()}px, 0)`;
            pet.img.classList.toggle('is-left', pet.facing < 0);
        }

        function poke() {
            const now = performance.now();
            pet.hopUntil = now + 420;
            pet.hopAmount = prefersReducedMotion() ? 6 : 16;
            pet.facing *= -1;
            pet.pauseUntil = pet.hopUntil + 280 + Math.random() * 400;
            pickTarget();
            pet.root.classList.remove('is-poked');
            void pet.root.offsetWidth;
            pet.root.classList.add('is-poked');
            global.setTimeout(() => pet.root?.classList.remove('is-poked'), 450);
            paint();
        }

        function onPointerDown(e) {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            pet.dragging = true;
            pet.moved = false;
            pet.pointerStart = { x: e.clientX, y: e.clientY };
            pet.dragOffsetX = e.clientX - pet.x;
            pet.dragOffsetY = e.clientY - pet.y;
            pet.pauseUntil = Number.POSITIVE_INFINITY;
            pet.root.classList.add('is-held');
            pet.root.setPointerCapture?.(e.pointerId);
            pet.root.addEventListener('pointermove', onPointerMove);
            pet.root.addEventListener('pointerup', onPointerUp);
            pet.root.addEventListener('pointercancel', onPointerUp);
        }

        function onPointerMove(e) {
            if (!pet.dragging) return;
            const dx = e.clientX - pet.pointerStart.x;
            const dy = e.clientY - pet.pointerStart.y;
            if (Math.hypot(dx, dy) > 7) pet.moved = true;
            pet.x = e.clientX - pet.dragOffsetX;
            pet.y = e.clientY - pet.dragOffsetY;
            clampToBounds();
            paint();
        }

        function onPointerUp(e) {
            if (!pet.dragging) return;
            pet.dragging = false;
            pet.root.classList.remove('is-held');
            try { pet.root.releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
            pet.root.removeEventListener('pointermove', onPointerMove);
            pet.root.removeEventListener('pointerup', onPointerUp);
            pet.root.removeEventListener('pointercancel', onPointerUp);
            if (!pet.moved) {
                poke();
                return;
            }
            pet.pauseUntil = performance.now() + 360;
            pickTarget();
            paint();
        }

        function ensureDom() {
            if (pet.root && pet.img) return;
            pet.root = ensureLayer().querySelector(`[data-pet-id="${id}"]`);
            if (!pet.root) {
                pet.root = document.createElement('div');
                pet.root.className = 'roam-pet';
                pet.root.dataset.petId = id;
                ensureLayer().appendChild(pet.root);
            }
            pet.root.setAttribute('role', 'img');
            pet.root.setAttribute('aria-label', 'Pet — tap or drag');
            pet.root.title = 'Tap or drag me';
            pet.img = pet.root.querySelector('img');
            if (!pet.img) {
                pet.img = document.createElement('img');
                pet.img.alt = '';
                pet.img.draggable = false;
                pet.root.appendChild(pet.img);
            }
            if (!pet.root.dataset.orbitBound) {
                pet.root.dataset.orbitBound = '1';
                pet.root.addEventListener('pointerdown', onPointerDown);
                pet.root.addEventListener('click', (e) => e.stopPropagation());
            }
        }

        function place() {
            ensureDom();
            if (!pet.placed) {
                const box = boundsFor(pet.scale);
                pet.x = box.minX + Math.random() * (box.maxX - box.minX);
                pet.y = box.minY + Math.random() * (box.maxY - box.minY);
                pet.placed = true;
            } else {
                clampToBounds();
            }
            pickTarget();
            pet.root.hidden = false;
            paint();
        }

        function tick(ts, dt) {
            if (!pet.root) return;
            if (pet.dragging) {
                paint();
                return;
            }
            if (ts < pet.pauseUntil) {
                paint();
                return;
            }
            const dx = pet.tx - pet.x;
            const dy = pet.ty - pet.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 5) {
                pet.pauseUntil = ts + (prefersReducedMotion() ? 2200 : 600) + Math.random() * 1800;
                pickTarget();
                paint();
                return;
            }
            const step = pet.speed * dt;
            pet.x += (dx / dist) * step;
            pet.y += (dy / dist) * step;
            if (Math.abs(dx) > 1.5) pet.facing = dx < 0 ? -1 : 1;
            paint();
        }

        function setSrc(src) {
            ensureDom();
            if (!src || !pet.img) return;
            if (pet.img.getAttribute('src') === src) return;
            pet.img.src = src;
        }

        function setScale(next) {
            const value = Number(next);
            if (!Number.isFinite(value) || value <= 0) return;
            pet.scale = value;
            clampToBounds();
            paint();
        }

        function destroy() {
            pet.dragging = false;
            pet.root?.remove();
            pet.root = null;
            pet.img = null;
        }

        function onResize() {
            clampToBounds();
            pickTarget();
            paint();
        }

        return { id: pet.id, place, tick, setSrc, setScale, destroy, onResize };
    }

    function stopLoop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        lastTs = 0;
    }

    function tick(ts) {
        if (!flock.size) {
            stopLoop();
            return;
        }
        if (document.hidden || paused) {
            lastTs = 0;
            raf = 0;
            return;
        }
        raf = global.requestAnimationFrame(tick);
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.05, (ts - lastTs) / 1000);
        lastTs = ts;
        flock.forEach((walker) => walker.tick(ts, dt));
    }

    function startLoop() {
        if (raf || !flock.size || paused || document.hidden) return;
        lastTs = 0;
        raf = global.requestAnimationFrame(tick);
    }

    function normalize(choice) {
        if (choice === 'custom') return 'custom';
        if (PRESETS.some((item) => item.id === choice)) return choice;
        return DEFAULT_ID;
    }

    function presetSrc(id, base) {
        const safe = normalize(id === 'custom' ? DEFAULT_ID : id);
        const rootPath = String(base || './assets/pets/').replace(/\/?$/, '/');
        return `${rootPath}${safe}.gif`;
    }

    function presetName(id) {
        if (id === 'custom') return 'Yours';
        return PRESETS.find((item) => item.id === id)?.name || 'Cat';
    }

    const OrbitPet = {
        PRESETS,
        DEFAULT: DEFAULT_ID,
        MAX: MAX_PETS,
        normalize,
        presetSrc,
        presetName,
        sync(items, options = {}) {
            const list = Array.isArray(items) ? items.slice(0, MAX_PETS) : [];
            const nextScale = Number(options.scale);
            if (Number.isFinite(nextScale) && nextScale > 0) globalScale = nextScale;

            const wanted = new Set(list.map((item) => String(item.id)));
            flock.forEach((walker, id) => {
                if (!wanted.has(id)) {
                    walker.destroy();
                    flock.delete(id);
                }
            });

            list.forEach((item) => {
                const id = String(item.id);
                if (!id) return;
                let walker = flock.get(id);
                if (!walker) {
                    walker = createWalker(id);
                    flock.set(id, walker);
                    walker.place();
                }
                walker.setScale(globalScale);
                if (item.src) walker.setSrc(item.src);
            });

            if (flock.size) startLoop();
            else stopLoop();
        },
        stop() {
            paused = false;
            flock.forEach((walker) => walker.destroy());
            flock.clear();
            stopLoop();
            if (layer) layer.hidden = false;
        },
        pause() {
            paused = true;
            stopLoop();
            if (layer) layer.hidden = true;
        },
        resume() {
            paused = false;
            if (layer) layer.hidden = false;
            startLoop();
        },
        setScale(next) {
            const value = Number(next);
            if (!Number.isFinite(value) || value <= 0) return;
            globalScale = value;
            flock.forEach((walker) => walker.setScale(value));
        }
    };

    global.addEventListener('visibilitychange', () => {
        if (document.hidden) stopLoop();
        else if (!paused) startLoop();
    });
    global.addEventListener('resize', () => {
        flock.forEach((walker) => walker.onResize());
    });
    global.visualViewport?.addEventListener('resize', () => {
        flock.forEach((walker) => walker.onResize());
    });

    global.OrbitPet = OrbitPet;
})(window);
