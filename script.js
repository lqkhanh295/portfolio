/**
 * ==========================================================================
 * ANIME & RETRO CYBERPUNK SCRIPT
 * Developer: Lê Quốc Khánh // .NET Backend Architect
 * Features:
 *   1. Canvas Engine: Floating Sakura Petals & Cyber Dust
 *   2. Web Audio API Retro Sound Effects (SFX)
 *   3. Client-Side Lo-Fi Ambient Synthesizer & Cassette Player
 *   4. CRT Scanline Toggle & State Persistence
 *   5. Hero Dynamic Typewriter (from GitHub & CV)
 *   6. Interactive Cyber Terminal (CLI) with Command Parsing & History
 *   7. Konami Code Easter Egg (↑ ↑ ↓ ↓ ← → ← → B A)
 *   8. Skill & Project Category Filters
 *   9. Navbar Spy, Smooth Scroll & Mobile Menu
 *  10. Live Coordinates Clock (Ho Chi Minh City GMT+7)
 *  11. Contact Form Simulation with Encrypted Packet Feedback
 * ==========================================================================
 */

(function () {
    'use strict';

    // ===== AUDIO CONTEXT & RETRO SOUND FX (WEB AUDIO API) =====
    let audioCtx = null;
    let sfxEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Play 8-bit Sound Effect
    function playSfx(type) {
        if (!sfxEnabled) return;
        initAudio();
        if (!audioCtx) return;

        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'click') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'hover') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.02, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else if (type === 'success') {
                // Retro Arpeggio (C5, E5, G5, C6)
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const noteOsc = audioCtx.createOscillator();
                    const noteGain = audioCtx.createGain();
                    noteOsc.type = 'triangle';
                    noteOsc.frequency.setValueAtTime(freq, now + idx * 0.07);
                    noteGain.gain.setValueAtTime(0.09, now + idx * 0.07);
                    noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
                    noteOsc.connect(noteGain);
                    noteGain.connect(audioCtx.destination);
                    noteOsc.start(now + idx * 0.07);
                    noteOsc.stop(now + idx * 0.07 + 0.16);
                });
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            console.warn('Audio playback error', e);
        }
    }

    // Attach sound to interactive buttons
    function attachSoundListeners() {
        document.querySelectorAll('a, button, .filter-chip, .channel-card, .arsenal-card').forEach(el => {
            el.addEventListener('mouseenter', () => playSfx('hover'));
            el.addEventListener('click', () => playSfx('click'));
        });
    }

    // ===== RETRO CLIENT-SIDE LO-FI / SYNTHWAVE MUSIC GENERATOR =====
    const LofiPlayer = {
        isPlaying: false,
        isMuted: false,
        currentTrackIndex: 0,
        intervalId: null,
        tracks: [
            {
                name: "NEO TOKYO SUNSET",
                // Am7 -> Fmaj7 -> Cmaj7 -> Em7
                progression: [
                    [220.00, 261.63, 329.63, 392.00], // A3, C4, E4, G4
                    [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
                    [130.81, 196.00, 246.94, 329.63], // C3, G3, B3, E4
                    [164.81, 196.00, 246.94, 293.66]  // E3, G3, B3, D4
                ],
                bpm: 65,
                wave: 'triangle'
            },
            {
                name: "AKIHABARA 8-BIT CHILL",
                // C -> Am -> F -> G pentatonic
                progression: [
                    [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5
                    [220.00, 261.63, 329.63, 440.00], // A3, C4, E4, A4
                    [174.61, 220.00, 261.63, 349.23], // F3, A3, C4, F4
                    [196.00, 246.94, 293.66, 392.00]  // G3, B3, D4, G4
                ],
                bpm: 78,
                wave: 'sine'
            },
            {
                name: "CYBERPUNK RAIN",
                // Dm7 -> Bbmaj7 -> Gm7 -> A7
                progression: [
                    [146.83, 220.00, 261.63, 349.23], // D3, A3, C4, F4
                    [116.54, 174.61, 220.00, 293.66], // Bb2, F3, A3, D4
                    [196.00, 233.08, 293.66, 349.23], // G3, Bb3, D4, F4
                    [220.00, 277.18, 329.63, 392.00]  // A3, C#4, E4, G4
                ],
                bpm: 60,
                wave: 'triangle'
            }
        ],
        step: 0,

        playChord() {
            if (!this.isPlaying || this.isMuted) return;
            initAudio();
            if (!audioCtx) return;

            const track = this.tracks[this.currentTrackIndex];
            const chord = track.progression[this.step % track.progression.length];
            const now = audioCtx.currentTime;
            const duration = (60 / track.bpm) * 2;

            chord.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();

                osc.type = track.wave;
                osc.frequency.setValueAtTime(freq, now);

                // Low-pass filter for cozy warm lofi sound
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(900 + idx * 100, now);

                // Soft envelope
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.035, now + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(now);
                osc.stop(now + duration + 0.1);
            });

            this.step++;
        },

        togglePlay() {
            initAudio();
            this.isPlaying = !this.isPlaying;
            const playerWidget = document.getElementById('lofiPlayer');
            const playBtn = document.getElementById('lofiPlayBtn');

            if (this.isPlaying) {
                playerWidget.classList.add('lofi-playing');
                playBtn.textContent = '⏸';
                this.step = 0;
                this.playChord();
                const track = this.tracks[this.currentTrackIndex];
                const intervalMs = ((60 / track.bpm) * 2) * 1000;
                this.intervalId = setInterval(() => this.playChord(), intervalMs);
                showToast(`LO-FI SYNTH: Playing "${track.name}"`);
            } else {
                playerWidget.classList.remove('lofi-playing');
                playBtn.textContent = '▶';
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },

        nextTrack() {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
            this.updateTrackDisplay();
            if (this.isPlaying) {
                clearInterval(this.intervalId);
                this.step = 0;
                this.playChord();
                const track = this.tracks[this.currentTrackIndex];
                const intervalMs = ((60 / track.bpm) * 2) * 1000;
                this.intervalId = setInterval(() => this.playChord(), intervalMs);
            }
        },

        prevTrack() {
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
            this.updateTrackDisplay();
            if (this.isPlaying) {
                clearInterval(this.intervalId);
                this.step = 0;
                this.playChord();
                const track = this.tracks[this.currentTrackIndex];
                const intervalMs = ((60 / track.bpm) * 2) * 1000;
                this.intervalId = setInterval(() => this.playChord(), intervalMs);
            }
        },

        toggleMute() {
            this.isMuted = !this.isMuted;
            const muteBtn = document.getElementById('lofiMuteBtn');
            muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
        },

        updateTrackDisplay() {
            const trackNameDisplay = document.getElementById('trackNameDisplay');
            if (trackNameDisplay) {
                trackNameDisplay.textContent = this.tracks[this.currentTrackIndex].name;
            }
        }
    };

    // ===== DYNAMIC SAKURA & RETRO CYBER DUST CANVAS =====
    const AnimeCanvas = {
        canvas: null,
        ctx: null,
        petals: [],
        stars: [],
        enabled: true,
        animationFrameId: null,

        init() {
            this.canvas = document.getElementById('anime-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createElements();

            window.addEventListener('resize', () => this.resize());
            this.animate();
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },

        createElements() {
            this.petals = [];
            this.stars = [];
            const petalCount = window.innerWidth < 768 ? 22 : 45;
            const starCount = window.innerWidth < 768 ? 30 : 65;

            // Sakura Petals
            for (let i = 0; i < petalCount; i++) {
                this.petals.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: Math.random() * 8 + 6,
                    speedY: Math.random() * 1.2 + 0.6,
                    speedX: Math.random() * 0.8 - 0.2,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.03,
                    sway: Math.random() * Math.PI * 2,
                    swaySpeed: Math.random() * 0.02 + 0.01,
                    alpha: Math.random() * 0.45 + 0.35,
                    color: Math.random() > 0.3 ? '#ff70a6' : '#ff2a85'
                });
            }

            // Cyber Dust / Stars
            for (let i = 0; i < starCount; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    radius: Math.random() * 1.5 + 0.5,
                    color: Math.random() > 0.5 ? '#00f0ff' : '#9d4edd',
                    alpha: Math.random() * 0.8 + 0.2,
                    pulseSpeed: Math.random() * 0.03 + 0.01
                });
            }
        },

        animate() {
            if (!this.enabled) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw & Update Cyber Dust / Stars
            this.stars.forEach(s => {
                s.alpha += Math.sin(Date.now() * 0.002 * s.pulseSpeed) * 0.02;
                if (s.alpha < 0.1) s.alpha = 0.1;
                if (s.alpha > 0.9) s.alpha = 0.9;

                this.ctx.beginPath();
                this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = s.color;
                this.ctx.globalAlpha = s.alpha;
                this.ctx.shadowBlur = 6;
                this.ctx.shadowColor = s.color;
                this.ctx.fill();
            });

            // Draw & Update Sakura Petals
            this.petals.forEach(p => {
                p.y += p.speedY;
                p.sway += p.swaySpeed;
                p.x += Math.sin(p.sway) * 0.8 + p.speedX;
                p.rotation += p.rotSpeed;

                // Reset on bottom or right boundary
                if (p.y > this.canvas.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * this.canvas.width;
                }
                if (p.x > this.canvas.width + 20) p.x = -20;
                if (p.x < -20) p.x = this.canvas.width + 20;

                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = 'rgba(255, 42, 133, 0.4)';

                // Draw Sakura Petal Shape
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, p.size / 3, 0, p.size);
                this.ctx.bezierCurveTo(p.size, p.size / 3, p.size / 2, -p.size / 2, 0, 0);
                this.ctx.fill();

                this.ctx.restore();
            });

            this.ctx.globalAlpha = 1.0;
            this.ctx.shadowBlur = 0;
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        },

        toggle() {
            this.enabled = !this.enabled;
            if (this.enabled) {
                this.animate();
            } else {
                cancelAnimationFrame(this.animationFrameId);
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            return this.enabled;
        }
    };

    // ===== DYNAMIC HERO TYPEWRITER =====
    const Typewriter = {
        phrases: [
            "ASP.NET Core | Clean Architecture | SignalR ⚡",
            "Concurrency handling · Race conditions solved 👾",
            "SQL Server | Stored Procedures | EF Core 🚀",
            "PostgreSQL & PostGIS Geospatial Queries 🗺️",
            "DORMI: 3D Room Viewer via Three.js (R3F) 🎮",
            "200+ Concurrent users · Zero downtime 🛡️",
            "\"First, make it work. Then, make it right. Then, make it fast.\""
        ],
        textElement: null,
        phraseIndex: 0,
        charIndex: 0,
        isDeleting: false,
        typingSpeed: 60,

        init() {
            this.textElement = document.getElementById('typewriterText');
            if (!this.textElement) return;
            this.type();
        },

        type() {
            const currentPhrase = this.phrases[this.phraseIndex];

            if (this.isDeleting) {
                this.charIndex--;
                this.textElement.textContent = currentPhrase.substring(0, this.charIndex);
            } else {
                this.charIndex++;
                this.textElement.textContent = currentPhrase.substring(0, this.charIndex);
            }

            let delta = this.typingSpeed;

            if (!this.isDeleting && this.charIndex === currentPhrase.length) {
                delta = 2200; // Pause at full phrase
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
                delta = 400; // Short pause before next phrase
            } else if (this.isDeleting) {
                delta = 25; // Faster deletion
            }

            setTimeout(() => this.type(), delta);
        }
    };

    // ===== CYBER TERMINAL (CLI) MODAL & COMMAND PARSER =====
    const CyberTerminal = {
        modal: null,
        input: null,
        history: null,
        commandLog: [],
        logIndex: -1,

        init() {
            this.modal = document.getElementById('terminalModal');
            this.input = document.getElementById('termInput');
            this.history = document.getElementById('terminalHistory');

            if (!this.modal || !this.input) return;

            // Trigger terminal from button
            const termBtn = document.getElementById('termTrigger');
            if (termBtn) {
                termBtn.addEventListener('click', () => this.open());
            }

            // Close button & backdrop
            const closeBtn = document.getElementById('closeTermBtn');
            const backdrop = document.getElementById('terminalBackdrop');
            if (closeBtn) closeBtn.addEventListener('click', () => this.close());
            if (backdrop) backdrop.addEventListener('click', () => this.close());

            // Global Keyboard Shortcut: '>' or '~' opens terminal, ESC closes
            window.addEventListener('keydown', (e) => {
                if (e.key === '>' || e.key === '`') {
                    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        this.toggle();
                    }
                } else if (e.key === 'Escape' && this.isOpen()) {
                    this.close();
                }
            });

            // Input command submission & history navigation
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const cmd = this.input.value.trim();
                    if (cmd) {
                        this.execute(cmd);
                        this.commandLog.push(cmd);
                        this.logIndex = this.commandLog.length;
                    }
                    this.input.value = '';
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.logIndex > 0) {
                        this.logIndex--;
                        this.input.value = this.commandLog[this.logIndex];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.logIndex < this.commandLog.length - 1) {
                        this.logIndex++;
                        this.input.value = this.commandLog[this.logIndex];
                    } else {
                        this.logIndex = this.commandLog.length;
                        this.input.value = '';
                    }
                }
            });
        },

        isOpen() {
            return this.modal.classList.contains('open');
        },

        open() {
            this.modal.classList.add('open');
            this.modal.setAttribute('aria-hidden', 'false');
            setTimeout(() => this.input.focus(), 100);
            playSfx('click');
        },

        close() {
            this.modal.classList.remove('open');
            this.modal.setAttribute('aria-hidden', 'true');
            playSfx('click');
        },

        toggle() {
            if (this.isOpen()) this.close();
            else this.open();
        },

        printLine(text, className = '') {
            const line = document.createElement('div');
            line.className = `term-output-line ${className}`;
            line.innerHTML = text;
            this.history.appendChild(line);
            this.history.scrollTop = this.history.scrollHeight;
        },

        execute(cmd) {
            // Echo input
            this.printLine(`<span class="term-user-prompt">[khanh@neotokyo:~]$</span> ${cmd}`, 'dim');

            const lower = cmd.toLowerCase().trim();
            const args = lower.split(' ');

            switch (args[0]) {
                case 'help':
                    this.printLine(`AVAILABLE DIRECTIVES:`, 'cyan');
                    this.printLine(`  <span class="pink">whoami</span>    - Display developer dossier & bio`);
                    this.printLine(`  <span class="pink">skills</span>    - List primary technical weaponry`);
                    this.printLine(`  <span class="pink">projects</span>  - Review core production missions`);
                    this.printLine(`  <span class="pink">cv</span>        - Download current CV in PDF format`);
                    this.printLine(`  <span class="pink">contact</span>   - Show communication channels`);
                    this.printLine(`  <span class="pink">github</span>    - Open GitHub repository radar`);
                    this.printLine(`  <span class="pink">lofi</span>      - Toggle background ambient synth`);
                    this.printLine(`  <span class="pink">crt</span>       - Toggle CRT scanline overlay`);
                    this.printLine(`  <span class="pink">time</span>      - Current coordinates & Saigon time`);
                    this.printLine(`  <span class="pink">anime</span>     - Render ASCII anime Easter egg`);
                    this.printLine(`  <span class="pink">matrix</span>    - Stream digital rain`);
                    this.printLine(`  <span class="pink">clear / cls</span>- Clear console screen`);
                    break;

                case 'whoami':
                    this.printLine(`NAME: Lê Quốc Khánh (Le Quoc Khanh)`, 'cyan');
                    this.printLine(`ROLE: .NET Backend Developer (Full-Stack Capable)`);
                    this.printLine(`EDUCATION: FPT University - Software Engineering (Class of 2027)`);
                    this.printLine(`EXPERIENCE: FPT Software (Tester Intern - Jan 2026 to May 2026)`);
                    this.printLine(`MOTTO: "First, make it work. Then, make it right. Then, make it fast."`, 'amber');
                    break;

                case 'skills':
                    this.printLine(`CORE WEAPONRY ARSENAL:`, 'cyan');
                    this.printLine(`  Backend: C#, .NET 8/9/10, ASP.NET Core, EF Core, SignalR, MediatR`);
                    this.printLine(`  Databases: SQL Server (T-SQL, Stored Procs), PostgreSQL (PostGIS)`);
                    this.printLine(`  Architecture: Clean Architecture, CQRS, SOLID, Unit of Work`);
                    this.printLine(`  Frontend: React 18/19, TypeScript, Tailwind CSS, Three.js (R3F)`);
                    this.printLine(`  DevOps: Azure DevOps, Git, Docker, xUnit, Postman, Swagger`);
                    break;

                case 'projects':
                case 'missions':
                    this.printLine(`DEPLOYED MISSIONS:`, 'cyan');
                    this.printLine(`  1. <strong class="pink">EV Charging Station (SkaEV)</strong>: Team Lead & Backend Dev (.NET 9, SignalR, NetTopologySuite)`);
                    this.printLine(`  2. <strong class="pink">OmniStock ERP</strong>: Decoupled CQRS via MediatR & SignalR Live Stock`);
                    this.printLine(`  3. <strong class="pink">DORMI</strong>: Rental matching platform with PostGIS & Three.js 3D inspection`);
                    this.printLine(`  4. <strong class="pink">Event Department Web</strong>: Operations platform for Cóc Sài Gòn (Firestore)`);
                    this.printLine(`  5. <strong class="pink">FlappyBird Game</strong>: Layered WPF engine on .NET 9`);
                    break;

                case 'cv':
                case 'resume':
                    this.printLine(`INITIALIZING DOSSIER DOWNLOAD...`, 'amber');
                    const cvLink = document.getElementById('downloadCvBtn');
                    if (cvLink) cvLink.click();
                    this.printLine(`[SUCCESS] File "Le_Quoc_Khanh_CV.pdf" transmitted.`, 'cyan');
                    playSfx('success');
                    break;

                case 'contact':
                    this.printLine(`COMMUNICATION CHANNELS:`, 'cyan');
                    this.printLine(`  Email:    <a href="mailto:lqkhanh292005@gmail.com" class="pink">lqkhanh292005@gmail.com</a>`);
                    this.printLine(`  Phone:    0911 887 141 (Zalo)`);
                    this.printLine(`  LinkedIn: <a href="https://linkedin.com/in/lqkhanh295" target="_blank" class="cyan">linkedin.com/in/lqkhanh295</a>`);
                    this.printLine(`  GitHub:   <a href="https://github.com/lqkhanh295" target="_blank" class="cyan">github.com/lqkhanh295</a>`);
                    break;

                case 'github':
                    this.printLine(`Routing to https://github.com/lqkhanh295...`, 'cyan');
                    window.open('https://github.com/lqkhanh295', '_blank');
                    break;

                case 'lofi':
                    LofiPlayer.togglePlay();
                    this.printLine(`LO-FI SYNTH: State toggled.`, 'amber');
                    break;

                case 'crt':
                    const crtBtn = document.getElementById('crtToggle');
                    if (crtBtn) crtBtn.click();
                    this.printLine(`CRT Scanlines toggled.`, 'cyan');
                    break;

                case 'time':
                    const now = new Date();
                    const options = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, dateStyle: 'full', timeStyle: 'medium' };
                    this.printLine(`BASE COORDINATES: 10.8231° N, 106.6297° E (Ho Chi Minh City, VN)`);
                    this.printLine(`LOCAL TIME: ${new Intl.DateTimeFormat('en-US', options).format(now)}`, 'cyan');
                    break;

                case 'anime':
                    this.printLine(`
   (\\_/)
   ( •_•)    "Code with passion, optimize with precision."
   / >⚡     -- Lê Quốc Khánh [レ・クォック・カイン]
                    `, 'pink');
                    break;

                case 'matrix':
                    this.printLine(`01001100 01000101 00100000 01010001 01010101 01001111 01000011 00100000 01001011 01001000 01000001 01001110 01001000`, 'amber');
                    this.printLine(`SYSTEM STATUS: ALL CIRCUITS NOMINAL. WEBSOCKET SYNC ESTABLISHED.`, 'cyan');
                    break;

                case 'clear':
                case 'cls':
                    this.history.innerHTML = '';
                    break;

                default:
                    this.printLine(`Directive not recognized: "${cmd}". Type <span class="cyan">'help'</span> for instructions.`, 'amber');
                    playSfx('error');
                    break;
            }
        }
    };

    // ===== TOAST NOTIFICATION =====
    function showToast(message) {
        const toast = document.getElementById('cyberToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        playSfx('success');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }

    // ===== KONAMI CODE EASTER EGG (↑ ↑ ↓ ↓ ← → ← → B A) =====
    function setupKonamiCode() {
        const konamiSequence = [
            'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
            'b', 'a'
        ];
        let konamiIndex = 0;

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === konamiSequence[konamiIndex].toLowerCase()) {
                konamiIndex++;
                if (konamiIndex === konamiSequence.length) {
                    konamiIndex = 0;
                    activateKonamiEasterEgg();
                }
            } else {
                konamiIndex = 0;
            }
        });
    }

    function activateKonamiEasterEgg() {
        playSfx('success');
        showToast("⚡ KONAMI CODE ACCEPTED! GOD-MODE DEV CLI UNLOCKED!");
        CyberTerminal.open();
        CyberTerminal.printLine(`========================================================================`, 'pink');
        CyberTerminal.printLine(`>>> SECRET EASTER EGG UNLOCKED! WELCOME TO NEO-TOKYO SYSTEM ROOT! <<<`, 'cyan');
        CyberTerminal.printLine(`Developer: Lê Quốc Khánh is ready for production missions!`, 'amber');
        CyberTerminal.printLine(`========================================================================`, 'pink');
    }

    // ===== SKILL & PROJECT FILTER CHIPS =====
    function setupFilters() {
        // Skill Filter Chips
        const skillButtons = document.querySelectorAll('#skillFilters .filter-chip');
        const arsenalCards = document.querySelectorAll('#arsenalGrid .arsenal-card');

        skillButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                skillButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');

                arsenalCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Mission Filter Chips
        const missionButtons = document.querySelectorAll('#missionFilters .filter-chip');
        const missionCards = document.querySelectorAll('#missionsContainer .mission-card');

        missionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                missionButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-mission-filter');

                missionCards.forEach(card => {
                    const catString = card.getAttribute('data-mission-cat') || '';
                    if (filter === 'all' || catString.includes(filter)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // ===== HEADER TOGGLES: CRT, SAKURA, SFX, MOBILE =====
    function setupHeaderControls() {
        // 1. CRT Mode
        const crtBtn = document.getElementById('crtToggle');
        const isCrt = localStorage.getItem('lqk_crt_mode') !== 'false';
        if (!isCrt) {
            document.body.classList.remove('crt-mode');
            if (crtBtn) crtBtn.classList.remove('active');
        } else {
            document.body.classList.add('crt-mode');
            if (crtBtn) crtBtn.classList.add('active');
        }

        if (crtBtn) {
            crtBtn.addEventListener('click', () => {
                const active = document.body.classList.toggle('crt-mode');
                crtBtn.classList.toggle('active', active);
                localStorage.setItem('lqk_crt_mode', active);
                showToast(`CRT SCANLINE: ${active ? 'ENABLED [📺]' : 'DISABLED'}`);
            });
        }

        // 2. Sakura Canvas Toggle
        const sakuraBtn = document.getElementById('sakuraToggle');
        if (sakuraBtn) {
            sakuraBtn.addEventListener('click', () => {
                const state = AnimeCanvas.toggle();
                sakuraBtn.classList.toggle('active', state);
                showToast(`SAKURA & CYBER DUST: ${state ? 'ENABLED [🌸]' : 'PAUSED'}`);
            });
        }

        // 3. Sound FX Toggle
        const sfxBtn = document.getElementById('sfxToggle');
        const sfxIcon = document.getElementById('sfxIcon');
        const savedSfx = localStorage.getItem('lqk_sfx_mode');
        if (savedSfx === 'false') {
            sfxEnabled = false;
            if (sfxBtn) sfxBtn.classList.remove('active');
            if (sfxIcon) sfxIcon.textContent = '🔇';
        }

        if (sfxBtn) {
            sfxBtn.addEventListener('click', () => {
                sfxEnabled = !sfxEnabled;
                sfxBtn.classList.toggle('active', sfxEnabled);
                if (sfxIcon) sfxIcon.textContent = sfxEnabled ? '🔊' : '🔇';
                localStorage.setItem('lqk_sfx_mode', sfxEnabled);
                showToast(`8-BIT SFX: ${sfxEnabled ? 'ENABLED [🔊]' : 'MUTED [🔇]'}`);
            });
        }

        // 4. Mobile Menu Toggle
        const mobileToggle = document.getElementById('mobileToggle');
        const cyberNav = document.getElementById('cyberNav');
        if (mobileToggle && cyberNav) {
            mobileToggle.addEventListener('click', () => {
                cyberNav.classList.toggle('open');
            });

            // Close on link click
            cyberNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    cyberNav.classList.remove('open');
                });
            });
        }

        // 5. Header scroll effect
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ===== LO-FI PLAYER WIDGET CONTROLS =====
    function setupLofiWidget() {
        const tabToggle = document.getElementById('lofiTabToggle');
        const playerWidget = document.getElementById('lofiPlayer');
        const playBtn = document.getElementById('lofiPlayBtn');
        const nextBtn = document.getElementById('lofiNextBtn');
        const prevBtn = document.getElementById('lofiPrevBtn');
        const muteBtn = document.getElementById('lofiMuteBtn');

        if (tabToggle && playerWidget) {
            tabToggle.addEventListener('click', () => {
                playerWidget.classList.toggle('minimized');
            });
        }

        if (playBtn) playBtn.addEventListener('click', () => LofiPlayer.togglePlay());
        if (nextBtn) nextBtn.addEventListener('click', () => LofiPlayer.nextTrack());
        if (prevBtn) prevBtn.addEventListener('click', () => LofiPlayer.prevTrack());
        if (muteBtn) muteBtn.addEventListener('click', () => LofiPlayer.toggleMute());
    }

    // ===== NAVBAR SCROLL SPY & SMOOTH SCROLL =====
    function setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.cyber-nav .nav-item');

        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY + 120;
            sections.forEach(sec => {
                const top = sec.offsetTop;
                const height = sec.offsetHeight;
                const id = sec.getAttribute('id');

                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }

    // ===== LIVE CLOCK (HO CHI MINH CITY GMT+7) =====
    function setupLiveClock() {
        const clockDisplay = document.getElementById('localTimeDisplay');
        if (!clockDisplay) return;

        function updateTime() {
            const now = new Date();
            const options = {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            const timeString = new Intl.DateTimeFormat('en-GB', options).format(now);
            clockDisplay.textContent = `LOCAL TIME: ${timeString} (ICT / GMT+7)`;
        }

        updateTime();
        setInterval(updateTime, 1000);
    }

    // ===== CONTACT FORM SIMULATION =====
    function setupContactForm() {
        const form = document.getElementById('contactForm');
        const consoleBox = document.getElementById('formResponseConsole');
        const respText = document.getElementById('respText');
        const transmitBtn = document.getElementById('transmitBtn');

        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('senderName').value;
            const email = document.getElementById('senderEmail').value;
            const subject = document.getElementById('senderSubject').value || 'New Opportunity';
            const message = document.getElementById('senderMsg').value;

            transmitBtn.disabled = true;
            consoleBox.style.display = 'block';
            respText.innerHTML = `ENCRYPTING PAYLOAD WITH 256-BIT KEY... <span class="pulse-dot"></span>`;

            setTimeout(() => {
                respText.innerHTML = `ROUTING PACKET TO KHANH (lqkhanh292005@gmail.com)...`;
            }, 800);

            setTimeout(() => {
                respText.innerHTML = `TRANSMISSION CONFIRMED! Thank you, <strong>${name}</strong>. Opening direct mail client fallback...`;
                playSfx('success');
                showToast("TRANSMISSION SENT SUCCESSFULLY!");

                // Open mailto fallback with prefilled content
                const mailtoUrl = `mailto:lqkhanh292005@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Sender: " + name + "\nEmail: " + email + "\n\n" + message)}`;
                window.location.href = mailtoUrl;

                form.reset();
                transmitBtn.disabled = false;
            }, 1800);
        });
    }

    // ===== INITIALIZE ALL MODULES =====
    document.addEventListener('DOMContentLoaded', () => {
        AnimeCanvas.init();
        Typewriter.init();
        CyberTerminal.init();
        setupKonamiCode();
        setupFilters();
        setupHeaderControls();
        setupLofiWidget();
        setupScrollSpy();
        setupLiveClock();
        setupContactForm();
        attachSoundListeners();

        console.log('%c⚡ NEO-TOKYO SYSTEM ONLINE // LÊ QUỐC KHÁNH', 'color: #00f0ff; font-weight: bold; font-size: 14px; background: #0d0c1d; padding: 4px 8px; border-radius: 4px;');
        console.log('%cType "help" in the terminal or press ">" to explore.', 'color: #ff2a85; font-size: 12px;');
    });
})();
