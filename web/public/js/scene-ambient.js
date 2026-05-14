// Ambient starfield backdrop for interior pages (services, about, contact, products)
(function () {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    function makeStars(count, spread, size, opacity, color) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = spread * 0.4 + Math.random() * spread;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return new THREE.Points(
            geo,
            new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false })
        );
    }

    const starsFar = makeStars(isMobile ? 1500 : 3000, 500, 0.45, 0.7, 0xffffff);
    const starsMid = makeStars(isMobile ? 700 : 1400, 200, 0.7, 0.55, 0xd8c4ff);
    scene.add(starsFar);
    scene.add(starsMid);

    // subtle distant purple nebula (large, faint)
    const nebulaGeo = new THREE.SphereGeometry(80, 32, 32);
    const nebulaMat = new THREE.MeshBasicMaterial({
        color: 0xa200ff,
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
        depthWrite: false,
    });
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebula.position.set(-40, -10, -60);
    scene.add(nebula);

    let tmx = 0, tmy = 0, mx = 0, my = 0;
    if (!prefersReduce) {
        window.addEventListener('mousemove', (e) => {
            tmx = (e.clientX / innerWidth - 0.5) * 0.15;
            tmy = (e.clientY / innerHeight - 0.5) * 0.1;
        }, { passive: true });
    }

    function resize() {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    }
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    function tick() {
        const t = clock.getElapsedTime();
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;

        starsFar.rotation.y = t * 0.006 + mx * 0.3;
        starsFar.rotation.x = my * 0.2;
        starsMid.rotation.y = -t * 0.01 + mx * 0.4;

        camera.position.x = mx * 2;
        camera.position.y = -my * 1.5 + window.scrollY * 0.002;
        camera.lookAt(0, camera.position.y * 0.4, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();
})();
