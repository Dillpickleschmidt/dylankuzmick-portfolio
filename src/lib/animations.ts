/**
 * Page animations — declarative configs with minimal imperative glue.
 *
 * Each animation is a self-contained function that takes a config object
 * and returns a cleanup function (for future SPA use if needed).
 */

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
      timer = setTimeout(() => cursor.classList.add("done"), config.cursorLingerDelay);
    }
  }

  timer = setTimeout(step, config.startDelay);
  return () => clearTimeout(timer);
}

// ---------------------------------------------------------------------------
// Random Drift
// ---------------------------------------------------------------------------

interface DriftConfig {
  /** Selectors for the two elements that drift in opposite directions */
  selectors: [string, string];
  /** Probability (0–1) of staying still on a given tick */
  stillChance: number;
  /** Min/max displacement (px) — picks a random value in this range */
  displacement: [min: number, max: number];
  /** Min/max interval between drift ticks (ms) */
  interval: [min: number, max: number];
  /** Delay before first drift (ms) */
  startDelay: number;
}

function randomDrift(config: DriftConfig) {
  const [elA, elB] = config.selectors.map((s) => document.querySelector<HTMLElement>(s));
  if (!elA || !elB) return () => {};

  let timer: ReturnType<typeof setTimeout>;

  function tick() {
    const shouldStay = Math.random() < config.stillChance;
    if (shouldStay) {
      elA.style.transform = "translateX(0)";
      elB.style.transform = "translateX(0)";
    } else {
      const sign = Math.random() < 0.5 ? -1 : 1;
      const [min, max] = config.displacement;
      const dx = sign * (min + Math.random() * (max - min));
      elA.style.transform = `translateX(${-dx}px)`;
      elB.style.transform = `translateX(${dx}px)`;
    }
    const [minInt, maxInt] = config.interval;
    timer = setTimeout(tick, minInt + Math.random() * (maxInt - minInt));
  }

  timer = setTimeout(tick, config.startDelay);
  return () => clearTimeout(timer);
}

// ---------------------------------------------------------------------------
// Marquee with center-pulse
// ---------------------------------------------------------------------------

interface MarqueeConfig {
  /** Selector for the scrolling container */
  containerSelector: string;
  /** Selector for individual items that receive the pulse effect */
  itemSelector: string;
  /** Scroll speed in pixels per second */
  speed: number;
  /** Max scale multiplier at center (e.g. 0.15 = up to 1.15x) */
  pulseScale: number;
  /** Opacity range [min, max] — interpolated based on distance from center */
  pulseOpacity: [min: number, max: number];
}

function marquee(config: MarqueeConfig) {
  const container = document.querySelector<HTMLElement>(config.containerSelector);
  if (!container) return () => {};

  const items = container.querySelectorAll<HTMLElement>(config.itemSelector);
  let halfWidth = 0;
  let offset = 0;
  let lastTime = 0;
  let frameId: number;

  function measure() {
    halfWidth = container.scrollWidth / 2;
  }

  function updatePulse() {
    const vw = window.innerWidth;
    const center = vw / 2;
    const [minOpacity, maxOpacity] = config.pulseOpacity;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const proximity = Math.max(0, 1 - Math.abs(itemCenter - center) / (vw * 0.5));
      item.style.transform = `scale(${1 + proximity * config.pulseScale})`;
      item.style.opacity = String(minOpacity + proximity * (maxOpacity - minOpacity));
    });
  }

  function tick(now: number) {
    if (!lastTime) {
      lastTime = now;
      measure();
    }
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (halfWidth > 0) {
      offset = (offset + config.speed * dt) % halfWidth;
      container.style.transform = `translateX(-${offset}px)`;
      updatePulse();
    }
    frameId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", measure);
  frameId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", measure);
  };
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
  });

  randomDrift({
    selectors: [".hero-line-top", ".hero-line-bottom"],
    stillChance: 0.35,
    displacement: [4, 6],
    interval: [2000, 5000],
    startDelay: 2000,
  });

  marquee({
    containerSelector: "#marquee",
    itemSelector: ".marquee-item",
    speed: 35,
    pulseScale: 0.15,
    pulseOpacity: [0.45, 1],
  });

  scrollReveal({
    selector: ".reveal",
    threshold: 0.08,
    rootMargin: "0px 0px -30px 0px",
  });
}
