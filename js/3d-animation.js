// BackTrack - Floating Glass 3D Animation (Three.js)
// "Premium/Apple-like" Aesthetic - Frosted Glass Geometries

(function () {
    const container = document.querySelector('.hero-visual');
    if (!container) return; // Guard clause

    // Clear any existing canvas
    container.innerHTML = '';

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 15;

    // Renderer (Transparent background)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // High DPI support

    // Enable Physically Correct Lighting
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;

    container.appendChild(renderer.domElement);

    // --- Materials (Frosted Glass) ---
    // Using MeshPhysicalMaterial for transmission (glass) effect
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.2, // Frosted look
        transmission: 0.9, // Glass transparency
        thickness: 1.5, // Refraction thickness
        envMapIntensity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transparent: true
    });

    const accentMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x2563eb, // Primary Blue
        metalness: 0.2,
        roughness: 0.2,
        transmission: 0.6,
        thickness: 1.0,
        transparent: true,
        emissive: 0x2563eb,
        emissiveIntensity: 0.2
    });

    // --- Geometries ---
    const objects = [];

    // 1. The Cube (Represents the "Item")
    const cubeGeo = new THREE.BoxGeometry(3, 3, 3);
    const cube = new THREE.Mesh(cubeGeo, glassMaterial);
    cube.position.set(-2, 1, 0);
    cube.rotation.set(0.5, 0.5, 0);
    scene.add(cube);
    objects.push(cube);

    // 2. The Sphere (Represents the "World/System")
    const sphereGeo = new THREE.SphereGeometry(2, 64, 64);
    const sphere = new THREE.Mesh(sphereGeo, accentMaterial);
    sphere.position.set(2, -1, 1);
    scene.add(sphere);
    objects.push(sphere);

    // 3. The Ring/Torus (Represents "Search/Focus")
    const torusGeo = new THREE.TorusGeometry(3.5, 0.1, 16, 100);
    const torus = new THREE.Mesh(torusGeo, new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.8,
        roughness: 0.4,
        metalness: 0.8
    }));
    torus.rotation.x = Math.PI / 2;
    torus.rotation.y = -0.3;
    scene.add(torus);
    objects.push(torus);

    // --- Lighting (Crucial for Glass) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight1 = new THREE.PointLight(0x2563eb, 3, 20); // Blue Glow
    pointLight1.position.set(-5, 0, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 3, 20); // Cyan Glow
    pointLight2.position.set(5, 5, 5);
    scene.add(pointLight2);

    // --- Interaction (Mouse Parallax) ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        mouseX = (event.clientX - windowHalfX) * 0.001; // Scale down
        mouseY = (event.clientY - windowHalfY) * 0.001;
    };

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.addEventListener('mousemove', handleMouseMove);
    }

    // --- Responsive ---
    const handleResize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Gentle Floating Rotation
        cube.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2 + 0.5;
        cube.rotation.y += 0.005;

        sphere.position.y = -1 + Math.sin(elapsedTime * 0.5) * 0.5;

        torus.rotation.z += 0.002;
        torus.rotation.x = Math.PI / 2 + Math.sin(elapsedTime * 0.2) * 0.1;

        // Mouse Parallax (Ease to target)
        targetX = mouseX;
        targetY = mouseY;

        // Apply parallax to whole scene group or camera? Let's rotate the camera slightly
        camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    };

    animate();

})();
