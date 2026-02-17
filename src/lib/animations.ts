/**
 * Page animations — declarative configs with minimal imperative glue.
 *
 * Each animation is a self-contained function that takes a config object
 * and returns a cleanup function (for future SPA use if needed).
 */

import "../styles/glitch.css";
import { glitchOnce } from "./glitch";
import { cameraShake } from "./camera-shake";

// ---------------------------------------------------------------------------
// Typewriter
// ---------------------------------------------------------------------------

interface TypewriterConfig {
  /** Selector for the individual character elements */
  charSelector: string;
  /** Selector for the cursor element */
  cursorSelector: string;
  /** Delay before typing starts (ms) */
  startDelay: number;
  /** Base delay between characters (ms) — actual delay is base + random jitter */
  baseDelay: number;
  /** Random jitter added to baseDelay (ms) */
  jitter: number;
  /**
   * Slowdown applied to the last N characters.
   * Each entry is [remainingCount, baseDelay, jitter].
   * Checked from first to last — first match wins.
   */
  slowdown: [remaining: number, base: number, jitter: number][];
  /** Delay before hiding cursor after typing completes (ms) */
  cursorLingerDelay: number;
  /** Called after typing completes and cursor hides */
  onComplete?: () => void;
}

function typewriter(config: TypewriterConfig) {
  const chars = document.querySelectorAll<HTMLElement>(config.charSelector);
  const cursor = document.querySelector<HTMLElement>(config.cursorSelector);
  if (!chars.length || !cursor) return () => {};

  let index = 0;
  let timer: ReturnType<typeof setTimeout>;

  function delayForPosition(): number {
    const remaining = chars.length - index;
    for (const [threshold, base, jitter] of config.slowdown) {
      if (remaining <= threshold) return base + Math.random() * jitter;
    }
    return config.baseDelay + Math.random() * config.jitter;
  }

  function step() {
    if (index < chars.length) {
      chars[index].classList.add("typed");
      index++;
      timer = setTimeout(step, delayForPosition());
    } else {
      timer = setTimeout(() => {
        cursor.classList.add("done");
        config.onComplete?.();
      }, config.cursorLingerDelay);
    }
  }

  timer = setTimeout(step, config.startDelay);
  return () => clearTimeout(timer);
}

// ---------------------------------------------------------------------------
// Scroll Reveal
// ---------------------------------------------------------------------------

interface ScrollRevealConfig {
  /** Selector for elements to reveal */
  selector: string;
  /** IntersectionObserver threshold */
  threshold: number;
  /** IntersectionObserver rootMargin */
  rootMargin: string;
}

function scrollReveal(config: ScrollRevealConfig) {
  const elements = document.querySelectorAll<HTMLElement>(config.selector);
  if (!elements.length) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = getComputedStyle(entry.target).getPropertyValue("--reveal-delay") || "0ms";
          (entry.target as HTMLElement).style.transitionDelay = delay;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: config.threshold, rootMargin: config.rootMargin },
  );

  elements.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

// ---------------------------------------------------------------------------
// Init — called from the page
// ---------------------------------------------------------------------------

export function initAnimations() {
  const heroImage = document.querySelector<HTMLElement>(".hero-image");
  if (heroImage) cameraShake(heroImage);

  const heroSpark = document.querySelector<HTMLElement>("#hero-spark");

  typewriter({
    charSelector: "#hero-spark .hero-char",
    cursorSelector: "#hero-cursor",
    startDelay: 400,
    baseDelay: 90,
    jitter: 60,
    slowdown: [
      [1, 400, 200],
      [2, 250, 100],
    ],
    cursorLingerDelay: 200,
    onComplete: () => {
      if (heroSpark) glitchOnce(heroSpark, { duration: 400, intensity: 0.5 });
    },
  });

  scrollReveal({
    selector: ".reveal",
    threshold: 0.08,
    rootMargin: "0px 0px -30px 0px",
  });
}
