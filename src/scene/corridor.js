
import * as THREE from 'three';
import gsap from 'gsap';

export function createCorridor(container) {

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e3d5');

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    camera.position.set(0, 2.3, 8);

    const originalPosition = camera.position.clone();
    const originalTarget = new THREE.Vector3(0, 2, -7);

    let currentTarget = originalTarget.clone();

    camera.lookAt(currentTarget);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: true
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

   
    // 4. Generate hand-drawn paper textures

    function createSketchTexture(baseColor, isWood = false) {

        const canvas = document.createElement('canvas');

        canvas.width = 512;
        canvas.height = 512;

        const ctx = canvas.getContext('2d');

        // Paper background
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        // Random paper grain
        for (let i = 0; i < 18000; i++) {

            const x = Math.random() * 512;
            const y = Math.random() * 512;

            ctx.fillStyle = `rgba(80, 65, 45, ${Math.random() * 0.08})`;

            ctx.fillRect(x, y, 1.5, 1.5);
        }

        // Pencil strokes
        for (let i = 0; i < 100; i++) {

            const x = Math.random() * 512;
            const y = Math.random() * 512;

            ctx.strokeStyle = 'rgba(70, 55, 40, 0.12)';
            ctx.lineWidth = 0.7;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + (isWood ? 35 : 15),
                y + (isWood ? 2 : 5)
            );

            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);

        texture.colorSpace = THREE.SRGBColorSpace;

        return texture;
    }

    // 5. Textured materials

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: createSketchTexture('#eee8d9'),
        roughness: 1
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        map: createSketchTexture('#c9bfae'),
        roughness: 1
    });

    const doorMaterial = new THREE.MeshStandardMaterial({
        map: createSketchTexture('#a58b68', true),
        roughness: 1
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: '#514536',
        roughness: 1
    });


    // 5. Lighting
    scene.add(
        new THREE.AmbientLight('#ffffff', 2)
    );

    const directionalLight = new THREE.DirectionalLight(
        '#fff1d6',
        2
    );

    directionalLight.position.set(2, 8, 5);
    scene.add(directionalLight);

    // 6. Geometry helper
    function addBox(width, height, depth, material, x, y, z) {

        const geometry = new THREE.BoxGeometry(
            width,
            height,
            depth
        );

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(x, y, z);
        scene.add(mesh);

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

    // 7. Corridor structure
    addBox(8, 0.2, 25, floorMaterial, 0, -0.1, -7);

    addBox(8, 0.2, 25, wallMaterial, 0, 5, -7);

    addBox(0.2, 5, 25, wallMaterial, -4, 2.5, -7);

    addBox(0.2, 5, 25, wallMaterial, 4, 2.5, -7);

    // 8. Interactive doors
    const interactiveDoors = [];

    // Create a text label texture for each door

    function createDoorLabel(text) {

        const canvas = document.createElement('canvas');

        canvas.width = 512;
        canvas.height = 128;

        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 512, 128);

        ctx.fillStyle = '#f0e6d3';
        ctx.fillRect(0, 0, 512, 128);

        ctx.strokeStyle = '#514536';
        ctx.lineWidth = 5;
        ctx.strokeRect(8, 8, 496, 112);

        ctx.fillStyle = '#393329';
        ctx.font = 'bold 46px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(text.toUpperCase(), 256, 64);

        const texture = new THREE.CanvasTexture(canvas);

        texture.colorSpace = THREE.SRGBColorSpace;

        return texture;
    }

    // Create illustrated doors

    function createDoor(side, zPosition, label, page) {

        const isLeft = side === 'left';

        const xPosition = isLeft ? -3.72 : 3.72;

        // Door frame
        addBox(
            0.18, 3.4, 1.9,
            darkMaterial,
            isLeft ? -3.85 : 3.85,
            1.8,
            zPosition
        );

        // Individual door material
        const individualDoorMaterial = doorMaterial.clone();

        individualDoorMaterial.emissive = new THREE.Color('#000000');
        individualDoorMaterial.emissiveIntensity = 0;

        // Door panel
        const door = addBox(
            0.12, 3.1, 1.6,
            individualDoorMaterial,
            xPosition,
            1.75,
            zPosition
        );

        door.userData = {
            label,
            page,
            side,
            zPosition
        };

        interactiveDoors.push(door);

        // Door label
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: createDoorLabel(label),
            transparent: true,
            side: THREE.DoubleSide
        });

        const labelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1.1, 0.28),
            labelMaterial
        );

        labelMesh.rotation.y = isLeft
            ? Math.PI / 2
            : -Math.PI / 2;

        labelMesh.position.set(
            isLeft ? -3.645 : 3.645,
            2.3,
            zPosition
        );

        scene.add(labelMesh);

        // Door handle
        const knobGeometry = new THREE.SphereGeometry(
            0.09, 16, 16
        );

        const knobMaterial = new THREE.MeshStandardMaterial({
            color: '#b58b4b',
            metalness: 0.5,
            roughness: 0.4
        });

        const knob = new THREE.Mesh(
            knobGeometry,
            knobMaterial
        );

        knob.position.set(
            isLeft ? -3.58 : 3.58,
            1.5,
            zPosition
        );

        scene.add(knob);
    }


    createDoor('left', -1, 'About', 'about.html');
    createDoor('right', -1, 'Skills', 'skills.html');

    createDoor('left', -7, 'Projects', 'projects.html');
    createDoor('right', -7, 'Contact', 'contact.html');

    createDoor('left', -13, 'More', 'index.html');
    createDoor('right', -13, 'Explore', 'index.html');

    // 9. Floor perspective lines
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

        scene.add(new THREE.Line(geometry, gridMaterial));
    }

    // 10. Raycasting for mouse interaction
    const raycaster = new THREE.Raycaster();

    const pointer = new THREE.Vector2();

    const status = document.getElementById('scene-status');

    const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let animationId;
    let transitionActive = false;
    let returnTween;

    function getDoorFromPointer(event) {

        const rect = renderer.domElement.getBoundingClientRect();

        pointer.x = (
            (event.clientX - rect.left) / rect.width
        ) * 2 - 1;

        pointer.y = -(
            (event.clientY - rect.top) / rect.height
        ) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const hits = raycaster.intersectObjects(
            interactiveDoors,
            false
        );

        return hits.length ? hits[0].object : null;
    }

    // 11. Hover interaction
  
    let hoveredDoor = null;

    function handlePointerMove(event) {

        const door = getDoorFromPointer(event);

        renderer.domElement.style.cursor = door
            ? 'pointer'
            : 'default';

        // Remove highlight from previous door
        if (hoveredDoor && hoveredDoor !== door) {

            gsap.to(hoveredDoor.material, {
                emissiveIntensity: 0,
                duration: 0.25
            });
        }

        // Highlight currently hovered door
        if (door && door !== hoveredDoor) {

            gsap.to(door.material, {
                emissive: new THREE.Color('#d5a45b'),
                emissiveIntensity: 0.45,
                duration: 0.25
            });
        }

        hoveredDoor = door;
    }


    // 12. GSAP camera transition
    function focusOnDoor(door) {

        if (!door || transitionActive) return;

        const { label, side, zPosition } = door.userData;

        if (status) {
            status.textContent =
                `You selected ${label}. Use the navigation menu to open this section.`;
        }

        // Respect reduced-motion preferences
        if (reducedMotion) return;

        transitionActive = true;

        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(currentTarget);
        returnTween?.kill();

        const sideDirection = side === 'left' ? -1 : 1;

        const destinationPosition = new THREE.Vector3(
            sideDirection * 2.4,
            2.1,
            zPosition + 2.4
        );

        const destinationTarget = new THREE.Vector3(
            sideDirection * 3.7,
            1.8,
            zPosition
        );

        const move = gsap.to(camera.position, {
            x: destinationPosition.x,
            y: destinationPosition.y,
            z: destinationPosition.z,
            duration: 1.2,
            ease: 'power3.inOut',
            onUpdate: () => camera.lookAt(currentTarget)
        });

        gsap.to(currentTarget, {
            x: destinationTarget.x,
            y: destinationTarget.y,
            z: destinationTarget.z,
            duration: 1.2,
            ease: 'power3.inOut',
            onUpdate: () => camera.lookAt(currentTarget),
            onComplete: () => {

                returnTween = gsap.to(camera.position, {
                    x: originalPosition.x,
                    y: originalPosition.y,
                    z: originalPosition.z,
                    duration: 1.2,
                    delay: 0.7,
                    ease: 'power3.inOut',
                    onUpdate: () => camera.lookAt(currentTarget),
                    onComplete: () => {

                        gsap.to(currentTarget, {
                            x: originalTarget.x,
                            y: originalTarget.y,
                            z: originalTarget.z,
                            duration: 1,
                            ease: 'power2.inOut',
                            onUpdate: () => camera.lookAt(currentTarget),
                            onComplete: () => {
                                transitionActive = false;
                            }
                        });

                    }
                });

            }
        });
    }

    // 13. Click interaction
    function handlePointerDown(event) {

        const door = getDoorFromPointer(event);

        if (door) {
            focusOnDoor(door);
        }
    }

    renderer.domElement.addEventListener(
        'pointermove',
        handlePointerMove
    );

    renderer.domElement.addEventListener(
        'pointerdown',
        handlePointerDown
    );

    // 14. Animation loop
    function animate() {

        animationId = requestAnimationFrame(animate);

        renderer.render(scene, camera);
    }

    animate();

    // 15. Responsive resizing
    function handleResize() {

        const width = container.clientWidth;
        const height = container.clientHeight;

        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);

    // 16. Cleanup
    return function cleanup() {

        cancelAnimationFrame(animationId);

        returnTween?.kill();

        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(currentTarget);

        window.removeEventListener('resize', handleResize);

        renderer.domElement.removeEventListener(
            'pointermove',
            handlePointerMove
        );

        renderer.domElement.removeEventListener(
            'pointerdown',
            handlePointerDown
        );

        renderer.dispose();

        container.removeChild(renderer.domElement);
    };
}
