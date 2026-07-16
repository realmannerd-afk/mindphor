<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let text: string;
  export let duration: number = 50;
  export let className: string = '';

  let visibleCount = 0;
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    if (typeof window !== 'undefined') {
      interval = setInterval(() => {
        if (visibleCount < text.length) {
          visibleCount++;
        } else {
          clearInterval(interval);
        }
      }, duration);
    } else {
      visibleCount = text.length;
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      clearInterval(interval);
    }
  });
</script>

<span class={className}>
  {#each text.split('') as char, index}
    <span class={index < visibleCount ? '' : 'opacity-0'}>{char}</span>
  {/each}
</span>
