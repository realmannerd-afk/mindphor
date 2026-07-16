<script lang="ts">
  import { onMount } from 'svelte';

  export let competitorId: string;
  let summary = '';
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const res = await fetch(`/api/competitor-summary?competitor_id=${competitorId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate summary');
      summary = data.summary;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="bg-bg-surface border border-border-default rounded-[16px] p-6 flex flex-col">
  <div class="flex items-center gap-2 mb-4">
    <div class="w-6 h-6 rounded-md bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
    </div>
    <h3 class="text-[14px] font-semibold text-text-primary">AI Strategic Brief</h3>
  </div>

  {#if loading}
    <div class="flex flex-col gap-2 animate-pulse">
      <div class="h-3 bg-bg-subtle rounded w-full"></div>
      <div class="h-3 bg-bg-subtle rounded w-[90%]"></div>
      <div class="h-3 bg-bg-subtle rounded w-[95%]"></div>
      <div class="h-3 bg-bg-subtle rounded w-[60%]"></div>
    </div>
  {:else if error}
    <div class="text-[13px] text-[#EF4444] leading-relaxed">
      {error}
    </div>
  {:else}
    <div class="text-[13px] text-text-secondary leading-[1.6]">
      {@html summary}
    </div>
  {/if}
</div>
