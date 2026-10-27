// ===== THREE.JS PORTFOLIO SCENE =====
// Organic particle system + interactive geometry for hero section

(function () {
    'use strict';

    // Wait for Three.js to load
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded yet');
        return;
    }

    // ===== CONFIGURATION =====
    const CONFIG = {
        particles: {
            count: 800,
            size: 2.5,
            speed: 0.0003,
            mouseInfluence: 0.00025,
            connectionDistance: 120,
            maxConnections: 3,
            colors: ['#8A9A5B', '#A4C3B2', '#C1D0B5', '#E2725B', '#F4A261', '#D4D8C8']
        },
        geometry: {
            count: 6,
            minSize: 0.8,
            maxSize: 2.5,
            rotationSpeed: 0.002
        },
        camera: {
            fov: 60,
            near: 0.1,
            far: 1000,
            z: 50
        }
    };

    // ===== HERO PARTICLE SCENE =====
    class HeroScene {
        constructor() {
            this.container = document.getElementById('hero-canvas');
            if (!this.container) return;

            this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
            this.clock = new THREE.Clock();
            this.particles = [];
            this.floatingShapes = [];
            this.isVisible = true;

            this.init();
            this.createParticles();
            this.createFloatingShapes();
            // this.createConnectionLines(); // Disabled per user request
            this.addEventListeners();
            this.animate();
        }

        init() {
            // Renderer
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            this.container.appendChild(this.renderer.domElement);

            // Scene
            this.scene = new THREE.Scene();

            // Camera
            this.camera = new THREE.PerspectiveCamera(
                CONFIG.camera.fov,
                window.innerWidth / window.innerHeight,
                CONFIG.camera.near,
                CONFIG.camera.far
            );
            this.camera.position.z = CONFIG.camera.z;

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);

            const pointLight = new THREE.PointLight(0x8A9A5B, 1, 100);
            pointLight.position.set(10, 10, 20);
            this.scene.add(pointLight);

            const pointLight2 = new THREE.PointLight(0xE2725B, 0.6, 80);
            pointLight2.position.set(-15, -10, 15);
            this.scene.add(pointLight2);
        }

        createParticles() {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(CONFIG.particles.count * 3);
            const colors = new Float32Array(CONFIG.particles.count * 3);
            const sizes = new Float32Array(CONFIG.particles.count);
            const velocities = [];

            const colorPalette = CONFIG.particles.colors.map(c => new THREE.Color(c));

            for (let i = 0; i < CONFIG.particles.count; i++) {
                const i3 = i * 3;

                // Spread particles across the viewport
                positions[i3] = (Math.random() - 0.5) * 80;
                positions[i3 + 1] = (Math.random() - 0.5) * 60;
                positions[i3 + 2] = (Math.random() - 0.5) * 30;

                // Random color from palette
                const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;

                sizes[i] = Math.random() * CONFIG.particles.size + 0.5;

                velocities.push({
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.01
                });
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            // Custom shader material for soft glowing particles
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    varying float vAlpha;
                    uniform float uTime;
                    uniform float uPixelRatio;
                    
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        float dist = length(mvPosition.xyz);
                        vAlpha = smoothstep(60.0, 10.0, dist) * 0.8;
                        gl_PointSize = size * uPixelRatio * (30.0 / -mvPosition.z);
                        gl_PointSize = max(gl_PointSize, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    varying float vAlpha;
                    
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        if (dist > 0.5) discard;
                        
                        float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
                        float glow = exp(-dist * 4.0) * 0.5;
                        
                        gl_FragColor = vec4(vColor + glow, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            this.particleSystem = new THREE.Points(geometry, material);
            this.scene.add(this.particleSystem);
            this.particleVelocities = velocities;
        }

        createFloatingShapes() {
            const shapes = [
                new THREE.IcosahedronGeometry(1, 78),
                new THREE.OctahedronGeometry(1, 0),
                new THREE.TetrahedronGeometry(1, 0),
                new THREE.DodecahedronGeometry(1, 0),
                new THREE.TorusGeometry(0.7, 0.3, 8, 16),
                new THREE.TorusKnotGeometry(0.6, 0.2, 64, 8, 2, 3)
            ];

            const positions = [
                { x: -25, y: 12, z: -10 },
                { x: 28, y: -8, z: -15 },
                { x: -18, y: -15, z: -8 },
                { x: 22, y: 18, z: -12 },
                { x: -30, y: 0, z: -20 },
                { x: 15, y: -20, z: -5 }
            ];

            for (let i = 0; i < CONFIG.geometry.count; i++) {
                const scale = CONFIG.geometry.minSize + Math.random() * (CONFIG.geometry.maxSize - CONFIG.geometry.minSize);
                const colorHex = CONFIG.particles.colors[i % CONFIG.particles.colors.length];

                const material = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color(colorHex),
                    transparent: true,
                    opacity: 0.15,
                    wireframe: true,
                    wireframeLinewidth: 1,
                    roughness: 0.5,
                    metalness: 0.1
                });

                const mesh = new THREE.Mesh(shapes[i], material);
                mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
                mesh.scale.setScalar(scale);

                mesh.userData = {
                    rotationSpeed: {
                        x: (Math.random() - 0.5) * CONFIG.geometry.rotationSpeed,
                        y: (Math.random() - 0.5) * CONFIG.geometry.rotationSpeed,
                        z: (Math.random() - 0.5) * CONFIG.geometry.rotationSpeed
                    },
                    floatSpeed: 0.3 + Math.random() * 0.5,
                    floatAmplitude: 1 + Math.random() * 2,
                    originalY: positions[i].y,
                    phase: Math.random() * Math.PI * 2
                };

                this.scene.add(mesh);
                this.floatingShapes.push(mesh);
            }
        }

        createConnectionLines() {
            // Line material for connections  
            this.lineMaterial = new THREE.LineBasicMaterial({
                color: 0x8A9A5B,
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending
            });

            this.lineGeometry = new THREE.BufferGeometry();
            const linePositions = new Float32Array(CONFIG.particles.count * CONFIG.particles.maxConnections * 6);
            this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
            this.lineGeometry.setDrawRange(0, 0);

            this.connectionLines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
            this.scene.add(this.connectionLines);
        }

        updateConnections() {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const linePositions = this.lineGeometry.attributes.position.array;
            let lineIndex = 0;
            const maxLines = CONFIG.particles.count * CONFIG.particles.maxConnections;

            // Only check a subset for performance
            const step = 4;
            for (let i = 0; i < CONFIG.particles.count; i += step) {
                let connections = 0;
                const i3 = i * 3;
                const x1 = positions[i3];
                const y1 = positions[i3 + 1];
                const z1 = positions[i3 + 2];

                for (let j = i + step; j < CONFIG.particles.count && connections < CONFIG.particles.maxConnections; j += step) {
                    const j3 = j * 3;
                    const dx = positions[j3] - x1;
                    const dy = positions[j3 + 1] - y1;
                    const dz = positions[j3 + 2] - z1;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < CONFIG.particles.connectionDistance * 0.15) {
                        if (lineIndex * 6 + 5 < linePositions.length) {
                            linePositions[lineIndex * 6] = x1;
                            linePositions[lineIndex * 6 + 1] = y1;
                            linePositions[lineIndex * 6 + 2] = z1;
                            linePositions[lineIndex * 6 + 3] = positions[j3];
                            linePositions[lineIndex * 6 + 4] = positions[j3 + 1];
                            linePositions[lineIndex * 6 + 5] = positions[j3 + 2];
                            lineIndex++;
                            connections++;
                        }
                    }
                }
            }

            this.lineGeometry.attributes.position.needsUpdate = true;
            this.lineGeometry.setDrawRange(0, lineIndex * 2);
        }

        addEventListeners() {
            window.addEventListener('mousemove', (e) => {
                this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
                this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
            });

            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });

            // Visibility observer for performance
            const observer = new IntersectionObserver((entries) => {
                this.isVisible = entries[0].isIntersecting;
            }, { threshold: 0.1 });
            observer.observe(this.container);
        }

        animate() {
            requestAnimationFrame(() => this.animate());

            if (!this.isVisible) return;

            const time = this.clock.getElapsedTime();
            const delta = this.clock.getDelta();

            // Smooth mouse follow
            this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
            this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

            // Update particles
            this.updateParticles(time);

            // Connection lines updating disabled
            // if (Math.floor(time * 10) % 3 === 0) {
            //     this.updateConnections();
            // }

            // Update floating shapes
            this.updateFloatingShapes(time);

            // Camera subtle movement
            this.camera.position.x += (this.mouse.x * 3 - this.camera.position.x) * 0.02;
            this.camera.position.y += (this.mouse.y * 2 - this.camera.position.y) * 0.02;
            this.camera.lookAt(0, 0, 0);

            // Update shader time
            if (this.particleSystem.material.uniforms) {
                this.particleSystem.material.uniforms.uTime.value = time;
            }

            this.renderer.render(this.scene, this.camera);
        }

        updateParticles(time) {
            const positions = this.particleSystem.geometry.attributes.position.array;

            for (let i = 0; i < CONFIG.particles.count; i++) {
                const i3 = i * 3;
                const vel = this.particleVelocities[i];

                // Organic flowing motion
                positions[i3] += vel.x + Math.sin(time * 0.5 + i * 0.1) * CONFIG.particles.speed;
                positions[i3 + 1] += vel.y + Math.cos(time * 0.3 + i * 0.15) * CONFIG.particles.speed;
                positions[i3 + 2] += vel.z + Math.sin(time * 0.2 + i * 0.05) * CONFIG.particles.speed * 0.5;

                // Mouse influence
                positions[i3] += this.mouse.x * CONFIG.particles.mouseInfluence * (40 - Math.abs(positions[i3]));
                positions[i3 + 1] += this.mouse.y * CONFIG.particles.mouseInfluence * (30 - Math.abs(positions[i3 + 1]));

                // Boundary wrapping
                if (positions[i3] > 40) positions[i3] = -40;
                if (positions[i3] < -40) positions[i3] = 40;
                if (positions[i3 + 1] > 30) positions[i3 + 1] = -30;
                if (positions[i3 + 1] < -30) positions[i3 + 1] = 30;
                if (positions[i3 + 2] > 15) positions[i3 + 2] = -15;
                if (positions[i3 + 2] < -15) positions[i3 + 2] = 15;
            }

            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        updateFloatingShapes(time) {
            this.floatingShapes.forEach((shape) => {
                const { rotationSpeed, floatSpeed, floatAmplitude, originalY, phase } = shape.userData;

                // Rotation
                shape.rotation.x += rotationSpeed.x;
                shape.rotation.y += rotationSpeed.y;
                shape.rotation.z += rotationSpeed.z;

                // Floating motion
                shape.position.y = originalY + Math.sin(time * floatSpeed + phase) * floatAmplitude;

                // Subtle scale pulsing
                const scale = shape.scale.x;
                const pulse = 1 + Math.sin(time * 0.5 + phase) * 0.05;
                shape.scale.setScalar(scale * pulse / (1 + Math.sin((time - 0.016) * 0.5 + phase) * 0.05));

                // Mouse interaction - subtle tilt
                shape.rotation.x += this.mouse.y * 0.001;
                shape.rotation.y += this.mouse.x * 0.001;
            });
        }

        dispose() {
            this.renderer.dispose();
            this.scene.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }

    // ===== WAVE DIVIDER SCENE =====
    class WaveDivider {
        constructor(containerId, colorTop, colorBottom) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;

            this.clock = new THREE.Clock();
            this.isVisible = false;

            this.init(colorTop, colorBottom);
            this.createWave();
            this.observe();
            this.animate();
        }

        init(colorTop, colorBottom) {
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            this.container.appendChild(this.renderer.domElement);

            this.scene = new THREE.Scene();
            this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        }

        createWave() {
            const geometry = new THREE.PlaneGeometry(2, 2, 128, 32);

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor1: { value: new THREE.Color('#8A9A5B') },
                    uColor2: { value: new THREE.Color('#C1D0B5') },
                    uOpacity: { value: 0.15 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    uniform float uTime;
                    
                    void main() {
                        vUv = uv;
                        vec3 pos = position;
                        pos.z = sin(pos.x * 4.0 + uTime) * 0.05 + 
                                cos(pos.y * 3.0 + uTime * 0.7) * 0.03;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec2 vUv;
                    uniform vec3 uColor1;
                    uniform vec3 uColor2;
                    uniform float uTime;
                    uniform float uOpacity;
                    
                    void main() {
                        float wave = sin(vUv.x * 6.28 + uTime) * 0.5 + 0.5;
                        vec3 color = mix(uColor1, uColor2, wave);
                        float alpha = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y) * uOpacity;
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide
            });

            this.waveMesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.waveMesh);
        }

        observe() {
            const observer = new IntersectionObserver((entries) => {
                this.isVisible = entries[0].isIntersecting;
            }, { threshold: 0.1 });
            observer.observe(this.container);

            window.addEventListener('resize', () => {
                this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
            });
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            if (!this.isVisible) return;

            const time = this.clock.getElapsedTime();
            this.waveMesh.material.uniforms.uTime.value = time;
            this.renderer.render(this.scene, this.camera);
        }
    }

    // ===== SKILLS ORB SCENE =====
    class SkillsOrb {
        constructor() {
            this.container = document.getElementById('skills-orb-canvas');
            if (!this.container) return;

            this.mouse = { x: 0, y: 0 };
            this.clock = new THREE.Clock();
            this.isVisible = false;

            this.init();
            this.createOrb();
            this.observe();
            this.animate();
        }

        init() {
            const width = this.container.offsetWidth;
            const height = this.container.offsetHeight;

            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            this.container.appendChild(this.renderer.domElement);

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
            this.camera.position.z = 12;

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);

            const pointLight = new THREE.PointLight(0x8A9A5B, 1.5, 50);
            pointLight.position.set(5, 5, 10);
            this.scene.add(pointLight);

            const pointLight2 = new THREE.PointLight(0xE2725B, 0.8, 30);
            pointLight2.position.set(-5, -3, 8);
            this.scene.add(pointLight2);
        }

        createOrb() {
            // Main sphere (wireframe icosahedron)
            const icoGeo = new THREE.IcosahedronGeometry(3.5, 2);
            const icoMat = new THREE.MeshPhysicalMaterial({
                color: 0x8A9A5B,
                wireframe: true,
                transparent: true,
                opacity: 0.2,
                roughness: 0.3,
                metalness: 0.1
            });
            this.mainSphere = new THREE.Mesh(icoGeo, icoMat);
            this.scene.add(this.mainSphere);

            // Inner glowing sphere
            const innerGeo = new THREE.SphereGeometry(2.8, 32, 32);
            const innerMat = new THREE.MeshPhysicalMaterial({
                color: 0xC1D0B5,
                transparent: true,
                opacity: 0.06,
                roughness: 1,
                metalness: 0
            });
            this.innerSphere = new THREE.Mesh(innerGeo, innerMat);
            this.scene.add(this.innerSphere);

            // Orbiting ring particles
            this.orbitParticles = [];
            const ringCount = 3;
            for (let r = 0; r < ringCount; r++) {
                const particleCount = 30 + r * 10;
                const radius = 4 + r * 0.8;
                const geo = new THREE.BufferGeometry();
                const positions = new Float32Array(particleCount * 3);
                const colors = new Float32Array(particleCount * 3);

                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2;
                    positions[i * 3] = Math.cos(angle) * radius;
                    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
                    positions[i * 3 + 2] = Math.sin(angle) * radius;

                    const color = new THREE.Color(CONFIG.particles.colors[i % CONFIG.particles.colors.length]);
                    colors[i * 3] = color.r;
                    colors[i * 3 + 1] = color.g;
                    colors[i * 3 + 2] = color.b;
                }

                geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                const mat = new THREE.PointsMaterial({
                    size: 0.08,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                const points = new THREE.Points(geo, mat);
                points.userData = {
                    speed: 0.2 + r * 0.1,
                    tilt: r * 0.4,
                    radius: radius
                };
                points.rotation.x = r * 0.5;
                this.scene.add(points);
                this.orbitParticles.push(points);
            }
        }

        observe() {
            const observer = new IntersectionObserver((entries) => {
                this.isVisible = entries[0].isIntersecting;
            }, { threshold: 0.1 });
            observer.observe(this.container);

            this.container.addEventListener('mousemove', (e) => {
                const rect = this.container.getBoundingClientRect();
                this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            });

            window.addEventListener('resize', () => {
                const width = this.container.offsetWidth;
                const height = this.container.offsetHeight;
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            });
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            if (!this.isVisible) return;

            const time = this.clock.getElapsedTime();

            // Main sphere rotation + morph
            this.mainSphere.rotation.y = time * 0.1;
            this.mainSphere.rotation.x = Math.sin(time * 0.15) * 0.2;

            // Vertex displacement for organic morph
            const positions = this.mainSphere.geometry.attributes.position;
            const original = new THREE.IcosahedronGeometry(3.5, 2);
            const origPos = original.attributes.position;

            for (let i = 0; i < positions.count; i++) {
                const ox = origPos.getX(i);
                const oy = origPos.getY(i);
                const oz = origPos.getZ(i);

                const noise = Math.sin(ox * 2 + time * 0.5) *
                    Math.cos(oy * 2 + time * 0.3) *
                    Math.sin(oz * 2 + time * 0.7) * 0.15;

                positions.setXYZ(i,
                    ox + ox * noise,
                    oy + oy * noise,
                    oz + oz * noise
                );
            }
            positions.needsUpdate = true;
            original.dispose();

            // Inner sphere pulse
            const pulse = 1 + Math.sin(time * 0.8) * 0.05;
            this.innerSphere.scale.setScalar(pulse);
            this.innerSphere.material.opacity = 0.04 + Math.sin(time * 0.5) * 0.02;

            // Orbit particles rotation
            this.orbitParticles.forEach((ring) => {
                ring.rotation.y += ring.userData.speed * 0.01;
                ring.rotation.x = ring.userData.tilt + Math.sin(time * 0.2) * 0.1;
            });

            // Mouse-follow camera
            this.camera.position.x += (this.mouse.x * 2 - this.camera.position.x) * 0.02;
            this.camera.position.y += (this.mouse.y * 1.5 - this.camera.position.y) * 0.02;
            this.camera.lookAt(0, 0, 0);

            this.renderer.render(this.scene, this.camera);
        }
    }

    // ===== SCROLL-TRIGGERED PARTICLES FOR SECTIONS =====
    class SectionParticles {
        constructor(sectionId, color) {
            this.section = document.querySelector(sectionId);
            if (!this.section) return;

            this.canvas = document.createElement('canvas');
            this.canvas.classList.add('section-particles-canvas');
            this.section.style.position = 'relative';
            this.section.insertBefore(this.canvas, this.section.firstChild);

            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.color = color;
            this.isVisible = false;

            this.resize();
            this.createParticles();
            this.observe();
            this.animate();
        }

        resize() {
            this.canvas.width = this.section.offsetWidth;
            this.canvas.height = this.section.offsetHeight;

            window.addEventListener('resize', () => {
                this.canvas.width = this.section.offsetWidth;
                this.canvas.height = this.section.offsetHeight;
            });
        }

        createParticles() {
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: Math.random() * 3 + 1,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.3 + 0.05
                });
            }
        }

        observe() {
            const observer = new IntersectionObserver((entries) => {
                this.isVisible = entries[0].isIntersecting;
            }, { threshold: 0.1 });
            observer.observe(this.section);
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            if (!this.isVisible) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = this.color.replace(')', `, ${p.opacity})`).replace('rgb', 'rgba');
                this.ctx.fill();
            });
        }
    }

    // ===== INITIALIZATION =====
    function initThreeScenes() {
        // Hero particle scene
        const heroScene = new HeroScene();

        // Skills orb
        const skillsOrb = new SkillsOrb();

        // Section background particles (using Canvas 2D for performance)
        new SectionParticles('#about', 'rgb(138, 154, 91)');
        new SectionParticles('#experience', 'rgb(164, 195, 178)');
        new SectionParticles('#projects', 'rgb(226, 114, 91)');

        console.log('%c✨ Three.js scenes initialized', 'color: #8A9A5B; font-weight: bold;');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThreeScenes);
    } else {
        initThreeScenes();
    }

})();
