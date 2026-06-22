<script lang="ts">
  import { spring } from 'svelte/motion';

  export let digit: string;
  export let delay: number = 0;
  
  // Use physics-based spring for buttery smooth Cult-UI style animations
  const y = spring(0, {
    stiffness: 0.05,
    damping: 0.5,
  });

  $: target = parseInt(digit);
  $: if (!isNaN(target)) {
    if (delay > 0) {
      setTimeout(() => { y.set(target); }, delay);
    } else {
      y.set(target);
    }
  }
</script>

<span class="digit-container">
  <span class="invisible-char">0</span>
  <span class="digit-track" style="transform: translateY(calc(-{$y} * 10%));">
    {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as d}
      <span class="digit-val">{d}</span>
    {/each}
  </span>
</span>

<style>
  .digit-container {
    position: relative;
    display: inline-block;
    overflow: hidden;
    vertical-align: baseline;
    font-variant-numeric: tabular-nums;
  }
  .invisible-char {
    visibility: hidden;
    pointer-events: none;
    user-select: none;
  }
  .digit-track {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    height: 1000%;
    width: 100%;
  }
  .digit-val {
    height: 10%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
