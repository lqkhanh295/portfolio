/**
 * Visual direction: illustrated Japanese countryside, restrained motion.
 * GSAP + ScrollTrigger choreograph the page; Three.js adds a low-cost layer
 * of drifting pollen in the hero. All motion respects reduced-motion settings.
 */
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/index.js";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/ScrollTrigger.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

function setupReadingProgress() {
  const track = document.createElement("div");
  track.className = "reading-progress";
  track.setAttribute("aria-hidden", "true");
  track.innerHTML = '<span class="reading-progress-fill"></span>';
  document.body.appendChild(track);

  gsap.to(track.firstElementChild, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.2 }
  });
}

function setupScrollStory() {
  if (reduceMotion) {
    document.documentElement.classList.add("motion-reduced");
    return;
  }

  const introTargets = gsap.utils.toArray(".scene-intro-block");
  introTargets.forEach((block) => {
    const pieces = block.querySelectorAll(".scene-chapter-tag, .scene-title, .scene-subtitle");
    gsap.fromTo(pieces,
      { y: 22, autoAlpha: 0 },
      {
        y: 0, autoAlpha: 1, duration: 0.72, stagger: 0.09, ease: "power3.out",
        scrollTrigger: { trigger: block, start: "top 84%", once: true }
      }
    );
  });

  const projectGroups = [
    ...document.querySelectorAll(".featured-project-plate"),
    ...document.querySelectorAll(".notebook-project-card"),
    ...document.querySelectorAll(".timeline-item, .skill-group, .personal-dossier-card, .correspondence-card")
  ];
  projectGroups.forEach((element) => {
    gsap.fromTo(element,
      { y: 24, autoAlpha: 0 },
      {
        y: 0, autoAlpha: 1, duration: 0.72, ease: "power2.out",
        scrollTrigger: { trigger: element, start: "top 91%", once: true }
      }
    );
  });

  const hero = document.querySelector(".hero-scenic-window");
  const painting = document.querySelector(".hero-bg-painting");
  if (hero && painting && !coarsePointer) {
    gsap.fromTo(painting, { scale: 1.075 }, {
      scale: 1.015,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.45 }
    });
  }

  const identity = document.querySelector(".hero-identity-overlay");
  if (identity) {
    gsap.fromTo(identity,
      { y: 26, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, delay: 0.12, ease: "power3.out" }
    );
  }

  gsap.utils.toArray(".notebook-project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (coarsePointer) return;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, { rotateY: px * 2.2, rotateX: py * -1.8, transformPerspective: 900, duration: 0.35, ease: "power2.out", overwrite: true });
    });
    card.addEventListener("pointerleave", () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.45, ease: "power2.out", overwrite: true });
    });
  });
}

function setupThreeAtmosphere() {
  const canvas = document.getElementById("hero-atmosphere");
  const host = canvas?.parentElement;
  if (!canvas || !host || reduceMotion || coarsePointer || !("WebGLRenderingContext" in window)) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power"
    });
  } catch {
    canvas.hidden = true;
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.z = 22;

  const count = window.innerWidth < 900 ? 42 : 88;
  const positions = new Float32Array(count * 3);
  const drift = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    drift[i] = 0.08 + Math.random() * 0.16;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: "#f7e6b7",
    size: 0.075,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    sizeAttenuation: true
  });
  const pollen = new THREE.Points(geometry, material);
  scene.add(pollen);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 700 ? 27 : 22;
    camera.updateProjectionMatrix();
  };
  resize();

  let visible = true;
  let frame = 0;
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) render();
  }, { threshold: 0.01 });
  observer.observe(host);

  const onVisibility = () => {
    visible = !document.hidden && host.getBoundingClientRect().bottom > 0 && host.getBoundingClientRect().top < window.innerHeight;
    if (visible) render();
  };

  function render() {
    if (!visible || document.hidden) return;
    frame = requestAnimationFrame(render);
    const attr = geometry.attributes.position;
    const time = performance.now() * 0.0001;
    for (let i = 0; i < count; i++) {
      const yIndex = i * 3 + 1;
      attr.array[yIndex] += drift[i] * 0.003;
      if (attr.array[yIndex] > 8) attr.array[yIndex] = -8;
      attr.array[i * 3] += Math.sin(time + i) * 0.0008;
    }
    attr.needsUpdate = true;
    pollen.rotation.z = Math.sin(time * 0.7) * 0.018;
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  render();
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  }, { once: true });
}

function setupMicrointeractions() {
  document.querySelectorAll(".nav-anchor, .nav-cv-btn, .btn-anime-primary, .btn-anime-secondary").forEach((link) => {
    link.addEventListener("focus", () => link.classList.add("is-keyboard-focused"));
    link.addEventListener("blur", () => link.classList.remove("is-keyboard-focused"));
  });

  if (!reduceMotion) {
    gsap.utils.toArray(".hero-chapter-pill, .hero-vignette-stamp").forEach((item, index) => {
      gsap.fromTo(item, { y: 8, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.7, delay: 0.2 + index * 0.08, ease: "power2.out"
      });
    });
  }
}

function init() {
  setupReadingProgress();
  setupScrollStory();
  setupThreeAtmosphere();
  setupMicrointeractions();
  ScrollTrigger.refresh();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
