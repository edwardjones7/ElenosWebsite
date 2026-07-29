// Products page — starfield + 3 floating product-themed wireframe forms with mouse parallax
(function () {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    // Size from the canvas (CSS 100lvh), not the window: mobile URL-bar
    // collapse changes innerHeight mid-scroll and would jump the fixed backdrop.
    let vw = canvas.clientWidth || innerWidth, vh = canvas.clientHeight || innerHeight;

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, vw / vh, 0.1, 2000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(vw, vh, false);
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

    // Product forms group (parallax target)
    const formsGroup = new THREE.Group();
    scene.add(formsGroup);

    const purpleWire = new THREE.MeshBasicMaterial({ color: 0xa200ff, wireframe: true, transparent: true, opacity: 0.45 });
    const violetWire = new THREE.MeshBasicMaterial({ color: 0xc466ff, wireframe: true, transparent: true, opacity: 0.4 });
    const dimWire = new THREE.MeshBasicMaterial({ color: 0x8a00d6, wireframe: true, transparent: true, opacity: 0.35 });

    // AcuityIQ — wireframe icosahedron (brain / intelligence)
    const brain = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), purpleWire);
    brain.position.set(4, 2.5, -5);
    formsGroup.add(brain);
    // Inner glow
    const brainHalo = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xa200ff, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false }));
    brain.add(brainHalo);

    // Assistant+ — torus knot (complex, interconnected, agent-like)
    const agent = new THREE.Mesh(new THREE.TorusKnotGeometry(0.75, 0.28, 64, 8, 2, 3), violetWire);
    agent.position.set(-4.5, -2, -6);
    formsGroup.add(agent);
    const agentHalo = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xc466ff, transparent: true, opacity: 0.035, side: THREE.BackSide, depthWrite: false }));
    agent.add(agentHalo);

    // EmailAuto — cone tilted (paper plane feel)
    const mail = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 4), dimWire);
    mail.position.set(5, -6, -5);
    mail.rotation.z = Math.PI / 5;
    mail.rotation.x = -0.3;
    formsGroup.add(mail);
    const mailHalo = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), new THREE.MeshBasicMaterial({ color: 0x8a00d6, transparent: true, opacity: 0.03, side: THREE.BackSide, depthWrite: false }));
    mail.add(mailHalo);

    const forms = [
        { mesh: brain, spinX: 0.15, spinY: 0.2, bobAmp: 0.3, bobSpeed: 0.4, bobPhase: 0 },
        { mesh: agent, spinX: -0.12, spinY: 0.18, bobAmp: 0.25, bobSpeed: 0.35, bobPhase: 2 },
        { mesh: mail, spinX: 0.1, spinY: -0.22, bobAmp: 0.2, bobSpeed: 0.5, bobPhase: 4 },
    ];

    // Mouse
    let tmx = 0, tmy = 0, mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
        tmx = (e.clientX / innerWidth - 0.5) * 0.6;
        tmy = (e.clientY / innerHeight - 0.5) * 0.4;
    }, { passive: true });

    function resize() {
        const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
        if (w === vw && h === vh) return;
        vw = w; vh = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    function tick() {
        const t = clock.getElapsedTime();
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;

        // Rotate + bob each form
        forms.forEach(f => {
            f.mesh.rotation.x += f.spinX * 0.008;
            f.mesh.rotation.y += f.spinY * 0.008;
            f.mesh.position.y += Math.sin(t * f.bobSpeed + f.bobPhase) * 0.002;
        });

        // Parallax on forms group
        formsGroup.position.x = mx * 0.7;
        formsGroup.position.y = -my * 0.5;

        // Stars + camera
        starsFar.rotation.y = t * 0.006 + mx * 0.15;
        starsMid.rotation.y = -t * 0.01 + mx * 0.2;
        camera.position.x = mx * 0.3;
        camera.position.y = -my * 0.2 + window.scrollY * 0.002;
        camera.lookAt(0, camera.position.y * 0.3, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();
})();
