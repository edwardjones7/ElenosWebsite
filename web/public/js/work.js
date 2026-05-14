// Work page — per-project 3D metaphors threaded through a scroll journey.
// Each project is a bespoke scene element; camera scrolls through them in sequence.
(function () {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.011);
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 800);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    // ============================================
    // STARFIELD — ambient always-on backdrop
    // ============================================
    function makeStars(count, spreadX, spreadY, spreadZ, size, opacity, color) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * spreadX;
            pos[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
            pos[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
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

    const starsFar = makeStars(isMobile ? 1800 : 3600, 500, 900, 500, 0.3, 0.7, 0xffffff);
    const starsMid = makeStars(isMobile ? 700 : 1400, 260, 700, 260, 0.55, 0.55, 0xe8dcff);
    scene.add(starsFar);
    scene.add(starsMid);

    // ============================================
    // PROJECT LAYOUT — even vertical spacing
    // ============================================
    const SPACING = 32;
    const PROJECTS = [
        { id: 'ironbound',    y: -1 * SPACING, x: 5.5, make: makeIronboundScene },
        { id: 'sr71',         y: -2 * SPACING, x: -6,  make: makeSR71Scene },
        { id: 'edthestatman', y: -3 * SPACING, x: 5.5, make: makeStatmanScene },
        { id: 'alpha',        y: -4 * SPACING, x: -6,  make: makeAlphaScene },
        { id: 'sheriff',     y: -5 * SPACING, x: 5.5,  make: makeSheriffScene },
        { id: 'acuityiq',     y: -6 * SPACING, x: -6,  make: makeAcuityIQScene },
        { id: 'elenos',       y: -7 * SPACING, x: 0,   make: makeElenosScene },
    ];

    // ============================================
    // PROJECT METAPHORS
    // ============================================

    // 1 · EdTheStatMan — data topology + floating ticker shards + wireframe stadium
    function makeStatmanScene(x, y) {
        const g = new THREE.Group();
        g.position.set(x, y, -2);

        // Wireframe stadium (oval torus)
        const stadiumGeo = new THREE.TorusGeometry(2.2, 0.06, 6, 96);
        const stadiumMat = new THREE.MeshBasicMaterial({
            color: 0x6effbf,
            wireframe: true,
            transparent: true,
            opacity: 0.75,
        });
        const stadium = new THREE.Mesh(stadiumGeo, stadiumMat);
        stadium.rotation.x = Math.PI / 2 - 0.25;
        stadium.scale.set(1, 0.55, 0.82);
        g.add(stadium);

        // Inner rings — concentric stadium rings
        for (let i = 0; i < 3; i++) {
            const r = 1.4 + i * 0.35;
            const ringGeo = new THREE.TorusGeometry(r, 0.012, 4, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x6effbf,
                transparent: true,
                opacity: 0.35 - i * 0.08,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2 - 0.25;
            ring.scale.set(1, 0.55, 0.82);
            g.add(ring);
        }

        // Data grid — wireframe plane with displaced vertices (terrain feel)
        const gridGeo = new THREE.PlaneGeometry(9, 9, 28, 28);
        const positions = gridGeo.attributes.position;
        const heights = [];
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const h = Math.sin(x * 0.8) * 0.15 + Math.cos(y * 0.9) * 0.12 + (Math.random() - 0.5) * 0.08;
            heights.push({ base: h, offset: Math.random() * Math.PI * 2 });
            positions.setZ(i, h);
        }
        gridGeo.computeVertexNormals();
        const gridMat = new THREE.MeshBasicMaterial({
            color: 0x1a8a5c,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
        });
        const grid = new THREE.Mesh(gridGeo, gridMat);
        grid.rotation.x = -Math.PI / 2 + 0.12;
        grid.position.y = -1.8;
        g.add(grid);
        g.userData.grid = { mesh: grid, heights };

        // Floating ticker cards — thin planes arranged in loose orbital cloud
        const cards = [];
        for (let i = 0; i < 7; i++) {
            const cardGeo = new THREE.PlaneGeometry(1.1 + Math.random() * 0.4, 0.14);
            const cardMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x6effbf : 0xffffff,
                transparent: true,
                opacity: 0.55,
                side: THREE.DoubleSide,
            });
            const card = new THREE.Mesh(cardGeo, cardMat);
            const a = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
            const r = 2.8 + Math.random() * 0.8;
            card.position.set(Math.cos(a) * r, (Math.random() - 0.3) * 1.5, Math.sin(a) * r);
            card.userData.a = a;
            card.userData.r = r;
            card.userData.yOff = Math.random() * Math.PI * 2;
            cards.push(card);
            g.add(card);
        }
        g.userData.cards = cards;

        // Glow
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(3.6, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0x6effbf,
                transparent: true,
                opacity: 0.05,
                side: THREE.BackSide,
                depthWrite: false,
            })
        );
        g.add(halo);

        g.userData.type = 'statman';
        return g;
    }

    // 2 · Ironbound Roofing — triangular roof forms + I-beams in warm amber
    function makeIronboundScene(x, y) {
        const g = new THREE.Group();
        g.position.set(x, y, -2);

        // Triangular prism (roof) geometry
        function makeRoof(size, depth) {
            const shape = new THREE.Shape();
            shape.moveTo(-size, 0);
            shape.lineTo(0, size * 0.9);
            shape.lineTo(size, 0);
            shape.lineTo(-size, 0);
            const extrudeSettings = { depth, bevelEnabled: false };
            return new THREE.ExtrudeGeometry(shape, extrudeSettings);
        }

        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x8a3a1a,
            roughness: 0.75,
            metalness: 0.3,
            emissive: 0x1a0a02,
            emissiveIntensity: 0.3,
            flatShading: true,
        });

        const roof1Geo = makeRoof(1.4, 2);
        const roof1 = new THREE.Mesh(roof1Geo, roofMat);
        roof1.position.set(0, -0.4, -1);
        roof1.rotation.y = 0.3;
        g.add(roof1);
        g.userData.roof1 = roof1;

        const roof2 = new THREE.Mesh(makeRoof(0.9, 1.3), roofMat.clone());
        roof2.material.color = new THREE.Color(0xb87033);
        roof2.position.set(1.8, 0.3, 0.5);
        roof2.rotation.y = -0.4;
        roof2.rotation.z = 0.1;
        g.add(roof2);
        g.userData.roof2 = roof2;

        const roof3 = new THREE.Mesh(makeRoof(1.1, 1.6), roofMat.clone());
        roof3.material.color = new THREE.Color(0x5a2612);
        roof3.position.set(-1.9, 0.1, 0.3);
        roof3.rotation.y = 0.8;
        roof3.rotation.x = -0.1;
        g.add(roof3);
        g.userData.roof3 = roof3;

        // I-beams floating around
        const beamMat = new THREE.MeshStandardMaterial({
            color: 0xa06040,
            roughness: 0.35,
            metalness: 0.85,
            flatShading: true,
        });

        function makeIBeam(len) {
            const beam = new THREE.Group();
            const flangeGeo = new THREE.BoxGeometry(len, 0.08, 0.5);
            const webGeo = new THREE.BoxGeometry(len, 0.4, 0.08);
            const top = new THREE.Mesh(flangeGeo, beamMat);
            top.position.y = 0.22;
            const bot = new THREE.Mesh(flangeGeo, beamMat);
            bot.position.y = -0.22;
            const web = new THREE.Mesh(webGeo, beamMat);
            beam.add(top, bot, web);
            return beam;
        }

        const b1 = makeIBeam(3);
        b1.position.set(2.2, -1.2, -1.5);
        b1.rotation.z = 0.35;
        b1.rotation.y = 0.5;
        g.add(b1);
        g.userData.b1 = b1;

        const b2 = makeIBeam(2.2);
        b2.position.set(-2.5, 1.3, -0.5);
        b2.rotation.z = -0.25;
        b2.rotation.y = -0.3;
        g.add(b2);
        g.userData.b2 = b2;

        // Wireframe structural cube overlay (subtle)
        const wireGeo = new THREE.BoxGeometry(5, 3.5, 3);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xffb070,
            wireframe: true,
            transparent: true,
            opacity: 0.12,
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        g.add(wire);
        g.userData.wire = wire;

        // Halo
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(4, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0xff9555,
                transparent: true,
                opacity: 0.06,
                side: THREE.BackSide,
                depthWrite: false,
            })
        );
        g.add(halo);

        g.userData.type = 'ironbound';
        return g;
    }

    // 3 · Alpha Painting — smooth warm sphere with paint-swatch ring
    function makeAlphaScene(x, y) {
        const g = new THREE.Group();
        g.position.set(x, y, -2);

        // Canvas planet — warm cream sphere
        const sphereGeo = new THREE.SphereGeometry(2, 48, 48);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: 0xf5ece0,
            roughness: 0.85,
            metalness: 0.02,
            emissive: 0x2a1f14,
            emissiveIntensity: 0.2,
        });
        g.add(new THREE.Mesh(sphereGeo, sphereMat));

        // Paint drips — elongated cylinders on the surface
        const dripColors = [0xf0e6d4, 0xc4704b, 0xd4a65a, 0x8aaa7e, 0xc4704b, 0xd4a65a, 0xf0e6d4, 0x8aaa7e];
        const drips = [];
        for (let i = 0; i < 8; i++) {
            const len = 0.5 + Math.random() * 1.0;
            const dripGeo = new THREE.CylinderGeometry(0.06, 0.12, len, 8, 1);
            const dripMat = new THREE.MeshStandardMaterial({
                color: dripColors[i],
                roughness: 0.4,
                metalness: 0.05,
                emissive: dripColors[i],
                emissiveIntensity: 0.15,
            });
            const drip = new THREE.Mesh(dripGeo, dripMat);

            // Place on sphere surface pointing outward
            const theta = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
            const phi = 0.6 + Math.random() * 1.8;
            const nx = Math.sin(phi) * Math.cos(theta);
            const ny = Math.sin(phi) * Math.sin(theta);
            const nz = Math.cos(phi);
            drip.position.set(nx * 2, ny * 2, nz * 2);
            // Orient drip to point outward from sphere center
            drip.lookAt(nx * 4, ny * 4, nz * 4);
            drip.rotateX(Math.PI / 2);

            drip.userData = { phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5 };
            drips.push(drip);
            g.add(drip);
        }
        g.userData.drips = drips;

        // Splatter particles — floating paint mist
        const splatCount = isMobile ? 200 : 400;
        const splatGeo = new THREE.BufferGeometry();
        const splatPos = new Float32Array(splatCount * 3);
        const splatColors = new Float32Array(splatCount * 3);
        const palette = [
            new THREE.Color(0xf0e6d4),
            new THREE.Color(0xc4704b),
            new THREE.Color(0xd4a65a),
            new THREE.Color(0x8aaa7e),
            new THREE.Color(0xf5ece0),
        ];
        const splatData = [];
        for (let i = 0; i < splatCount; i++) {
            const r = 2.5 + Math.random() * 1.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            splatPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
            splatPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            splatPos[i*3+2] = r * Math.cos(phi);
            const c = palette[Math.floor(Math.random() * palette.length)];
            splatColors[i*3] = c.r;
            splatColors[i*3+1] = c.g;
            splatColors[i*3+2] = c.b;
            splatData.push({ r, theta, phi, speed: 0.04 + Math.random() * 0.08 });
        }
        splatGeo.setAttribute('position', new THREE.BufferAttribute(splatPos, 3));
        splatGeo.setAttribute('color', new THREE.BufferAttribute(splatColors, 3));
        const splatMat = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        });
        const splatter = new THREE.Points(splatGeo, splatMat);
        g.add(splatter);
        g.userData.splatter = splatter;
        g.userData.splatData = splatData;

        // Brush-stroke ring — thick warm gold orbit
        const ringGeo = new THREE.TorusGeometry(3.2, 0.12, 8, 96);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xd4a65a,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * 0.38;
        g.add(ring);
        g.userData.ring = ring;

        // Halo — warm cream glow
        g.add(new THREE.Mesh(
            new THREE.SphereGeometry(4, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0xf5ece0,
                transparent: true,
                opacity: 0.06,
                side: THREE.BackSide,
                depthWrite: false,
            })
        ));

        g.userData.type = 'alpha';
        return g;
    }

    // 4 · Solana Sheriff — Solana-branded planet (purple + teal gradient, speed rings, validator nodes)
    function makeSheriffScene(x, y) {
        const g = new THREE.Group();
        g.position.set(x, y, -2);

        // Main crystalline body — Solana purple
        const coreGeo = new THREE.IcosahedronGeometry(2, 1);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x9945ff,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x9945ff,
            emissiveIntensity: 0.3,
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        g.add(core);
        g.userData.core = core;

        // Inner teal core — visible through facets
        const innerGeo = new THREE.IcosahedronGeometry(1.8, 2);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x14f195,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        g.add(inner);
        g.userData.inner = inner;

        // Wireframe overlay — crystalline edges
        const wireGeo = new THREE.IcosahedronGeometry(2.05, 1);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x14f195,
            wireframe: true,
            transparent: true,
            opacity: 0.35,
        });
        g.add(new THREE.Mesh(wireGeo, wireMat));

        // Speed rings — 3 at different radii, Solana gradient
        const ringConfigs = [
            { r: 3.0, tube: 0.03, color: 0x9945ff, opacity: 0.6, rx: Math.PI * 0.5 },
            { r: 3.4, tube: 0.025, color: 0x14f195, opacity: 0.45, rx: Math.PI * 0.5 + 0.4 },
            { r: 3.8, tube: 0.02, color: 0xffffff, opacity: 0.25, rx: Math.PI * 0.5 - 0.3 },
        ];
        const speedRings = [];
        ringConfigs.forEach(cfg => {
            const rGeo = new THREE.TorusGeometry(cfg.r, cfg.tube, 4, 128);
            const rMat = new THREE.MeshBasicMaterial({
                color: cfg.color,
                transparent: true,
                opacity: cfg.opacity,
                side: THREE.DoubleSide,
            });
            const rm = new THREE.Mesh(rGeo, rMat);
            rm.rotation.x = cfg.rx;
            rm.rotation.z = Math.random() * 0.5;
            g.add(rm);
            speedRings.push(rm);
        });
        g.userData.speedRings = speedRings;

        // Transaction particles — fast-flowing teal dots along orbits
        const txCount = isMobile ? 300 : 500;
        const txGeo = new THREE.BufferGeometry();
        const txPos = new Float32Array(txCount * 3);
        const txData = [];
        for (let i = 0; i < txCount; i++) {
            const orbitR = 2.8 + Math.random() * 1.4;
            const angle = Math.random() * Math.PI * 2;
            const tilt = (Math.random() - 0.5) * 1.2;
            txPos[i*3]   = Math.cos(angle) * orbitR;
            txPos[i*3+1] = tilt;
            txPos[i*3+2] = Math.sin(angle) * orbitR;
            txData.push({ orbitR, angle, tilt, speed: 0.4 + Math.random() * 0.8 });
        }
        txGeo.setAttribute('position', new THREE.BufferAttribute(txPos, 3));
        const txMat = new THREE.PointsMaterial({
            color: 0x14f195,
            size: 0.06,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
        });
        const txParticles = new THREE.Points(txGeo, txMat);
        g.add(txParticles);
        g.userData.txParticles = txParticles;
        g.userData.txData = txData;

        // Validator nodes — small octahedrons orbiting
        const validatorColors = [0x9945ff, 0x14f195];
        const validators = [];
        for (let i = 0; i < 8; i++) {
            const vGeo = new THREE.OctahedronGeometry(0.14, 0);
            const vMat = new THREE.MeshBasicMaterial({
                color: validatorColors[i % 2],
                transparent: true,
                opacity: 0.85,
            });
            const v = new THREE.Mesh(vGeo, vMat);
            const a = (i / 8) * Math.PI * 2;
            v.userData = {
                angle: a,
                radius: 3.0 + Math.random() * 0.6,
                yOff: (Math.random() - 0.5) * 1.0,
                speed: 0.2 + Math.random() * 0.3,
            };
            validators.push(v);
            g.add(v);
        }
        g.userData.validators = validators;

        // Halo — purple-teal glow
        g.add(new THREE.Mesh(
            new THREE.SphereGeometry(4.2, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0x9945ff, transparent: true, opacity: 0.06, side: THREE.BackSide, depthWrite: false })
        ));

        g.userData.type = 'sheriff';
        return g;
    }

    // 5 · SR-71 — stylized low-poly plane with engine glow and contrail
    function makeSR71Scene(x, y) {
        const g = new THREE.Group();
        g.position.set(x, y, -2);

        const plane = new THREE.Group();
        plane.rotation.y = -0.2;
        g.add(plane);

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x0a0c14,
            roughness: 0.3,
            metalness: 0.95,
            flatShading: false,
        });
        const edgeMat = new THREE.MeshStandardMaterial({
            color: 0x1a1e28,
            roughness: 0.4,
            metalness: 0.9,
            flatShading: true,
        });

        // Fuselage (tapered cylinders)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 16), metalMat);
        body.rotation.z = Math.PI / 2;
        plane.add(body);

        // Nose cone
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.2, 16), metalMat);
        nose.rotation.z = -Math.PI / 2;
        nose.position.x = 2.2;
        plane.add(nose);

        // Tail
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 16), metalMat);
        tail.rotation.z = Math.PI / 2;
        tail.position.x = -1.9;
        plane.add(tail);

        // Delta wings — two elongated triangular prisms flat to body
        function makeWing(side) {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(-1.6, 1.2 * side);
            shape.lineTo(-2.3, 1.3 * side);
            shape.lineTo(-0.4, 0.05 * side);
            shape.lineTo(0, 0);
            const g = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
            const m = new THREE.Mesh(g, edgeMat);
            m.rotation.x = Math.PI / 2;
            m.position.y = 0;
            return m;
        }
        plane.add(makeWing(1));
        plane.add(makeWing(-1));

        // Engines (two nacelles under wings)
        function makeEngine(side) {
            const grp = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 1.6, 12), metalMat);
            body.rotation.z = Math.PI / 2;
            grp.add(body);
            // engine glow (at rear)
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xff7a3a,
                transparent: true,
                opacity: 0.85,
            });
            const glow = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), glowMat);
            glow.position.set(-0.82, 0, 0);
            glow.rotation.y = Math.PI / 2;
            grp.add(glow);
            grp.position.set(-0.8, -0.2, 0.95 * side);
            return { grp, glow };
        }
        const eL = makeEngine(1);
        const eR = makeEngine(-1);
        plane.add(eL.grp);
        plane.add(eR.grp);
        g.userData.engineGlow = [eL.glow, eR.glow];

        // Vertical stabilizers
        function makeStab(side) {
            const shape = new THREE.Shape();
            shape.moveTo(-0.4, 0);
            shape.lineTo(-0.55, 0.55);
            shape.lineTo(0, 0.55);
            shape.lineTo(0.2, 0);
            shape.lineTo(-0.4, 0);
            const g = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
            const m = new THREE.Mesh(g, edgeMat);
            m.position.set(-1.3, 0.1, 0.85 * side);
            m.rotation.y = side > 0 ? -0.15 : 0.15;
            return m;
        }
        plane.add(makeStab(1));
        plane.add(makeStab(-1));

        // Contrail — particle stream trailing the plane
        const trailCount = isMobile ? 120 : 260;
        const trailGeo = new THREE.BufferGeometry();
        const trailPos = new Float32Array(trailCount * 3);
        const trailData = [];
        for (let i = 0; i < trailCount; i++) {
            const t = i / trailCount;
            trailPos[i * 3] = -2 - t * 12;
            trailPos[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
            trailPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            trailData.push({ life: t });
        }
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
        const trailMat = new THREE.PointsMaterial({
            color: 0xd0d8ea,
            size: 0.09,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
        });
        const trail = new THREE.Points(trailGeo, trailMat);
        plane.add(trail);
        g.userData.trail = { points: trail, data: trailData };

        // Ground horizon line — thin wireframe disc far below (atmosphere hint)
        const horizonGeo = new THREE.RingGeometry(8, 8.02, 128);
        const horizonMat = new THREE.MeshBasicMaterial({
            color: 0x6a7080,
            transparent: true,
            opacity: 0.3,
        });
        const horizon = new THREE.Mesh(horizonGeo, horizonMat);
        horizon.rotation.x = -Math.PI / 2;
        horizon.position.y = -3;
        g.add(horizon);

        // Halo
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(4.2, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0x8090b0,
                transparent: true,
                opacity: 0.04,
                side: THREE.BackSide,
                depthWrite: false,
            })
        );
        g.add(halo);

        g.userData.type = 'sr71';
        g.userData.plane = plane;
        return g;
    }

    // 4 · AcuityIQ — neural / synaptic network (nodes + connections + pulses)
    function makeAcuityIQScene(x, y) {
        const g = new THREE.Group();
        g.position.set(x, y, -2);

        const NODE_COUNT = isMobile ? 28 : 44;
        const nodePositions = [];
        const nodes = [];

        // Scatter nodes in a spherical cloud
        for (let i = 0; i < NODE_COUNT; i++) {
            const r = 1.6 + Math.random() * 1.4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const pos = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            nodePositions.push(pos);

            const nodeGeo = new THREE.IcosahedronGeometry(0.06 + Math.random() * 0.04, 0);
            const nodeMat = new THREE.MeshBasicMaterial({
                color: 0xe0b4ff,
                transparent: true,
                opacity: 0.85,
            });
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            node.position.copy(pos);
            node.userData.baseOpacity = 0.85;
            node.userData.phase = Math.random() * Math.PI * 2;
            nodes.push(node);
            g.add(node);
        }

        // Build connections between nearby nodes
        const connections = [];
        const maxDist = 1.35;
        for (let i = 0; i < NODE_COUNT; i++) {
            for (let j = i + 1; j < NODE_COUNT; j++) {
                const d = nodePositions[i].distanceTo(nodePositions[j]);
                if (d < maxDist) {
                    connections.push({ a: i, b: j, dist: d });
                }
            }
        }

        // Draw all connections as one LineSegments mesh
        const segPos = new Float32Array(connections.length * 6);
        connections.forEach((c, idx) => {
            const pa = nodePositions[c.a];
            const pb = nodePositions[c.b];
            segPos[idx * 6] = pa.x;
            segPos[idx * 6 + 1] = pa.y;
            segPos[idx * 6 + 2] = pa.z;
            segPos[idx * 6 + 3] = pb.x;
            segPos[idx * 6 + 4] = pb.y;
            segPos[idx * 6 + 5] = pb.z;
        });
        const segGeo = new THREE.BufferGeometry();
        segGeo.setAttribute('position', new THREE.BufferAttribute(segPos, 3));
        const segMat = new THREE.LineBasicMaterial({
            color: 0xa200ff,
            transparent: true,
            opacity: 0.22,
        });
        const segs = new THREE.LineSegments(segGeo, segMat);
        g.add(segs);

        // Traveling signal pulses — bright dots that move along a random connection
        const PULSE_COUNT = isMobile ? 5 : 10;
        const pulseGeo = new THREE.BufferGeometry();
        const pulsePos = new Float32Array(PULSE_COUNT * 3);
        pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
        const pulseMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            transparent: true,
            opacity: 1,
            depthWrite: false,
        });
        const pulses = new THREE.Points(pulseGeo, pulseMat);
        g.add(pulses);

        const pulseData = [];
        for (let i = 0; i < PULSE_COUNT; i++) {
            const c = connections[Math.floor(Math.random() * connections.length)];
            pulseData.push({ conn: c, t: Math.random(), speed: 0.4 + Math.random() * 0.6 });
        }

        // Halo
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(4, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0xa200ff,
                transparent: true,
                opacity: 0.07,
                side: THREE.BackSide,
                depthWrite: false,
            })
        );
        g.add(halo);

        g.userData.type = 'acuityiq';
        g.userData.nodes = nodes;
        g.userData.connections = connections;
        g.userData.nodePositions = nodePositions;
        g.userData.pulses = pulses;
        g.userData.pulseData = pulseData;
        return g;
    }

    // 5 · Elenos — destination core: layered wireframe + particles + orbital rings
    function makeElenosScene(x, y) {
        const g = new THREE.Group();
        g.position.set(x, y, -2);

        // Inner solid sphere
        const innerGeo = new THREE.SphereGeometry(1.4, 64, 64);
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0xa200ff,
            emissive: 0xa200ff,
            emissiveIntensity: 0.9,
            roughness: 0.2,
        });
        g.add(new THREE.Mesh(innerGeo, innerMat));

        // Wireframe shell
        const shellGeo = new THREE.IcosahedronGeometry(1.8, 2);
        const shellMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.45,
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        g.add(shell);
        g.userData.shell = shell;

        // Orbital rings (3 at different tilts)
        const ringColors = [0xa200ff, 0xc466ff, 0xffffff];
        const rings = [];
        for (let i = 0; i < 3; i++) {
            const r = 2.3 + i * 0.35;
            const ringGeo = new THREE.TorusGeometry(r, 0.015, 4, 128);
            const ringMat = new THREE.MeshBasicMaterial({
                color: ringColors[i],
                transparent: true,
                opacity: 0.55 - i * 0.12,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = (Math.PI / 3) + i * 0.6;
            ring.rotation.y = i * 0.4;
            g.add(ring);
            rings.push(ring);
        }
        g.userData.rings = rings;

        // Particle cloud
        const pcount = isMobile ? 400 : 900;
        const pgeo = new THREE.BufferGeometry();
        const ppos = new Float32Array(pcount * 3);
        for (let i = 0; i < pcount; i++) {
            const r = 2.1 + Math.random() * 1.6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            ppos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            ppos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            ppos[i * 3 + 2] = r * Math.cos(phi);
        }
        pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
        const pmat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.06,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
        });
        const particles = new THREE.Points(pgeo, pmat);
        g.add(particles);
        g.userData.particles = particles;

        // Halo
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0xa200ff,
                transparent: true,
                opacity: 0.12,
                side: THREE.BackSide,
                depthWrite: false,
            })
        );
        g.add(halo);

        g.userData.type = 'elenos';
        return g;
    }

    // Build all project scenes
    const builtScenes = PROJECTS.map((p) => {
        const obj = p.make(p.x, p.y);
        scene.add(obj);
        return obj;
    });

    // ============================================
    // LIGHTS
    // ============================================
    scene.add(new THREE.AmbientLight(0x251a3a, 0.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.75);
    keyLight.position.set(8, 5, 6);
    scene.add(keyLight);

    // Fill lights — positioned at each planet's y, on the same side as the 3D object.
    // Order: ironbound(-1), sr71(-2), edthestatman(-3), alpha(-4), sheriff(-5), acuityiq(-6), elenos(-7)

    const amberFill = new THREE.PointLight(0xff9555, 2.2, 40);      // Ironbound — warm amber
    amberFill.position.set(5.5, -1 * SPACING, 3);
    scene.add(amberFill);

    const steelFill = new THREE.PointLight(0xc8d4ff, 1.5, 40);      // SR-71 — cool steel
    steelFill.position.set(-6, -2 * SPACING, 3);
    scene.add(steelFill);

    const greenFill = new THREE.PointLight(0x6effbf, 1.4, 40);      // EdTheStatMan — data green
    greenFill.position.set(5.5, -3 * SPACING, 3);
    scene.add(greenFill);

    const creamFill = new THREE.PointLight(0xd4c4a8, 1.8, 40);      // Alpha Painting — warm cream
    creamFill.position.set(-6, -4 * SPACING, 3);
    scene.add(creamFill);

    const cyanFill = new THREE.PointLight(0x00d4ff, 2, 40);          // Solana Sheriff — cyan
    cyanFill.position.set(5.5, -5 * SPACING, 3);
    scene.add(cyanFill);

    const purpleFill = new THREE.PointLight(0xa200ff, 2.5, 50);      // AcuityIQ — purple
    purpleFill.position.set(-6, -6 * SPACING, 3);
    scene.add(purpleFill);

    // ============================================
    // INTERACTION
    // ============================================
    let tmx = 0, tmy = 0, mx = 0, my = 0;
    if (!prefersReduce) {
        window.addEventListener('mousemove', (e) => {
            tmx = (e.clientX / innerWidth - 0.5) * 0.3;
            tmy = (e.clientY / innerHeight - 0.5) * 0.2;
        }, { passive: true });
    }

    function resize() {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    }
    window.addEventListener('resize', resize);

    // HUD
    const hudItems = document.querySelectorAll('.hud-item');
    const progRing = document.querySelector('.journey-progress .prog');
    const progLabel = document.querySelector('.journey-progress .label');
    const hudRoot = document.querySelector('.journey-hud');
    const progRoot = document.querySelector('.journey-progress');

    function getScrollPct() {
        const max = document.documentElement.scrollHeight - innerHeight;
        return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    }

    const startY = 2;

    // Sync camera Y to section positions so each planet is on-screen when
    // its text section is centered. Waypoints: [scrollY, cameraY] pairs.
    // Rebuild on load + resize + images loaded.
    const sectionRefs = Array.from(document.querySelectorAll('.work-section'));
    let waypoints = [];
    function rebuildWaypoints() {
        waypoints = [{ scroll: 0, y: startY }];
        sectionRefs.forEach((s, i) => {
            if (!PROJECTS[i]) return;
            const r = s.getBoundingClientRect();
            const center = r.top + window.scrollY + r.height * 0.5;
            // Scroll position where section center is at viewport center:
            const scrollAt = Math.max(0, center - innerHeight * 0.5);
            waypoints.push({ scroll: scrollAt, y: PROJECTS[i].y });
        });
    }
    rebuildWaypoints();
    window.addEventListener('load', rebuildWaypoints);
    window.addEventListener('resize', rebuildWaypoints);

    function getTargetCameraY() {
        if (!waypoints.length) return startY;
        const s = window.scrollY;
        if (s <= waypoints[0].scroll) return waypoints[0].y;
        for (let i = 0; i < waypoints.length - 1; i++) {
            const a = waypoints[i];
            const b = waypoints[i + 1];
            if (s >= a.scroll && s <= b.scroll) {
                const span = b.scroll - a.scroll || 1;
                const t = (s - a.scroll) / span;
                return a.y + (b.y - a.y) * t;
            }
        }
        return waypoints[waypoints.length - 1].y;
    }

    // ============================================
    // RENDER LOOP
    // ============================================
    const clock = new THREE.Clock();
    function tick() {
        const t = clock.getElapsedTime();
        mx += (tmx - mx) * 0.06;
        my += (tmy - my) * 0.06;

        const pct = getScrollPct();
        camera.position.x = mx * 2;
        camera.position.y = getTargetCameraY();
        camera.position.z = 11;
        camera.rotation.x = my * 0.08;
        camera.lookAt(mx * 1.5, camera.position.y - 0.5, 0);

        // Animate each scene
        builtScenes.forEach((g) => {
            const type = g.userData.type;

            if (type === 'statman') {
                // Rotate cards
                g.userData.cards.forEach((c, i) => {
                    const a = c.userData.a + t * 0.12;
                    const r = c.userData.r + Math.sin(t * 0.6 + i) * 0.08;
                    c.position.x = Math.cos(a) * r;
                    c.position.z = Math.sin(a) * r;
                    c.position.y = Math.sin(t * 0.9 + c.userData.yOff) * 0.4;
                    c.lookAt(0, c.position.y, 0);
                });
                // Animate grid heights
                if (g.userData.grid) {
                    const gd = g.userData.grid;
                    const pos = gd.mesh.geometry.attributes.position;
                    for (let i = 0; i < pos.count; i++) {
                        const h = gd.heights[i];
                        pos.setZ(i, h.base + Math.sin(t * 1.2 + h.offset) * 0.06);
                    }
                    pos.needsUpdate = true;
                }
                g.rotation.y = t * 0.04;
            } else if (type === 'alpha') {
                // Paint planet — rotate, wobble drips, drift splatter
                g.rotation.y = t * 0.08;
                g.rotation.x = Math.sin(t * 0.1) * 0.12;
                if (g.userData.ring) g.userData.ring.rotation.z = t * 0.06;
                if (g.userData.drips) {
                    g.userData.drips.forEach(d => {
                        const dd = d.userData;
                        d.rotation.z = Math.sin(t * dd.speed + dd.phase) * 0.15;
                        d.rotation.x += Math.sin(t * dd.speed * 0.7 + dd.phase) * 0.002;
                    });
                }
                if (g.userData.splatter) {
                    const sPos = g.userData.splatter.geometry.attributes.position.array;
                    const sData = g.userData.splatData;
                    for (let si = 0; si < sData.length; si++) {
                        const sd = sData[si];
                        const angle = sd.theta + t * sd.speed;
                        sPos[si*3]   = sd.r * Math.sin(sd.phi) * Math.cos(angle);
                        sPos[si*3+1] = sd.r * Math.sin(sd.phi) * Math.sin(angle);
                        sPos[si*3+2] = sd.r * Math.cos(sd.phi);
                    }
                    g.userData.splatter.geometry.attributes.position.needsUpdate = true;
                }
            } else if (type === 'sheriff') {
                // Solana planet — spinning core, fast rings, flowing particles, orbiting validators
                if (g.userData.core) {
                    g.userData.core.rotation.y = t * 0.12;
                    g.userData.core.rotation.x = Math.sin(t * 0.1) * 0.15;
                }
                if (g.userData.inner) {
                    g.userData.inner.rotation.y = -t * 0.15;
                    g.userData.inner.rotation.x = -t * 0.08;
                }
                if (g.userData.speedRings) {
                    g.userData.speedRings[0].rotation.z = t * 0.6;
                    g.userData.speedRings[1].rotation.z = -t * 0.8;
                    g.userData.speedRings[2].rotation.z = t * 0.45;
                }
                if (g.userData.txParticles) {
                    const tPos = g.userData.txParticles.geometry.attributes.position.array;
                    const tData = g.userData.txData;
                    for (let ti = 0; ti < tData.length; ti++) {
                        const td = tData[ti];
                        const a = td.angle + t * td.speed;
                        tPos[ti*3]   = Math.cos(a) * td.orbitR;
                        tPos[ti*3+1] = td.tilt + Math.sin(t * 0.8 + td.angle) * 0.2;
                        tPos[ti*3+2] = Math.sin(a) * td.orbitR;
                    }
                    g.userData.txParticles.geometry.attributes.position.needsUpdate = true;
                }
                if (g.userData.validators) {
                    g.userData.validators.forEach(v => {
                        const vd = v.userData;
                        const a = vd.angle + t * vd.speed;
                        v.position.set(
                            Math.cos(a) * vd.radius,
                            vd.yOff + Math.sin(t * 0.5 + vd.angle) * 0.25,
                            Math.sin(a) * vd.radius
                        );
                        v.rotation.x = t * 0.9;
                        v.rotation.y = t * 0.7;
                    });
                }
            } else if (type === 'ironbound') {
                if (g.userData.roof1) g.userData.roof1.rotation.y = 0.3 + Math.sin(t * 0.2) * 0.05;
                if (g.userData.roof2) g.userData.roof2.rotation.y = -0.4 - Math.cos(t * 0.25) * 0.04;
                if (g.userData.roof3) g.userData.roof3.rotation.y = 0.8 + Math.sin(t * 0.3) * 0.06;
                if (g.userData.b1) {
                    g.userData.b1.rotation.z = 0.35 + Math.sin(t * 0.3) * 0.05;
                    g.userData.b1.position.y = -1.2 + Math.sin(t * 0.4) * 0.15;
                }
                if (g.userData.b2) {
                    g.userData.b2.rotation.z = -0.25 - Math.cos(t * 0.28) * 0.04;
                    g.userData.b2.position.y = 1.3 + Math.cos(t * 0.35) * 0.12;
                }
                if (g.userData.wire) g.userData.wire.rotation.y = t * 0.05;
                g.rotation.y = Math.sin(t * 0.1) * 0.1;
            } else if (type === 'sr71') {
                // Plane drifts in place + engines pulse
                if (g.userData.plane) {
                    g.userData.plane.rotation.y = -0.2 + Math.sin(t * 0.2) * 0.05;
                    g.userData.plane.rotation.z = Math.sin(t * 0.3) * 0.03;
                    g.userData.plane.position.y = Math.sin(t * 0.5) * 0.12;
                }
                if (g.userData.engineGlow) {
                    const flicker = 0.7 + Math.sin(t * 12) * 0.2 + Math.random() * 0.15;
                    g.userData.engineGlow.forEach((glow) => {
                        glow.material.opacity = flicker;
                        glow.scale.setScalar(1 + Math.sin(t * 8) * 0.15);
                    });
                }
                // Animate contrail particles backward
                if (g.userData.trail) {
                    const pos = g.userData.trail.points.geometry.attributes.position;
                    for (let i = 0; i < g.userData.trail.data.length; i++) {
                        const d = g.userData.trail.data[i];
                        d.life += 0.015;
                        if (d.life > 1) d.life = 0;
                        pos.setX(i, -2 - d.life * 12);
                    }
                    pos.needsUpdate = true;
                }
            } else if (type === 'acuityiq') {
                g.rotation.y = t * 0.08;
                g.rotation.x = Math.sin(t * 0.07) * 0.15;

                // Node brightness flicker
                g.userData.nodes.forEach((node) => {
                    const base = node.userData.baseOpacity;
                    node.material.opacity = base + Math.sin(t * 2 + node.userData.phase) * 0.15;
                });

                // Move pulses along connections
                const pulsePos = g.userData.pulses.geometry.attributes.position;
                g.userData.pulseData.forEach((p, i) => {
                    p.t += p.speed * 0.01;
                    if (p.t >= 1) {
                        p.t = 0;
                        p.conn = g.userData.connections[Math.floor(Math.random() * g.userData.connections.length)];
                        p.speed = 0.4 + Math.random() * 0.6;
                    }
                    const a = g.userData.nodePositions[p.conn.a];
                    const b = g.userData.nodePositions[p.conn.b];
                    pulsePos.setX(i, a.x + (b.x - a.x) * p.t);
                    pulsePos.setY(i, a.y + (b.y - a.y) * p.t);
                    pulsePos.setZ(i, a.z + (b.z - a.z) * p.t);
                });
                pulsePos.needsUpdate = true;
            } else if (type === 'elenos') {
                if (g.userData.shell) {
                    g.userData.shell.rotation.y = t * 0.1;
                    g.userData.shell.rotation.x = t * 0.06;
                }
                if (g.userData.rings) {
                    g.userData.rings.forEach((r, i) => {
                        r.rotation.z += (0.004 + i * 0.002);
                    });
                }
                if (g.userData.particles) {
                    g.userData.particles.rotation.y = t * 0.05;
                    g.userData.particles.rotation.x = t * 0.03;
                }
            }
        });

        // Starfield drift
        starsFar.rotation.y = t * 0.004 + mx * 0.05;
        starsMid.rotation.y = -t * 0.008 + mx * 0.08;

        // HUD sync — active project based on proximity
        if (hudItems.length && hudRoot) {
            let activeIdx = 0;
            let bestDist = Infinity;
            PROJECTS.forEach((p, i) => {
                const d = Math.abs(p.y - camera.position.y);
                if (d < bestDist) { bestDist = d; activeIdx = i; }
            });
            hudItems.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
            if (pct > 0.01) {
                hudRoot.classList.add('visible');
                progRoot && progRoot.classList.add('visible');
            } else {
                hudRoot.classList.remove('visible');
                progRoot && progRoot.classList.remove('visible');
            }
            if (progRing) progRing.style.strokeDashoffset = String(157 - 157 * pct);
            if (progLabel) progLabel.textContent = Math.round(pct * 100).toString().padStart(2, '0');
        }

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();
})();
