/**
 * ==========================================================================
 * JAPANESE ANIMATED STORYBOOK WORLD · INTERACTIONS
 * Developer: Lê Quốc Khánh // Software Engineer
 * Philosophy: Quiet, accessible, performant, unobtrusive
 * ==========================================================================
 */

(function () {
    'use strict';

    // ===== 1. STICKY NAVBAR & SCROLLSPY =====
    function setupNavigation() {
        const header = document.getElementById('siteHeader');
        const sections = document.querySelectorAll('section[id]');
        const navAnchors = document.querySelectorAll('.nav-anchor');
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        // Sticky Navbar shadow on scroll
        function handleScroll() {
            if (!header) return;
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Scrollspy active anchor
            const scrollPos = window.scrollY + 140;
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos < top + height) {
                    navAnchors.forEach(link => {
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

        // Mobile Nav Toggle
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function () {
                const isOpen = navMenu.classList.toggle('open');
                navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            // Close mobile nav when clicking any link
            navAnchors.forEach(link => {
                link.addEventListener('click', function () {
                    navMenu.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    // ===== 2. STATIONERY CORRESPONDENCE FORM =====
    function setupContactForm() {
        const form = document.getElementById('contactForm');
        const statusMsg = document.getElementById('formStatus');
        const sendBtn = document.getElementById('sendBtn');

        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('nameInput').value.trim();
            const email = document.getElementById('emailInput').value.trim();
            const message = document.getElementById('messageInput').value.trim();

            if (!name || !email || !message) return;

            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.textContent = 'Writing letter...';
            }
            if (statusMsg) {
                statusMsg.textContent = 'Preparing correspondence note...';
            }

            setTimeout(function () {
                if (statusMsg) {
                    statusMsg.textContent = 'Thank you. Opening your email client...';
                }

                // Construct mailto link
                const subject = encodeURIComponent(`Correspondence from ${name}`);
                const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\nNote:\n${message}`);
                const mailtoUrl = `mailto:lqkhanh292005@gmail.com?subject=${subject}&body=${body}`;

                window.location.href = mailtoUrl;

                form.reset();
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send Note Directly →';
                }
            }, 500);
        });
    }

    // ===== 3. HERO PARALLAX & AMBIENT VISIBILITY CONTROLLER =====
    function setupAmbientAtmosphere() {
        // Respect prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const heroPainting = document.querySelector('.hero-bg-painting');
        const heroSection = document.getElementById('hero');

        if (!heroPainting || !heroSection) return;

        // Subtle gentle mouse movement parallax for the painting window
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        let isHeroVisible = true;

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isHeroVisible = entry.isIntersecting;
            });
        }, { threshold: 0.1 });

        observer.observe(heroSection);

        window.addEventListener('mousemove', function (e) {
            if (!isHeroVisible) return;
            const x = (e.clientX / window.innerWidth - 0.5) * 16;
            const y = (e.clientY / window.innerHeight - 0.5) * 12;
            targetX = x;
            targetY = y;
        }, { passive: true });

        function animateParallax() {
            if (isHeroVisible) {
                mouseX += (targetX - mouseX) * 0.05;
                mouseY += (targetY - mouseY) * 0.05;
                heroPainting.style.transform = `scale(1.03) translate(${mouseX * -0.4}px, ${mouseY * -0.4}px)`;
            }
            requestAnimationFrame(animateParallax);
        }

        animateParallax();
    }

    // ===== INITIALIZE =====
    document.addEventListener('DOMContentLoaded', function () {
        setupNavigation();
        setupContactForm();
        setupAmbientAtmosphere();
    });
})();
