/**
 * ==========================================================================
 * JAPANESE ANIMATED STORYBOOK WORLD · INTERACTIONS & VISUAL CHOREOGRAPHY
 * Developer: Lê Quốc Khánh // Software Engineer (.NET Backend)
 * Architecture:
 * 1. Motion Preference & Accessibility Guard
 * 2. Reading Progress Bar (GSAP ScrollTrigger scaleX)
 * 3. Three.js Living Atmosphere & Firefly System (Day / Sunset / Night)
 * 4. Atmosphere Mood Controller (☀️ Day / 🌇 Sunset / 🌙 Night)
 * 5. Procedural Studio Ghibli Countryside Soundscape (Web Audio API)
 * 6. GSAP & ScrollTrigger Scene Choreography
 * 7. Navigation, Active ScrollSpy & Stationery Mail
 * ==========================================================================
 */

(function () {
    'use strict';

    // ===== 1. PREFERENCES & ACCESSIBILITY GUARD =====
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Global hook to update Three.js atmospheric mood from UI
    let updateAtmosphereMood = null;

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
            function updateProgress() {
                const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
                const progress = totalScroll > 0 ? (window.scrollY / totalScroll) : 0;
                progressBar.style.transform = `scaleX(${progress})`;
            }
            window.addEventListener('scroll', updateProgress, { passive: true });
            updateProgress();
        }
    }

    // ===== 3. THREE.JS LIVING ATMOSPHERE & FIREFLY SYSTEM =====
    function initAtmosphericScene() {
        const canvas = document.getElementById('heroAtmosphereCanvas');
        const container = document.getElementById('heroScenicWindow');

        if (!canvas || !container || typeof window.THREE === 'undefined') {
            return;
        }

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'low-power'
            });
        } catch (e) {
            console.warn('WebGL not supported for atmospheric canvas. Graceful fallback enabled.', e);
            return;
        }

        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(DPR);

        const scene = new THREE.Scene();
        let width = container.clientWidth || 800;
        let height = container.clientHeight || 450;
        renderer.setSize(width, height);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 10);

        // Procedural soft-edge particle texture
        function createPollenTexture(r, g, b) {
            const texCanvas = document.createElement('canvas');
            texCanvas.width = 64;
            texCanvas.height = 64;
            const ctx = texCanvas.getContext('2d');

            const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
            radGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
            radGrad.addColorStop(0.3, `rgba(${Math.min(255, r + 20)}, ${g}, ${Math.max(0, b - 20)}, 0.7)`);
            radGrad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.2)`);
            radGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.fill();

            const texture = new THREE.CanvasTexture(texCanvas);
            texture.needsUpdate = true;
            return texture;
        }

        const dayTexture = createPollenTexture(255, 240, 200);
        const duskTexture = createPollenTexture(255, 175, 110);
        const nightTexture = createPollenTexture(180, 245, 90); // Fireflies (Hotaru)

        let currentMood = 'day';

        // Particle System
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

            velocities[i3] = (Math.random() - 0.5) * 0.003;
            velocities[i3 + 1] = 0.002 + Math.random() * 0.005;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.002;

            phases[i] = Math.random() * Math.PI * 2;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.17,
            map: dayTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        // Update Mood Hook
        updateAtmosphereMood = function (mood) {
            currentMood = mood;
            if (mood === 'day') {
                material.map = dayTexture;
                material.size = 0.17;
                material.opacity = 0.8;
            } else if (mood === 'dusk') {
                material.map = duskTexture;
                material.size = 0.20;
                material.opacity = 0.85;
            } else if (mood === 'night') {
                material.map = nightTexture;
                material.size = 0.24; // Fireflies look larger with bioluminescence
                material.opacity = 0.95;
            }
            material.needsUpdate = true;
        };

        // Subtle mouse parallax
        let mouseX = 0, mouseY = 0;
        let targetMouseX = 0, targetMouseY = 0;

        container.addEventListener('mousemove', function (e) {
            const rect = container.getBoundingClientRect();
            targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.2;
            targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 0.8;
        }, { passive: true });

        container.addEventListener('mouseleave', function () {
            targetMouseX = 0;
            targetMouseY = 0;
        });

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

        // Animation Loop with IntersectionObserver
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
            clock += 0.014;

            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;
            camera.position.x = mouseX * 0.6;
            camera.position.y = mouseY * 0.4;
            camera.lookAt(0, 0, 0);

            const posAttr = geometry.attributes.position;
            const posArray = posAttr.array;

            const isNight = currentMood === 'night';

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const phase = phases[i] + clock;

                if (isNight) {
                    // Fireflies wander with organic hovering Lissajous curve
                    posArray[i3] += Math.sin(phase * 0.8) * 0.006 + velocities[i3];
                    posArray[i3 + 1] += Math.cos(phase * 0.6) * 0.005 + (velocities[i3 + 1] * 0.3);
                    posArray[i3 + 2] += Math.sin(phase * 0.5) * 0.004;
                } else {
                    // Sunlit pollen rises smoothly on thermal updrafts
                    posArray[i3] += velocities[i3] + Math.sin(phase) * 0.002;
                    posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(phase * 0.7) * 0.001;
                    posArray[i3 + 2] += velocities[i3 + 2];
                }

                // Boundary wrapping
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
            renderer.render(scene, camera);
        }

        window.addEventListener('beforeunload', function () {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            geometry.dispose();
            material.dispose();
            dayTexture.dispose();
            duskTexture.dispose();
            nightTexture.dispose();
            renderer.dispose();
        });
    }

    // ===== 4. ATMOSPHERE MOOD CONTROLLER =====
    function initAtmosphereMoodController() {
        const buttons = document.querySelectorAll('.atmosphere-btn');
        if (!buttons.length) return;

        buttons.forEach((btn) => {
            btn.addEventListener('click', function () {
                const mood = this.getAttribute('data-mood');
                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                document.body.setAttribute('data-mood', mood);

                if (typeof updateAtmosphereMood === 'function') {
                    updateAtmosphereMood(mood);
                }
            });
        });
    }

    // ===== 5. PROCEDURAL STUDIO GHIBLI COUNTRYSIDE SOUNDSCAPE (WEB AUDIO API) =====
    function initProceduralSoundscape() {
        const toggleBtn = document.getElementById('audioToggleBtn');
        if (!toggleBtn) return;

        let audioCtx = null;
        let isPlaying = false;
        let windGain = null;
        let chimeInterval = null;

        // Pentatonic Chime Frequencies (Japanese In/Yo Scale: A, B, C, E, F)
        const chimeNotes = [880, 987.77, 1046.50, 1318.51, 1396.91, 1760, 2093];

        function playChime() {
            if (!audioCtx || !isPlaying) return;

            const now = audioCtx.currentTime;
            const note = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note, now);

            // Shimmer harmonics
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + 3.0);
        }

        function startAudio() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            if (!audioCtx) {
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            // Synthesize Soft Summer Wind (Bandpass Pink Noise)
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                output[i] = (b0 + b1 + b2) * 0.08;
            }

            const whiteNoise = audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(420, audioCtx.currentTime);
            filter.Q.setValueAtTime(1.8, audioCtx.currentTime);

            // Slow wind swell LFO
            const lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.setValueAtTime(180, audioCtx.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            windGain = audioCtx.createGain();
            windGain.gain.setValueAtTime(0.05, audioCtx.currentTime);

            whiteNoise.connect(filter);
            filter.connect(windGain);
            windGain.connect(audioCtx.destination);

            whiteNoise.start();
            lfo.start();

            // Periodic delicate windchime rings (every 6 to 14 seconds)
            chimeInterval = setInterval(() => {
                if (Math.random() > 0.3) {
                    playChime();
                }
            }, 7500);

            // Initial greeting chime
            setTimeout(playChime, 800);

            isPlaying = true;
            toggleBtn.classList.add('active');
            toggleBtn.querySelector('.ambience-text').textContent = 'Ambience: Calm ♫';
        }

        function stopAudio() {
            if (audioCtx && audioCtx.state === 'running') {
                audioCtx.suspend();
            }
            if (chimeInterval) clearInterval(chimeInterval);
            isPlaying = false;
            toggleBtn.classList.remove('active');
            toggleBtn.querySelector('.ambience-text').textContent = 'Ambience: Off';
        }

        toggleBtn.addEventListener('click', function () {
            if (!isPlaying) {
                startAudio();
            } else {
                stopAudio();
            }
        });
    }

    // ===== 6. GSAP & SCROLLTRIGGER SCENE CHOREOGRAPHY =====
    function initGsapChoreography() {
        if (typeof window.gsap === 'undefined') return;

        if (typeof window.ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        if (prefersReducedMotion) {
            gsap.set('.hero-identity-overlay, .project-spec-card, .project-card-secondary, .timeline-milestone, .workbench-category-tray, .journal-card', {
                opacity: 1,
                y: 0,
                clearProps: 'all'
            });
            return;
        }

        // Hero Entrance Timeline
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

        // Scroll Depth Parallax
        if (typeof window.ScrollTrigger !== 'undefined') {
            const heroSection = document.getElementById('hero');

            if (heroSection) {
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
            }

            // Reveal cards on scroll
            const cards = document.querySelectorAll('.featured-project-plate, .notebook-project-card, .timeline-milestone, .workbench-category-tray, .journal-card');
            cards.forEach((card) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.75,
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

    // ===== 9. NAVIGATION, SCROLLSPY & CORRESPONDENCE =====
    function initNavigation() {
        const header = document.getElementById('siteHeader');
        const sections = document.querySelectorAll('section[id]');
        const navAnchors = document.querySelectorAll('.nav-anchor');
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        function handleScroll() {
            if (!header) return;
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

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

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function () {
                const isOpen = navMenu.classList.toggle('open');
                navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            navAnchors.forEach((link) => {
                link.addEventListener('click', function () {
                    navMenu.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                });
            });

            window.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                    navToggle.focus();
                }
            });
        }

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
        initAtmosphereMoodController();
        initProceduralSoundscape();
        initGsapChoreography();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
