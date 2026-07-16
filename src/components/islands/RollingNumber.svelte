<script lang="ts">
  import RollingDigit from './RollingDigit.svelte';
  export let value: string | number = 0;

  $: valueStr = String(value);
  $: chars = valueStr.split('');
</script>

<span class="inline-flex items-baseline overflow-hidden select-none font-semibold tracking-tight">
  {#each chars as char, i (chars.length - i + (/\d/.test(char) ? 'd' : char))}
    {#if /\d/.test(char)}
      <RollingDigit digit={char} delay={i * 120} />
    {:else}
      <span class="non-digit">{char}</span>
    {/if}
  {/each}
</span>

<style>
  .non-digit {
    display: inline-block;
    vertical-align: baseline;
  }
</style>
