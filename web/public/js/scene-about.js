// About page — starfield + orbiting torus knot with mouse parallax
(function () {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Starfield
    function makeStars(count, spread, size, opacity, color) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = spread * 0.4 + Math.random() * spread;
            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(Math.random() * 2 - 1);
            pos[i*3] = r*Math.sin(p)*Math.cos(t);
            pos[i*3+1] = r*Math.sin(p)*Math.sin(t);
            pos[i*3+2] = r*Math.cos(p);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return new THREE.Points(geo, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false }));
    }
    const starsFar = makeStars(isMobile ? 1500 : 3000, 500, 0.45, 0.7, 0xffffff);
    const starsMid = makeStars(isMobile ? 700 : 1400, 200, 0.7, 0.55, 0xd8c4ff);
    scene.add(starsFar);
    scene.add(starsMid);

    // ============================================
    // TORUS KNOT — wireframe + orbiting particles
    // ============================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(5, 0, -4);
    scene.add(coreGroup);

    // Main torus knot — wireframe only
    const knotGeo = new THREE.TorusKnotGeometry(1.4, 0.35, 128, 16, 2, 3);
    const knotWire = new THREE.Mesh(knotGeo, new THREE.MeshBasicMaterial({
        color: 0xa200ff,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
    }));
    coreGroup.add(knotWire);

    // Second knot — slightly larger, different color, counter-rotates
    const knotGeo2 = new THREE.TorusKnotGeometry(1.5, 0.2, 96, 12, 3, 5);
    const knotWire2 = new THREE.Mesh(knotGeo2, new THREE.MeshBasicMaterial({
        color: 0xc466ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
    }));
    coreGroup.add(knotWire2);

    // Inner glow sphere
    const glowGeo = new THREE.SphereGeometry(1.0, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xa200ff,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    coreGroup.add(glow);

    // Outer halo
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xa200ff,
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
        depthWrite: false,
    });
    coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(3.0, 24, 24), haloMat));

    // Orbiting particles — scattered around the knot path
    const particleCount = isMobile ? 300 : 700;
    const particleGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const particleData = [];
    for (let i = 0; i < particleCount; i++) {
        const r = 1.2 + Math.random() * 2.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pPos[i*3+2] = r * Math.cos(phi);
        particleData.push({
            r,
            theta,
            phi,
            speed: 0.15 + Math.random() * 0.4,
            drift: Math.random() * Math.PI * 2,
        });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0xd98aff,
        size: 0.06,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particles);

    // ============================================
    // INTERACTION
    // ============================================
    let tmx = 0, tmy = 0, mx = 0, my = 0;
    let velX = 0, velY = 0, lastMx = 0, lastMy = 0;
    window.addEventListener('mousemove', (e) => {
        tmx = (e.clientX / innerWidth - 0.5) * 0.8;
        tmy = (e.clientY / innerHeight - 0.5) * 0.6;
    }, { passive: true });

    function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    function tick() {
        const t = clock.getElapsedTime();
        mx += (tmx - mx) * 0.06;
        my += (tmy - my) * 0.06;

        // Track velocity for reactive bursts
        velX = mx - lastMx;
        velY = my - lastMy;
        lastMx = mx;
        lastMy = my;
        const vel = Math.hypot(velX, velY);

        // Knot 1 — continuous rotation + mouse tilt
        knotWire.rotation.x = t * 0.25 + my * 1.2;
        knotWire.rotation.y = t * 0.35 + mx * 1.4;
        knotWire.rotation.z = t * 0.15;

        // Knot 2 — counter-rotates, offset phase
        knotWire2.rotation.x = -t * 0.2 + my * 0.9;
        knotWire2.rotation.y = -t * 0.28 + mx * 1.1;
        knotWire2.rotation.z = -t * 0.12;

        // Breathing scale on the knots
        const breath = 1 + Math.sin(t * 0.6) * 0.06;
        const breath2 = 1 + Math.sin(t * 0.5 + 1.5) * 0.08;
        knotWire.scale.setScalar(breath + vel * 8);
        knotWire2.scale.setScalar(breath2 + vel * 6);

        // Opacity reacts to velocity
        knotWire.material.opacity = 0.35 + vel * 12;
        knotWire2.material.opacity = 0.18 + vel * 8;

        // Glow pulses
        glowMat.opacity = 0.06 + Math.sin(t * 0.8) * 0.03 + vel * 15;

        // Animate orbiting particles
        const posArr = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const d = particleData[i];
            const angle = d.theta + t * d.speed;
            const bobble = Math.sin(t * d.speed * 2 + d.drift) * 0.15;
            posArr[i*3]   = d.r * Math.sin(d.phi) * Math.cos(angle) + bobble;
            posArr[i*3+1] = d.r * Math.sin(d.phi) * Math.sin(angle) + bobble * 0.7;
            posArr[i*3+2] = d.r * Math.cos(d.phi) + bobble * 0.5;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Core group — mouse parallax + gentle float
        coreGroup.rotation.y = t * 0.08 + mx * 0.6;
        coreGroup.rotation.x = Math.sin(t * 0.1) * 0.15 + my * 0.5;
        coreGroup.position.x = 5 + mx * 1.8;
        coreGroup.position.y = -my * 1.4 + Math.sin(t * 0.3) * 0.3;

        // Stars + camera
        starsFar.rotation.y = t * 0.006 + mx * 0.2;
        starsMid.rotation.y = -t * 0.01 + mx * 0.25;
        camera.position.x = mx * 0.5;
        camera.position.y = -my * 0.35 + window.scrollY * 0.002;
        camera.lookAt(0, camera.position.y * 0.3, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();
})();
