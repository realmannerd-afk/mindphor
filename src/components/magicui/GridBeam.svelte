<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let rows = 3;
  export let cols = 4;
  export let active = true;
  export let duration = 3;
  export let strength = 1;
  export let breathe = true;
  export let borderRadius = 0;
  export let dividerStroke = 'var(--border-default, #e5e7eb)';
  let className = '';
  export { className as class };

  let canvas: HTMLCanvasElement;
  let animRef: number;
  let startRef: number;
  let fadingOut = false;
  let fadeStart: number | null = null;
  let prevActive = active;

  $: if (prevActive && !active) {
    fadingOut = true;
    fadeStart = performance.now();
    setTimeout(() => fadingOut = false, 700);
    prevActive = active;
  } else {
    prevActive = active;
  }

  // Simplified high-energy colorful palette
  const palette = {
    h: [
      { color: [255, 50, 100], op: 0.38 },
      { color: [40, 180, 220], op: 0.35 },
      { color: [50, 200, 80], op: 0.38 },
      { color: [180, 40, 240], op: 0.35 },
      { color: [255, 160, 30], op: 0.38 },
      { color: [100, 70, 255], op: 0.35 },
    ],
    v: [
      { color: [40, 140, 255], op: 0.38 },
      { color: [240, 50, 180], op: 0.35 },
      { color: [30, 185, 170], op: 0.38 },
      { color: [255, 120, 40], op: 0.38 },
      { color: [100, 70, 255], op: 0.35 },
      { color: [50, 200, 80], op: 0.38 },
    ],
  };

  function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  function gaussian(x: number, s: number): number {
    return Math.exp(-(x * x) / (2 * s * s));
  }

  onMount(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    startRef = performance.now();

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (!(active || fadingOut)) {
        animRef = requestAnimationFrame(draw);
        return;
      }

      const elapsed = (now - (startRef || now)) / 1000;
      let fade = 1;
      if (fadingOut && fadeStart) {
        fade = Math.max(0, 1 - (now - fadeStart) / 600);
        if (fade <= 0) {
          animRef = requestAnimationFrame(draw);
          return;
        }
      } else if (active) {
        fade = smoothstep(Math.min(1, elapsed / 0.8));
      }

      const cellW = w / cols;
      const cellH = h / rows;
      const gs = fade * strength;
      const br = breathe ? 0.85 + 0.3 * Math.sin(elapsed * 1.4) + 0.1 * Math.sin(elapsed * 2.3) : 1;

      const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r},${g},${b},${Math.max(0, a).toFixed(4)})`;

      for (let r = 1; r < rows; r++) {
        const y = r * cellH;
        const pal = palette.h[r % palette.h.length];
        const [cr, cg, cb] = pal.color;
        const op = pal.op;
        const speed = 1 + (r % 3) * 0.12;
        const offset = r * 0.21 + (r % 2) * 0.35;
        const t = ((elapsed * speed) / duration + offset) % 1;
        const x = t * w;

        const bloomLen = cellW * 0.6 * br;
        const bloomH = 4;
        const bloomGrad = ctx.createRadialGradient(x, y, 0, x, y, bloomLen);
        bloomGrad.addColorStop(0, rgba(cr, cg, cb, op * 0.3 * gs));
        bloomGrad.addColorStop(0.4, rgba(cr, cg, cb, op * 0.12 * gs));
        bloomGrad.addColorStop(1, "transparent");
        ctx.save();
        ctx.scale(1, bloomH / bloomLen);
        ctx.fillStyle = bloomGrad;
        ctx.beginPath();
        ctx.arc(x, (y * bloomLen) / bloomH, bloomLen, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const coreLen = cellW * 0.55 * br;
        const lineGrad = ctx.createLinearGradient(x - coreLen, y, x + coreLen, y);
        lineGrad.addColorStop(0, "transparent");
        lineGrad.addColorStop(0.12, rgba(cr, cg, cb, op * 0.4 * gs));
        lineGrad.addColorStop(0.35, rgba(Math.min(255, cr + 60), Math.min(255, cg + 60), Math.min(255, cb + 60), op * 0.8 * gs));
        lineGrad.addColorStop(0.5, rgba(Math.min(255, cr + 100), Math.min(255, cg + 100), Math.min(255, cb + 100), op * 1.0 * gs));
        lineGrad.addColorStop(0.65, rgba(Math.min(255, cr + 60), Math.min(255, cg + 60), Math.min(255, cb + 60), op * 0.8 * gs));
        lineGrad.addColorStop(0.88, rgba(cr, cg, cb, op * 0.4 * gs));
        lineGrad.addColorStop(1, "transparent");
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - coreLen, y);
        ctx.lineTo(x + coreLen, y);
        ctx.stroke();
      }

      for (let c = 1; c < cols; c++) {
        const x = c * cellW;
        const pal = palette.v[c % palette.v.length];
        const [cr, cg, cb] = pal.color;
        const op = pal.op;
        const speed = 1 + (c % 3) * 0.1;
        const offset = c * 0.26 + (c % 2) * 0.4;
        const t = ((elapsed * speed) / (duration * 1.2) + offset) % 1;
        const y = t * h;

        const bloomLen = cellH * 0.6 * br;
        const bloomW = 4;
        const bloomGrad = ctx.createRadialGradient(x, y, 0, x, y, bloomLen);
        bloomGrad.addColorStop(0, rgba(cr, cg, cb, op * 0.3 * gs));
        bloomGrad.addColorStop(0.4, rgba(cr, cg, cb, op * 0.12 * gs));
        bloomGrad.addColorStop(1, "transparent");
        ctx.save();
        ctx.scale(bloomW / bloomLen, 1);
        ctx.fillStyle = bloomGrad;
        ctx.beginPath();
        ctx.arc((x * bloomLen) / bloomW, y, bloomLen, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const coreLen = cellH * 0.55 * br;
        const lineGrad = ctx.createLinearGradient(x, y - coreLen, x, y + coreLen);
        lineGrad.addColorStop(0, "transparent");
        lineGrad.addColorStop(0.12, rgba(cr, cg, cb, op * 0.4 * gs));
        lineGrad.addColorStop(0.35, rgba(Math.min(255, cr + 60), Math.min(255, cg + 60), Math.min(255, cb + 60), op * 0.8 * gs));
        lineGrad.addColorStop(0.5, rgba(Math.min(255, cr + 100), Math.min(255, cg + 100), Math.min(255, cb + 100), op * 1.0 * gs));
        lineGrad.addColorStop(0.65, rgba(Math.min(255, cr + 60), Math.min(255, cg + 60), Math.min(255, cb + 60), op * 0.8 * gs));
        lineGrad.addColorStop(0.88, rgba(cr, cg, cb, op * 0.4 * gs));
        lineGrad.addColorStop(1, "transparent");
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - coreLen);
        ctx.lineTo(x, y + coreLen);
        ctx.stroke();
      }

      for (let r = 1; r < rows; r++) {
        for (let c = 1; c < cols; c++) {
          const ix = c * cellW;
          const iy = r * cellH;
          const hSpeed = 1 + (r % 3) * 0.12;
          const hOffset = r * 0.21 + (r % 2) * 0.35;
          const ht = ((elapsed * hSpeed) / duration + hOffset) % 1;
          const hx = ht * w;
          const vSpeed = 1 + (c % 3) * 0.1;
          const vOffset = c * 0.26 + (c % 2) * 0.4;
          const vt = ((elapsed * vSpeed) / (duration * 1.2) + vOffset) % 1;
          const vy = vt * h;

          const proxH = gaussian((hx - ix) / cellW, 0.25);
          const proxV = gaussian((vy - iy) / cellH, 0.25);
          const prox = proxH * proxV;

          if (prox > 0.05) {
            const pH = palette.h[r % palette.h.length];
            const pV = palette.v[c % palette.v.length];
            const mr = Math.floor((pH.color[0] + pV.color[0]) / 2);
            const mg = Math.floor((pH.color[1] + pV.color[1]) / 2);
            const mb = Math.floor((pH.color[2] + pV.color[2]) / 2);
            const fr = 3.5 * Math.sqrt(prox);
            const fop = prox * 0.6 * gs;

            const fg = ctx.createRadialGradient(ix, iy, 0, ix, iy, fr);
            fg.addColorStop(0, rgba(Math.min(255, mr + 140), Math.min(255, mg + 140), Math.min(255, mb + 140), fop));
            fg.addColorStop(0.5, rgba(mr, mg, mb, fop * 0.4));
            fg.addColorStop(1, "transparent");
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(ix, iy, fr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animRef = requestAnimationFrame(draw);
    };

    animRef = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef);
      ro.disconnect();
    };
  });
</script>

<div class="relative overflow-hidden w-full h-full {className}" style="border-radius: {borderRadius}px">
  <!-- Grid Dividers -->
  <svg aria-hidden="true" class="pointer-events-none absolute inset-0 z-[1] h-full w-full" preserveAspectRatio="none">
    {#each Array(Math.max(0, rows - 1)) as _, r}
      <line stroke={dividerStroke} stroke-width="1" x1="0" x2="100%" y1="{((r + 1) / rows) * 100}%" y2="{((r + 1) / rows) * 100}%" />
    {/each}
    {#each Array(Math.max(0, cols - 1)) as _, c}
      <line stroke={dividerStroke} stroke-width="1" x1="{((c + 1) / cols) * 100}%" x2="{((c + 1) / cols) * 100}%" y1="0" y2="100%" />
    {/each}
  </svg>

  <!-- Animated Beams Canvas -->
  <canvas aria-hidden="true" bind:this={canvas} class="pointer-events-none absolute inset-0 z-[2] h-full w-full" style="border-radius: {borderRadius}px"></canvas>

  <!-- Content Slot -->
  <div class="relative z-[3] h-full w-full">
    <slot />
  </div>
</div>
