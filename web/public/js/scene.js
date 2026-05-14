// Home page scene — starfield + Elenos core with mouse-reactive
// triangle fragments (igloo.inc-style breathing).
(function () {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    // ============================================
    // STARFIELD — two layers for depth
    // ============================================
    function makeStars(count, spread, size, opacity, color) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = spread * 0.5 + Math.random() * spread;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return new THREE.Points(
            geo,
            new THREE.PointsMaterial({
                color,
                size,
                sizeAttenuation: true,
                transparent: true,
                opacity,
                depthWrite: false,
            })
        );
    }

    const starsFar = makeStars(isMobile ? 1200 : 2400, 600, 0.85, 0.75, 0xffffff);
    const starsMid = makeStars(isMobile ? 600 : 1200, 220, 1.1, 0.6, 0xd8c4ff);
    scene.add(starsFar);
    scene.add(starsMid);

    // ============================================
    // CORE GROUP
    // ============================================
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // --- Triangle fragments (igloo.inc-style) ---
    // Each face of the icosahedron becomes its own group (fill + wireframe),
    // with individual phase, drift speed, and mouse-reaction parameters.
    const fragColors = [0xa200ff, 0xc466ff, 0x8a00d6, 0xd98aff];
    const fragSourceGeo = new THREE.IcosahedronGeometry(2.2, isMobile ? 0 : 1);
    const fragSourcePos = fragSourceGeo.attributes.position;
    const fragments = [];

    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();
    const _vC = new THREE.Vector3();

    for (let i = 0; i < fragSourcePos.count; i += 3) {
        _vA.fromBufferAttribute(fragSourcePos, i);
        _vB.fromBufferAttribute(fragSourcePos, i + 1);
        _vC.fromBufferAttribute(fragSourcePos, i + 2);
        const center = new THREE.Vector3()
            .add(_vA).add(_vB).add(_vC)
            .multiplyScalar(1 / 3);
        const normal = center.clone().normalize();

        const localGeo = new THREE.BufferGeometry();
        const verts = new Float32Array([
            _vA.x - center.x, _vA.y - center.y, _vA.z - center.z,
            _vB.x - center.x, _vB.y - center.y, _vB.z - center.z,
            _vC.x - center.x, _vC.y - center.y, _vC.z - center.z,
        ]);
        localGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        localGeo.computeVertexNormals();

        const color = fragColors[Math.floor(Math.random() * fragColors.length)];

        const fillMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.12 + Math.random() * 0.16,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const fill = new THREE.Mesh(localGeo, fillMat);

        const edgeGeo = new THREE.EdgesGeometry(localGeo);
        const edgeMat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.7 + Math.random() * 0.25,
        });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);

        const g = new THREE.Group();
        g.add(fill);
        g.add(edges);
        g.position.copy(center);
        g.userData = {
            basePos: center.clone(),
            normal,
            phase: Math.random() * Math.PI * 2,
            // Slower, bigger ambient breath
            driftSpeed: 0.18 + Math.random() * 0.45,
            floatAmp: 0.08 + Math.random() * 0.12,
            explodeBoost: 0.5 + Math.random() * 0.6,
            // Per-fragment strength of mouse reaction (±25% variance)
            reactMult: 0.75 + Math.random() * 0.5,
            // Per-fragment secondary breath phase so the wave isn't monolithic
            mousePhase: Math.random() * Math.PI * 2,
        };
        fragments.push(g);
        coreGroup.add(g);
    }

    // --- Inner dim core (visible through the gaps) ---
    const innerGeo = new THREE.IcosahedronGeometry(1.3, 4);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0x1a0030,
        transparent: true,
        opacity: 0.45,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(inner);

    // --- Halo ---
    const haloGeo = new THREE.SphereGeometry(3.2, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xa200ff,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    coreGroup.add(halo);

    // --- Orbital particles ---
    const orbitCount = isMobile ? 400 : 900;
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPos = new Float32Array(orbitCount * 3);
    for (let i = 0; i < orbitCount; i++) {
        const r = 2.6 + Math.random() * 1.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        orbitPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        orbitPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        orbitPos[i * 3 + 2] = r * Math.cos(phi);
    }
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));
    const orbitMat = new THREE.PointsMaterial({
        color: 0xc466ff,
        size: 0.055,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
    });
    const orbit = new THREE.Points(orbitGeo, orbitMat);
    coreGroup.add(orbit);

    // --- Orbit ring ---
    const ringGeo = new THREE.RingGeometry(3.6, 3.65, 128);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xa200ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.45;
    coreGroup.add(ring);

    // ============================================
    // INTERACTION STATE
    // ============================================
    let targetX = 0, targetY = 0;   // raw mouse NDC
    let gazeX = 0, gazeY = 0;       // smoothed tracker
    let spinOffsetY = 0, spinOffsetX = 0;   // velocity-kick rotation
    let velMag = 0;                 // smoothed velocity magnitude
    let lastEventX = null, lastEventY = null;
    let scrollY = 0;

    if (!prefersReduce) {
        window.addEventListener('mousemove', (e) => {
            const nx = (e.clientX / innerWidth - 0.5) * 2;
            const ny = (e.clientY / innerHeight - 0.5) * 2;
            if (lastEventX !== null) {
                const dx = nx - lastEventX;
                const dy = ny - lastEventY;
                // Angular kick — intensified for dramatic cursor response
                spinOffsetY += dx * 0.5;
                spinOffsetX += dy * 0.42;
                // Velocity drives fragment push + particle punch
                velMag = Math.min(18, velMag + Math.hypot(dx, dy) * 32);
            }
            targetX = nx;
            targetY = ny;
            lastEventX = nx;
            lastEventY = ny;
        }, { passive: true });
    }

    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    }, { passive: true });

    function resize() {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    }
    window.addEventListener('resize', resize);

    // ============================================
    // RENDER LOOP
    // ============================================
    const clock = new THREE.Clock();
    function tick() {
        const t = clock.getElapsedTime();

        // Smooth gaze toward mouse
        gazeX += (targetX - gazeX) * 0.08;
        gazeY += (targetY - gazeY) * 0.08;

        // Decay velocity kick + magnitude — whip settles
        spinOffsetY *= 0.91;
        spinOffsetX *= 0.91;
        velMag *= 0.9;

        // Inner spin + orbit (ambient)
        inner.rotation.x = -t * 0.08;
        inner.rotation.y = -t * 0.1;
        orbit.rotation.y = t * 0.12 + spinOffsetY * 0.4;
        orbit.rotation.x = t * 0.04 + spinOffsetX * 0.35;

        // Fragment animation — ambient breath + ONE-SIDED cursor opening.
        // Only fragments whose outward normal points toward the cursor push
        // outward along their normal. Opposite-side fragments never contract;
        // they stay at rest on their ambient breath.
        for (let i = 0; i < fragments.length; i++) {
            const g = fragments[i];
            const d = g.userData;

            // Gentle ambient breath
            const baseFloat = Math.sin(t * d.driftSpeed + d.phase) * d.floatAmp;

            // Cursor alignment (dot of fragment's outward direction with gaze).
            // Clamp to ≥ 0 so only cursor-facing fragments react.
            const mouseAlignment = d.normal.x * gazeX + d.normal.y * -gazeY;
            const cursorSide = Math.max(0, mouseAlignment);

            // Opens toward cursor (asymmetric) — intensified
            const mouseOpen = cursorSide * d.reactMult * 0.85;
            // Velocity bursts are also cursor-side only — no global pulse
            const velPush = velMag * 0.1 * d.explodeBoost * cursorSide;

            const offset = baseFloat + mouseOpen + velPush;
            g.position.copy(d.basePos).addScaledVector(d.normal, offset);

            // Cursor-side fragments tilt slightly more
            const tiltAmt = 0.16 + cursorSide * 0.08;
            g.rotation.x = Math.sin(t * d.driftSpeed * 0.85 + d.phase) * tiltAmt;
            g.rotation.y = Math.cos(t * d.driftSpeed * 0.7 + d.phase) * tiltAmt;
        }

        // Gaze rotation (lean-tilt toward cursor) — intensified
        coreGroup.rotation.y = gazeX * 0.35 + spinOffsetY * 0.7;
        coreGroup.rotation.x = -gazeY * 0.28 + spinOffsetX * 0.6;

        // Ring tilts mildly
        ring.rotation.z = t * 0.05 + spinOffsetY * 0.55;
        ring.rotation.x = Math.PI * 0.45 + spinOffsetX * 0.4;

        // No symmetric pulse effects — the opening is cursor-side only now.
        // Scale, halo, orbit all stay steady so nothing "inhales/exhales."
        coreGroup.scale.setScalar(1);
        orbitMat.size = 0.055;
        orbitMat.opacity = 0.75;

        // Starfield parallax
        starsFar.rotation.y = t * 0.008 + gazeX * 0.06;
        starsFar.rotation.x = gazeY * 0.04;
        starsMid.rotation.y = -t * 0.012 + gazeX * 0.09;

        // Scroll drift only — no mouse lean. Core stays centered.
        const pct = Math.min(scrollY / (innerHeight * 1.5), 1);
        coreGroup.position.x = 0;
        coreGroup.position.y = -pct * 3.5;
        coreGroup.position.z = -pct * 4;
        haloMat.opacity = 0.06 * (1 - pct * 0.6);
        ringMat.opacity = 0.3 * (1 - pct * 0.7);

        // Camera parallax — boosted for more responsiveness
        camera.position.x = gazeX * 0.25;
        camera.position.y = -gazeY * 0.18;
        camera.lookAt(coreGroup.position.x * 0.3, coreGroup.position.y * 0.5, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();
})();
