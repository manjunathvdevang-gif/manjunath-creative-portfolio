
import * as THREE from 'three';

export function createCorridor(container) {

    // 1. Create the scene
    const scene = new THREE.Scene();

    scene.background = new THREE.Color('#e9e3d5');

    // 2. Create the camera
    const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    camera.position.set(0, 2.3, 8);
    camera.lookAt(0, 2, -7);

    // 3. Create the renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // 4. Materials
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: '#eee8d9',
        roughness: 1
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        color: '#c9bfae',
        roughness: 1
    });

    const doorMaterial = new THREE.MeshStandardMaterial({
        color: '#a58b68',
        roughness: 1
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: '#514536'
    });

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(
        '#ffffff',
        2
    );

    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
        '#fff1d6',
        2
    );

    directionalLight.position.set(2, 8, 5);
    scene.add(directionalLight);

    // Helper to create corridor geometry
    function addBox(width, height, depth, material, x, y, z) {

        const geometry = new THREE.BoxGeometry(
            width,
            height,
            depth
        );

        const mesh = new THREE.Mesh(
            geometry,
            material
        );

        mesh.position.set(x, y, z);
        scene.add(mesh);

        // Sketch-like outlines
        const edges = new THREE.EdgesGeometry(geometry);

        const outline = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
                color: '#675d4e',
                transparent: true,
                opacity: 0.65
            })
        );

        outline.position.copy(mesh.position);
        scene.add(outline);

        return mesh;
    }

    // 6. Corridor floor
    addBox(
        8, 0.2, 25,
        floorMaterial,
        0, -0.1, -7
    );

    // 7. Corridor ceiling
    addBox(
        8, 0.2, 25,
        wallMaterial,
        0, 5, -7
    );

    // 8. Left wall
    addBox(
        0.2, 5, 25,
        wallMaterial,
        -4, 2.5, -7
    );

    // 9. Right wall
    addBox(
        0.2, 5, 25,
        wallMaterial,
        4, 2.5, -7
    );

    // 10. Create doors
    function createDoor(side, zPosition, label) {

        const xPosition = side === 'left' ? -3.85 : 3.85;

        // Door frame
        addBox(
            0.18, 3.4, 1.9,
            darkMaterial,
            xPosition, 1.8, zPosition
        );

        // Door panel
        addBox(
            0.12, 3.1, 1.6,
            doorMaterial,
            side === 'left' ? -3.72 : 3.72,
            1.75,
            zPosition
        );

        // Door knob
        const knobGeometry = new THREE.SphereGeometry(
            0.09, 12, 12
        );

        const knob = new THREE.Mesh(
            knobGeometry,
            darkMaterial
        );

        knob.position.set(
            side === 'left' ? -3.58 : 3.58,
            1.5,
            zPosition
        );

        scene.add(knob);
    }

    // Six doors
    createDoor('left', -1, 'ABOUT');
    createDoor('right', -1, 'SKILLS');

    createDoor('left', -7, 'PROJECTS');
    createDoor('right', -7, 'CONTACT');

    createDoor('left', -13, 'MORE');
    createDoor('right', -13, 'EXTRA');

    // 11. Floor perspective lines
    const gridMaterial = new THREE.LineBasicMaterial({
        color: '#8d806d',
        transparent: true,
        opacity: 0.35
    });

    for (let z = 4; z >= -19; z -= 2) {

        const points = [
            new THREE.Vector3(-3.9, 0.015, z),
            new THREE.Vector3(3.9, 0.015, z)
        ];

        const geometry = new THREE.BufferGeometry()
            .setFromPoints(points);

        scene.add(
            new THREE.Line(geometry, gridMaterial)
        );
    }

    // 12. Animation loop
    let animationId;

    function animate() {

        animationId = requestAnimationFrame(animate);

        renderer.render(scene, camera);
    }

    animate();

    // 13. Responsive resizing
    function handleResize() {

        const width = container.clientWidth;
        const height = container.clientHeight;

        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup
    return function cleanup() {

        cancelAnimationFrame(animationId);

        window.removeEventListener('resize', handleResize);

        renderer.dispose();

        container.removeChild(renderer.domElement);
    };
}
