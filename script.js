/**
 * ==========================================================================
 * DEVELOPER JOURNAL INTERACTIONS
 * Developer: Lê Quốc Khánh // Software Engineer
 * Philosophy: Quiet, accessible, unobtrusive
 * ==========================================================================
 */

(function () {
    'use strict';

    // ===== ACTIVE NAVIGATION HIGHLIGHT ON SCROLL =====
    function setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navAnchors = document.querySelectorAll('.journal-nav .nav-anchor');

        if (!sections.length || !navAnchors.length) return;

        function onScroll() {
            const scrollPosition = window.scrollY + 120;

            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPosition >= top && scrollPosition < top + height) {
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

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ===== STATIONERY CONTACT FORM HANDLING =====
    function setupContactForm() {
        const form = document.getElementById('contactForm');
        const statusElement = document.getElementById('formStatus');
        const sendBtn = document.getElementById('sendBtn');

        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('nameInput').value.trim();
            const email = document.getElementById('emailInput').value.trim();
            const message = document.getElementById('messageInput').value.trim();

            if (!name || !email || !message) return;

            if (sendBtn) sendBtn.disabled = true;
            if (statusElement) statusElement.textContent = 'Preparing correspondence...';

            setTimeout(() => {
                if (statusElement) {
                    statusElement.textContent = 'Thank you. Opening your email client to send note...';
                }

                // Construct mailto URL
                const subject = encodeURIComponent(`Correspondence from ${name}`);
                const body = encodeURIComponent(`Sender: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
                const mailtoUrl = `mailto:lqkhanh292005@gmail.com?subject=${subject}&body=${body}`;

                window.location.href = mailtoUrl;

                form.reset();
                if (sendBtn) sendBtn.disabled = false;
            }, 600);
        });
    }

    // ===== INITIALIZE =====
    document.addEventListener('DOMContentLoaded', function () {
        setupScrollSpy();
        setupContactForm();
    });
})();
