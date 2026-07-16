<script lang="ts">
  import { onMount } from 'svelte';

  export let competitorId: string;
  export let className: string = '';
  let recommendations: string[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const res = await fetch(`/api/competitor-recommendations?competitor_id=${competitorId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate recommendations');
      recommendations = data.recommendations || [];
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class={`bg-bg-surface border border-border-default rounded-[16px] p-6 flex flex-col relative overflow-hidden ${className}`}>
  <div class="flex items-center justify-between mb-4 relative z-10">
    <div class="flex items-center gap-2.5">
      <div class="w-6 h-6 rounded-[8px] bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border border-[#FED7AA] flex items-center justify-center text-[#EA580C]">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"></path></svg>
      </div>
      <h3 class="text-[14px] font-bold text-text-primary tracking-wide">Action Plan</h3>
    </div>
    <span class="text-[9px] font-bold px-1.5 py-0.5 bg-accent/10 text-accent rounded uppercase tracking-wider">AI Generated</span>
  </div>

  {#if loading}
    <div class="flex flex-col gap-3 animate-pulse relative z-10">
      <div class="h-[44px] bg-bg-subtle rounded-[10px] w-full"></div>
      <div class="h-[44px] bg-bg-subtle rounded-[10px] w-full"></div>
      <div class="h-[44px] bg-bg-subtle rounded-[10px] w-full"></div>
    </div>
  {:else if error}
    <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-[10px] text-[13px] text-[#EF4444] leading-relaxed relative z-10">
      {error}
    </div>
  {:else if recommendations.length > 0}
    <div class="flex flex-col gap-2 relative z-10">
      {#each recommendations as rec, i}
        <div class="py-2.5 flex items-start gap-3 group cursor-default">
          <div class="w-5 h-5 rounded-full border border-border-default flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-[#EA580C]/40 transition-colors">
            <span class="text-[10px] font-bold text-text-muted group-hover:text-[#EA580C] transition-colors">{i + 1}</span>
          </div>
          <p class="text-[13px] text-text-primary leading-[1.5] font-medium">{rec}</p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-[13px] text-text-muted italic py-4">No recommendations available.</div>
  {/if}
</div>
