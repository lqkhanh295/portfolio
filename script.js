/**
 * ==========================================================================
 * JAPANESE ANIMATED STORYBOOK WORLD · INTERACTIONS & VISUAL CHOREOGRAPHY
 * Developer: Lê Quốc Khánh // Software Engineer (.NET Backend)
 * Architecture:
 * 1. Motion Preference & Accessibility Guard
 * 2. Reading Progress Bar (GSAP ScrollTrigger scaleX)
 * 3. Three.js Atmospheric Sunlit Dust & Pollen System (16:9 Window Depth)
 * 4. GSAP & ScrollTrigger Cinematic Scene Choreography
 * 5. Navigation & Mobile Drawer with Active ScrollSpy
 * 6. Interactive Stationery Mail & Direct Actions
 * ==========================================================================
 */

(function () {
    'use strict';

    // ===== 1. PREFERENCES & ACCESSIBILITY GUARD =====
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===== 2. READING PROGRESS BAR =====
    function initReadingProgressBar() {
        const progressBar = document.getElementById('readingProgressBar');
        if (!progressBar) return;

        if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
            gsap.to(progressBar, {
                scaleX: 1,
                ease: 'none',
                scrollTrigger: {
                    trigger: document.documentElement,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.15
                }
            });
        } else {
            // High-performance vanilla scroll fallback
            function updateProgress() {
                const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
                const progress = totalScroll > 0 ? (window.scrollY / totalScroll) : 0;
                progressBar.style.transform = `scaleX(${progress})`;
            }
            window.addEventListener('scroll', updateProgress, { passive: true });
            updateProgress();
        }
    }

    // ===== 3. THREE.JS ATMOSPHERIC DUST & POLLEN SYSTEM =====
    function initAtmosphericScene() {
        const canvas = document.getElementById('heroAtmosphereCanvas');
        const container = document.getElementById('heroScenicWindow');

        if (!canvas || !container || typeof window.THREE === 'undefined') {
            return;
        }

        // WebGL capability check
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'low-power'
            });
        } catch (e) {
            console.warn('WebGL not supported for atmospheric canvas. Falling back gracefully.', e);
            return;
        }

        // Configuration
        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(DPR);

        const scene = new THREE.Scene();
        let width = container.clientWidth || 800;
        let height = container.clientHeight || 450;
        renderer.setSize(width, height);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 10);

        // Procedural soft-edge circular particle texture (no external image request needed)
        function createPollenTexture() {
            const texCanvas = document.createElement('canvas');
            texCanvas.width = 64;
            texCanvas.height = 64;
            const ctx = texCanvas.getContext('2d');

            const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
            radGrad.addColorStop(0, 'rgba(255, 248, 225, 0.95)');
            radGrad.addColorStop(0.3, 'rgba(235, 205, 140, 0.7)');
            radGrad.addColorStop(0.65, 'rgba(217, 181, 110, 0.25)');
            radGrad.addColorStop(1, 'rgba(217, 181, 110, 0)');

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.fill();

            const texture = new THREE.CanvasTexture(texCanvas);
            texture.needsUpdate = true;
            return texture;
        }

        const pollenTexture = createPollenTexture();

        // Particle System (Warm afternoon golden motes drifting through window)
        const particleCount = prefersReducedMotion ? 40 : 130;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const phases = new Float32Array(particleCount);

        const boundX = 12;
        const boundY = 7;
        const boundZ = 4;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * boundX * 2;
            positions[i3 + 1] = (Math.random() - 0.5) * boundY * 2;
            positions[i3 + 2] = (Math.random() - 0.5) * boundZ * 2;

            velocities[i3] = (Math.random() - 0.5) * 0.003;      // gentle lateral drift
            velocities[i3 + 1] = 0.002 + Math.random() * 0.005;  // gentle upward warm air thermal
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.002;

            phases[i] = Math.random() * Math.PI * 2;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.16,
            map: pollenTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        // Interactive subtle parallax mouse response
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;

        container.addEventListener('mousemove', function (e) {
            const rect = container.getBoundingClientRect();
            targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.2;
            targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 0.8;
        }, { passive: true });

        container.addEventListener('mouseleave', function () {
            targetMouseX = 0;
            targetMouseY = 0;
        });

        // Resize handler
        function onResize() {
            if (!container) return;
            width = container.clientWidth;
            height = container.clientHeight;
            if (width === 0 || height === 0) return;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }

        window.addEventListener('resize', onResize, { passive: true });

        // Animation Loop with IntersectionObserver pausing (Critical for 60fps & battery saving)
        let isHeroInView = true;
        let animationFrameId = null;
        let clock = 0;

        const heroSection = document.getElementById('hero');
        if (heroSection && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    isHeroInView = entry.isIntersecting;
                    if (isHeroInView && !animationFrameId && !prefersReducedMotion) {
                        animate();
                    }
                });
            }, { threshold: 0.05 });
            observer.observe(heroSection);
        }

        function animate() {
            if (!isHeroInView) {
                animationFrameId = null;
                return;
            }

            animationFrameId = requestAnimationFrame(animate);

            clock += 0.012;

            // Camera subtle damping toward mouse
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;
            camera.position.x = mouseX * 0.6;
            camera.position.y = mouseY * 0.4;
            camera.lookAt(0, 0, 0);

            // Update particles drift
            const posAttr = geometry.attributes.position;
            const posArray = posAttr.array;

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const phase = phases[i] + clock;

                // Drift with thermal sway
                posArray[i3] += velocities[i3] + Math.sin(phase) * 0.002;
                posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(phase * 0.7) * 0.001;
                posArray[i3 + 2] += velocities[i3 + 2];

                // Wrap around volume bounds
                if (posArray[i3 + 1] > boundY) {
                    posArray[i3 + 1] = -boundY;
                    posArray[i3] = (Math.random() - 0.5) * boundX * 2;
                }
                if (posArray[i3] > boundX) posArray[i3] = -boundX;
                if (posArray[i3] < -boundX) posArray[i3] = boundX;
            }

            posAttr.needsUpdate = true;
            renderer.render(scene, camera);
        }

        if (!prefersReducedMotion) {
            animate();
        } else {
            // Render one single subtle static frame for reduced motion users
            renderer.render(scene, camera);
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', function () {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (geometry) geometry.dispose();
            if (material) material.dispose();
            if (pollenTexture) pollenTexture.dispose();
            if (renderer) renderer.dispose();
        });
    }

    // ===== 4. GSAP & SCROLLTRIGGER SCENE CHOREOGRAPHY =====
    function initGsapChoreography() {
        if (typeof window.gsap === 'undefined') return;

        if (typeof window.ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        // If reduced motion is requested, ensure everything is fully placed and visible
        if (prefersReducedMotion) {
            gsap.set('.hero-identity-overlay, .project-spec-card, .project-card-secondary, .timeline-milestone, .workbench-category-tray, .journal-card', {
                opacity: 1,
                y: 0,
                clearProps: 'all'
            });
            return;
        }

        // --- Hero Entrance Timeline ---
        const entranceTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        entranceTl
            .fromTo('#heroBgPainting',
                { scale: 1.05 },
                { scale: 1.02, duration: 1.0 }
            )
            .fromTo('#heroIdentityOverlay',
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.6 },
                '-=0.8'
            )
            .fromTo('.hero-chapter-pill',
                { opacity: 0, y: -6 },
                { opacity: 1, y: 0, duration: 0.35 },
                '-=0.5'
            )
            .fromTo(['.hero-developer-name', '.hero-developer-role', '.hero-philosophy-quote', '.hero-narrative-lead', '.hero-action-group'],
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 },
                '-=0.3'
            );

        // --- Hero Scroll Depth Parallax (Camera Dolly into Scene 02) ---
        if (typeof window.ScrollTrigger !== 'undefined') {
            const heroSection = document.getElementById('hero');

            if (heroSection) {
                // Background painting parallax moves down slowly as we scroll
                gsap.to('#heroPlaneBack', {
                    yPercent: 12,
                    scale: 1.05,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });

                // Clouds drift laterally and vertically
                gsap.to('#heroPlaneClouds', {
                    yPercent: 8,
                    xPercent: -4,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });

                // Atmosphere plane moves with midground
                gsap.to('#heroPlaneAtmosphere', {
                    yPercent: 6,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });

                // Identity Card softens and lifts slightly as we transition to Selected Projects
                gsap.to('#heroIdentityOverlay', {
                    yPercent: -10,
                    opacity: 0.85,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'center top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }

            // --- Scene 02: Project Cards Batch Reveal ---
            const projectCards = document.querySelectorAll('.project-spec-card, .project-card-secondary');
            projectCards.forEach((card) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 35 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.85,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 86%',
                            toggleActions: 'play none none none'
                        }
                    }
                );
            });

            // --- Scene 03: Experience Timeline Milestones ---
            const milestones = document.querySelectorAll('.timeline-milestone');
            milestones.forEach((item) => {
                gsap.fromTo(item,
                    { opacity: 0, x: -24 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: item,
                            start: 'top 85%',
                            toggleActions: 'play none none none'
                        }
                    }
                );
            });

            // --- Scene 04: Workbench Category Trays ---
            const trays = document.querySelectorAll('.workbench-category-tray');
            trays.forEach((tray, index) => {
                gsap.fromTo(tray,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.75,
                        delay: index * 0.1,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: tray,
                            start: 'top 88%',
                            toggleActions: 'play none none none'
                        }
                    }
                );
            });

            // --- Scene 05: Journal Cards ---
            const journalCards = document.querySelectorAll('.journal-card');
            journalCards.forEach((card, index) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 25 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        delay: index * 0.08,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 88%',
                            toggleActions: 'play none none none'
                        }
                    }
                );
            });
        }
    }

    // ===== 5. NAVIGATION & MOBILE DRAWER WITH SCROLLSPY =====
    function initNavigation() {
        const header = document.getElementById('siteHeader');
        const sections = document.querySelectorAll('section[id]');
        const navAnchors = document.querySelectorAll('.nav-anchor');
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        // Sticky Navbar subtle elevation on scroll
        function handleScroll() {
            if (!header) return;
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Scrollspy active anchor
            const scrollPos = window.scrollY + 180;
            sections.forEach((section) => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos < top + height) {
                    navAnchors.forEach((link) => {
                        const href = link.getAttribute('href');
                        if (href === `#${id}`) {
                            link.classList.add('active');
                        } else if (href && href.startsWith('#')) {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Mobile Nav Drawer Toggle
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function () {
                const isOpen = navMenu.classList.toggle('open');
                navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            // Close mobile nav when clicking any link
            navAnchors.forEach((link) => {
                link.addEventListener('click', function () {
                    navMenu.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                });
            });

            // Close mobile nav when pressing Escape
            window.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                    navToggle.focus();
                }
            });
        }

        // Smooth scroll handling for internal anchor links with offset
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#' || targetId === '#mainContent') return;
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    const headerOffset = 70;
                    const elementPosition = targetEl.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: prefersReducedMotion ? 'auto' : 'smooth'
                    });
                }
            });
        });
    }

    // ===== 6. STATIONERY CORRESPONDENCE FORM =====
    function initContactForm() {
        const form = document.getElementById('contactForm');
        const statusMsg = document.getElementById('formStatus');
        const sendBtn = document.getElementById('sendBtn');

        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const nameInput = document.getElementById('nameInput');
            const emailInput = document.getElementById('emailInput');
            const messageInput = document.getElementById('messageInput');

            if (!nameInput || !emailInput || !messageInput) return;

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            if (!name || !email || !message) {
                if (statusMsg) {
                    statusMsg.textContent = 'Please fill out your name, email, and message.';
                    statusMsg.style.color = 'var(--wine-terracotta)';
                }
                return;
            }

            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.textContent = 'Preparing correspondence...';
            }
            if (statusMsg) {
                statusMsg.textContent = 'Composing note for Lê Quốc Khánh...';
                statusMsg.style.color = 'var(--wood-dark)';
            }

            setTimeout(function () {
                if (statusMsg) {
                    statusMsg.textContent = 'Opening your email client... Thank you!';
                    statusMsg.style.color = 'var(--moss-deep)';
                }

                // Construct mailto link
                const subject = encodeURIComponent(`Correspondence from ${name} [Portfolio Inquiry]`);
                const body = encodeURIComponent(`Hello Khanh,\n\nFrom: ${name}\nEmail: ${email}\n\nNote:\n${message}\n\nSent via Developer Portfolio Workspace`);
                const mailtoUrl = `mailto:lqkhanh292005@gmail.com?subject=${subject}&body=${body}`;

                window.location.href = mailtoUrl;

                form.reset();
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send Note Directly →';
                }
            }, 600);
        });
    }

    // ===== BOOTSTRAP EXPERIENCES =====
    function init() {
        initReadingProgressBar();
        initNavigation();
        initContactForm();
        initAtmosphericScene();
        initGsapChoreography();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
