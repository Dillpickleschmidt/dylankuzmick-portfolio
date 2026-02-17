/**
 * Segfault easter egg — glitch effect + crash screen.
 * Technique: https://stanko.io/css-only-glitch-effect
 */

const ANIMS = ["glitch-1", "glitch-2", "glitch-3"];
const STRIP_COUNT = 12;

const SKULL = `\
    ___
   /   \\
  | x x |
   \\_^_/`;

/**
 * Build a glitch overlay: an absolutely-positioned container full of
 * horizontal strips, each showing a displaced slice of the original content.
 */
function buildGlitchOverlay(source: HTMLElement, intensity = 1): HTMLElement {
  const h = source.offsetHeight;
  const w = source.offsetWidth;

  // Clone once before creating any strips
  const snapshot = source.cloneNode(true) as HTMLElement;
  // Remove glitch-root positioning from the clone so it doesn't interfere
  snapshot.classList.remove("glitch-root");
  snapshot.style.position = "absolute";
  snapshot.style.top = "0";
  snapshot.style.left = "0";
  snapshot.style.width = w + "px";
  snapshot.style.height = h + "px";
  snapshot.style.margin = "0";

  // Container that covers the entire component
  const overlay = document.createElement("div");
  overlay.className = "glitch-overlay";
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.zIndex = "11";
  overlay.style.overflow = "hidden";
  overlay.style.pointerEvents = "none";

  let y = 0;
  while (y < h) {
    const sh = Math.max(3, Math.floor(Math.random() * (h / STRIP_COUNT) * 2));
    const clampedH = Math.min(sh, h - y);

    const strip = document.createElement("div");
    strip.className = "glitch-strip";
    strip.style.top = y + "px";
    strip.style.height = clampedH + "px";

    // Random displacement and hue values per strip
    const s = intensity;
    strip.style.setProperty("--gx1", (Math.random() * 30 * s - 15 * s).toFixed(0) + "px");
    strip.style.setProperty("--gx2", (Math.random() * 30 * s - 15 * s).toFixed(0) + "px");
    strip.style.setProperty("--gh1", (Math.random() * 50 * s - 25 * s).toFixed(0) + "deg");
    strip.style.setProperty("--gh2", (Math.random() * 50 * s - 25 * s).toFixed(0) + "deg");

    // Each strip gets its own clone, offset so the right slice is visible
    const inner = snapshot.cloneNode(true) as HTMLElement;
    inner.style.top = -y + "px";
    strip.appendChild(inner);

    // Randomize which animation variant, duration, and delay
    const anim = ANIMS[Math.floor(Math.random() * ANIMS.length)];
    const dur = 400 + Math.random() * 300;
    strip.style.animation = `${anim} ${dur.toFixed(0)}ms linear infinite`;
    strip.style.animationDelay = (Math.random() * 150).toFixed(0) + "ms";

    overlay.appendChild(strip);
    y += clampedH;
  }

  return overlay;
}

function createSegfaultOverlay(): HTMLElement {
  const sf = document.createElement("div");
  sf.className = "glitch-segfault";
  sf.innerHTML =
    `<pre>${SKULL}</pre>` +
    '<div class="glitch-segfault-msg">Segmentation fault (core dumped)</div>' +
    '<div class="glitch-segfault-detail">' +
    "[12.481032] chromium[4821]: segfault at 0<br>" +
    "ip 00007f3a rsp 00007ffd err 6 in libcontent.so" +
    "</div>";
  return sf;
}

/**
 * Single-fire glitch effect.
 */
export function glitchOnce(
  el: HTMLElement,
  config: { duration: number; intensity?: number; onComplete?: () => void },
) {
  const overlay = buildGlitchOverlay(el, config.intensity ?? 1);
  el.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
    config.onComplete?.();
  }, config.duration);
}

/**
 * Wire up close-button segfault easter egg on a component.
 */
export function initSegfault(root: HTMLElement, closeSelector: string) {
  let active = false;

  root.querySelectorAll(closeSelector).forEach((btn) => {
    btn.addEventListener("click", () => {
      if (active) return;
      active = true;

      glitchOnce(root, {
        duration: 800,
        onComplete: () => {
          const sf = createSegfaultOverlay();
          root.appendChild(sf);

          setTimeout(() => {
            glitchOnce(root, {
              duration: 250,
              onComplete: () => {
                sf.remove();
                active = false;
              },
            });
          }, 1200);
        },
      });
    });
  });
}
