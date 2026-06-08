<script lang="ts">
  import { onMount } from 'svelte';

  export let projectId: string;

  let data = {
    avgScore: 0,
    memoryAccuracy: 0,
    regressions: 0,
    totalCalls: "0"
  };
  let loading = true;
  let pollInterval: any;

  async function loadData() {
    if (!projectId) {
      loading = false;
      return;
    }
    try {
      const res = await fetch(`/api/dashboard?project_id=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        data = {
          avgScore: json.avg_score || 0,
          memoryAccuracy: json.memory_accuracy || 0,
          regressions: json.regression_count || 0,
          totalCalls: json.total_calls >= 1000 ? (json.total_calls / 1000).toFixed(1) + 'k' : (json.total_calls || 0).toString()
        };
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
    pollInterval = setInterval(loadData, 5000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });
</script>

{#if loading}
  <div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-faint mb-10 animate-pulse">
    {#each Array(4) as _}
      <div class="flex-1 p-5 lg:p-[24px]">
        <div class="h-3 bg-bg-elevated rounded w-1/2 mb-4"></div>
        <div class="h-8 bg-bg-elevated rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-bg-elevated rounded w-1/3"></div>
      </div>
    {/each}
  </div>
{:else}

<div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-faint mb-10">
  <!-- Card 1 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Avg Quality Score</div>
    <div class="text-[28px] font-medium text-text-primary mt-2">{data.avgScore}%</div>
    <div class="text-[12px] mt-1 text-[#2D5A0E] dark:text-emerald-400">↑ +3% this week</div>
  </div>

  <!-- Card 2 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Memory Accuracy</div>
    <div class="text-[28px] font-medium text-text-primary mt-2">{data.memoryAccuracy}%</div>
    <div class="text-[12px] mt-1 text-[#2D5A0E] dark:text-emerald-400">↑ +1.2% this week</div>
  </div>

  <!-- Card 3 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Regressions</div>
    <div class="text-[28px] font-medium text-text-primary mt-2">{data.regressions}</div>
    <div class="text-[12px] mt-1 text-[#A32D2D] dark:text-red-400">↑ +2 vs last week</div>
  </div>

  <!-- Card 4 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Total Calls</div>
    <div class="text-[28px] font-medium text-text-primary mt-2">{data.totalCalls}</div>
    <div class="text-[12px] mt-1 text-[#2D5A0E] dark:text-emerald-400">↑ +18% this week</div>
  </div>
</div>
{/if}
