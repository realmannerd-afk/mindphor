<script lang="ts">
  import { onMount } from 'svelte';
  import RollingNumber from './RollingNumber.svelte';

  export let projectId: string;
  export let date: string = '';
  export let playStoreUrl: string = '';

  export let range: string = '7';

  let data = {
    avgScore: 0,
    avgScoreTrend: '-',
    avgRatingStars: '0.0',
    memoryAccuracy: 0,
    memoryAccuracyTrend: '-',
    regressions: 0,
    regressionsTrend: '-',
    totalCalls: 0,
    totalCallsTrend: '-',
    downloads: '0'
  };
  let loading = true;
  let pollInterval: any;

  async function loadData() {
    if (!projectId) {
      loading = false;
      return;
    }
    try {
      const url = `/api/dashboard?app_id=${projectId}&range=${range}${date ? `&date=${date}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        data = {
          avgScore: json.avg_score || 0,
          avgRatingStars: ((json.avg_score || 0) / 100 * 5).toFixed(1),
          avgScoreTrend: json.avg_score_trend || '-',
          memoryAccuracy: json.memory_accuracy || 0,
          memoryAccuracyTrend: json.memory_accuracy_trend || '-',
          regressions: json.regression_count || 0,
          regressionsTrend: json.regression_count_trend || '-',
          totalCalls: json.total_calls >= 1000 ? (json.total_calls / 1000).toFixed(1) + 'k' : (json.total_calls || 0).toString(),
          totalCallsTrend: json.total_calls_trend || '-',
          downloads: data.downloads
        };
      }
      
      // Fetch downloads
      if (playStoreUrl && data.downloads === '0') {
        const pRes = await fetch(`/api/apps/playstore-info?url=${encodeURIComponent(playStoreUrl)}`);
        if (pRes.ok) {
          const pJson = await pRes.json();
          if (pJson.installs) data.downloads = pJson.installs;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });
</script>

{#if loading}
  <div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-faint mb-10 animate-pulse">
    {#each Array(5) as _}
      <div class="flex-1 p-5 lg:p-[24px]">
        <div class="h-3 bg-bg-elevated rounded w-1/2 mb-4"></div>
        <div class="h-8 bg-bg-elevated rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-bg-elevated rounded w-1/3"></div>
      </div>
    {/each}
  </div>
{:else if projectId}

<div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-faint mb-10">
  <!-- Card 1 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Avg Rating</div>
    <div class="text-[28px] font-medium text-text-primary mt-2"><RollingNumber value={data.avgScore} />%</div>
    {#if data.totalCalls !== 0}
      <div class={`text-[12px] mt-1 ${data.avgScoreTrend.startsWith('↑') ? 'text-emerald-500' : data.avgScoreTrend.startsWith('↓') ? 'text-rose-500' : 'text-text-muted'}`}>{data.avgScoreTrend}</div>
    {:else}
      <div class="text-[12px] mt-1 text-text-muted">-</div>
    {/if}
  </div>

  <!-- Card 2 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Positive Feedback</div>
    <div class="text-[28px] font-medium text-text-primary mt-2"><RollingNumber value={data.memoryAccuracy} />%</div>
    {#if data.totalCalls !== 0}
      <div class={`text-[12px] mt-1 ${data.memoryAccuracyTrend.startsWith('↑') ? 'text-emerald-500' : data.memoryAccuracyTrend.startsWith('↓') ? 'text-rose-500' : 'text-text-muted'}`}>{data.memoryAccuracyTrend}</div>
    {:else}
      <div class="text-[12px] mt-1 text-text-muted">-</div>
    {/if}
  </div>

  <!-- Card 3 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Critical Alerts</div>
    <div class="text-[28px] font-medium text-text-primary mt-2"><RollingNumber value={data.regressions} /></div>
    {#if data.totalCalls !== 0}
      <div class={`text-[12px] mt-1 ${data.regressionsTrend.startsWith('↑') ? 'text-rose-500' : data.regressionsTrend.startsWith('↓') ? 'text-emerald-500' : 'text-text-muted'}`}>{data.regressionsTrend}</div>
    {:else}
      <div class="text-[12px] mt-1 text-text-muted">-</div>
    {/if}
  </div>

  <!-- Card 4 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Total Reviews</div>
    <div class="text-[28px] font-medium text-text-primary mt-2"><RollingNumber value={data.totalCalls} /></div>
    {#if data.totalCalls !== 0}
      <div class={`text-[12px] mt-1 ${data.totalCallsTrend.startsWith('↑') ? 'text-emerald-500' : data.totalCallsTrend.startsWith('↓') ? 'text-rose-500' : 'text-text-muted'}`}>{data.totalCallsTrend}</div>
    {:else}
      <div class="text-[12px] mt-1 text-text-muted">-</div>
    {/if}
  </div>

  <!-- Card 5 -->
  <div class="flex-1 p-5 lg:p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">App Downloads</div>
    <div class="text-[28px] font-medium text-text-primary mt-2">{data.downloads}</div>
    <div class="text-[12px] mt-1 text-text-muted">Play Store</div>
  </div>
</div>
{/if}
