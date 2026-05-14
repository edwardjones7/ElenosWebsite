// Services page — starfield + 4 orbiting wireframe shapes with mouse parallax
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
    scene.add(makeStars(isMobile ? 1500 : 3000, 500, 0.45, 0.7, 0xffffff));
    scene.add(makeStars(isMobile ? 700 : 1400, 200, 0.7, 0.55, 0xd8c4ff));

    // 4 orbiting shapes
    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(4, 0.5, -6);
    scene.add(orbitGroup);

    const wireMat = new THREE.MeshBasicMaterial({ color: 0xa200ff, wireframe: true, transparent: true, opacity: 0.5 });
    const wireMat2 = new THREE.MeshBasicMaterial({ color: 0xc466ff, wireframe: true, transparent: true, opacity: 0.4 });

    const shapes = [
        { mesh: new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), wireMat), phase: 0, spinX: 0.4, spinY: 0.6 },
        { mesh: new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), wireMat2), phase: Math.PI / 2, spinX: 0.3, spinY: -0.5 },
        { mesh: new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 8, 24), wireMat), phase: Math.PI, spinX: -0.5, spinY: 0.3 },
        { mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.7), wireMat2), phase: Math.PI * 1.5, spinX: 0.35, spinY: 0.45 },
    ];
    const ORBIT_R = 2.4;
    shapes.forEach(s => orbitGroup.add(s.mesh));

    // Halos per shape
    shapes.forEach(s => {
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xa200ff, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })
        );
        s.mesh.add(halo);
    });

    // Mouse
    let tmx = 0, tmy = 0, mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
        tmx = (e.clientX / innerWidth - 0.5) * 0.7;
        tmy = (e.clientY / innerHeight - 0.5) * 0.5;
    }, { passive: true });

    function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    function tick() {
        const t = clock.getElapsedTime();
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;

        // Orbit shapes
        shapes.forEach((s, i) => {
            const a = t * 0.25 + s.phase;
            s.mesh.position.set(Math.cos(a) * ORBIT_R, Math.sin(a * 0.7) * 0.6, Math.sin(a) * ORBIT_R);
            s.mesh.rotation.x = t * s.spinX;
            s.mesh.rotation.y = t * s.spinY;
        });

        // Mouse parallax on the orbit group
        orbitGroup.position.x = 4 + mx * 0.8;
        orbitGroup.position.y = 0.5 - my * 0.6;

        // Camera
        camera.position.x = mx * 0.3;
        camera.position.y = -my * 0.2 + window.scrollY * 0.002;
        camera.lookAt(0, camera.position.y * 0.3, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();
})();
