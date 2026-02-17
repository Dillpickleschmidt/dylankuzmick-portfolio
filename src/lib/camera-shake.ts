/**
 * Handheld camera shake — organic drift using layered sine waves.
 * Slightly oversizes the element so edges never peek through during movement.
 */

interface ShakeLayer {
  freqX: number;
  freqY: number;
  ampX: number;
  ampY: number;
  phaseX: number;
  phaseY: number;
}

interface CameraShakeConfig {
  /** Max translate in px */
  amplitude?: number;
  /** Speed multiplier (1 = default) */
  speed?: number;
  /** Number of layered sine waves for organic feel */
  layers?: number;
}

export function cameraShake(
  el: HTMLElement,
  config: CameraShakeConfig = {},
): () => void {
  const {
    amplitude = 4,
    speed = 1,
    layers: layerCount = 4,
  } = config;

  // Slightly scale up so movement doesn't reveal edges
  el.style.scale = "1.05";

  // Build layers with varied frequencies and random phase offsets
  const layers: ShakeLayer[] = Array.from({ length: layerCount }, (_, i) => {
    const base = 0.25 + i * 0.18;
    return {
      freqX: base * (0.8 + Math.random() * 0.4) * speed,
      freqY: base * (0.8 + Math.random() * 0.4) * speed,
      ampX: amplitude / (1 + i * 0.6),
      ampY: amplitude / (1 + i * 0.6),
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
    };
  });

  let frameId: number;

  function tick(now: number) {
    const t = now / 1000;
    let x = 0;
    let y = 0;

    for (const l of layers) {
      x += Math.sin(t * l.freqX + l.phaseX) * l.ampX;
      y += Math.sin(t * l.freqY + l.phaseY) * l.ampY;
    }

    el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    frameId = requestAnimationFrame(tick);
  }

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frameId);
    el.style.transform = "";
    el.style.scale = "";
  };
}
