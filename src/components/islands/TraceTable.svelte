<script lang="ts">
  import { onMount } from 'svelte';

  export let projectId: string;
  export let overviewLink = false;

  let traces: any[] = [];
  let loading = true;
  let isRefreshing = false;
  let pollInterval: any;

  // Search & Filter State
  let searchQuery = '';
  let showFilterDropdown = false;
  let showExportDropdown = false;
  let statusFilter = 'all';
  let scoreFilter = 'all';

  // Reactive filtered array
  $: filteredTraces = traces.filter(trace => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const idStr = (trace.trace_id || trace.id || '').toLowerCase();
      const inputStr = (trace.input || '').toLowerCase();
      const outputStr = (trace.output || '').toLowerCase();
      const modelStr = (trace.model || '').toLowerCase();
      const statusStr = (trace.status || '').toLowerCase();
      
      if (!idStr.includes(q) && 
          !inputStr.includes(q) && 
          !outputStr.includes(q) && 
          !modelStr.includes(q) && 
          !statusStr.includes(q)) {
        return false;
      }
    }
    
    if (statusFilter !== 'all' && trace.status !== statusFilter) return false;
    
    if (scoreFilter !== 'all') {
      const score = trace.score;
      if (scoreFilter === 'high' && (score === null || score <= 80)) return false;
      if (scoreFilter === 'medium' && (score === null || score > 80 || score < 60)) return false;
      if (scoreFilter === 'low' && (score === null || score >= 60)) return false;
      if (scoreFilter === 'pending' && score !== null) return false;
    }
    
    return true;
  });

  async function manualReload() {
    isRefreshing = true;
    await loadData();
    isRefreshing = false;
  }

  async function loadData() {
    if (!projectId) {
      loading = false;
      return;
    }
    try {
      const res = await fetch(`/api/traces?project_id=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        traces = json.traces || [];
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

  function getStatus(status: string) {
    if (status === 'active') return { badgeBg: 'bg-[var(--color-tag-fresh-bg)]', badgeText: 'text-[var(--color-tag-fresh-text)]' };
    return { badgeBg: 'bg-[var(--color-tag-stale-bg)]', badgeText: 'text-[var(--color-tag-stale-text)]' };
  }

  function getScoreBadge(score: number | null) {
    if (score === null) return { class: 'text-text-muted', text: 'Pending' };
    if (score > 80) return { class: 'text-[#2D5A0E] dark:text-emerald-400 bg-[#2D5A0E]/10 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full', text: score.toString() };
    if (score >= 60) return { class: 'text-amber-600 dark:text-amber-400 bg-amber-600/10 dark:bg-amber-400/10 px-2 py-0.5 rounded-full', text: score.toString() };
    return { class: 'text-[#A32D2D] dark:text-red-400 bg-[#A32D2D]/10 dark:bg-red-400/10 px-2 py-0.5 rounded-full', text: score.toString() };
  }

  function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTraces, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "traces_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showExportDropdown = false;
  }

  function exportCSV() {
    if (filteredTraces.length === 0) return;
    const headers = ["Trace ID", "Input", "Output", "Model", "Status", "Score", "Created At"];
    const csvRows = [headers.join(',')];
    
    for (const trace of filteredTraces) {
      const row = [
        trace.trace_id || trace.id || '',
        `"${(trace.input || '').replace(/"/g, '""')}"`,
        `"${(trace.output || '').replace(/"/g, '""')}"`,
        trace.model || '',
        trace.status || '',
        trace.score || '',
        trace.created_at || ''
      ];
      csvRows.push(row.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "traces_export.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showExportDropdown = false;
  }
</script>

<div class={`w-full flex flex-col min-h-0 ${overviewLink ? 'mb-10' : 'flex-1'}`}>
  
  <!-- Action Bar matching reference image -->
  <div class="flex items-center justify-between mb-6 shrink-0">
    <!-- Search Bar -->
    <div class="relative w-[300px]">
      <svg class="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path><path d="M21 21l-6 -6"></path></svg>
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Search Trace ID or Desc..." 
        class="w-full bg-bg-surface border border-border-default rounded-full pl-11 pr-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors"
      />
    </div>
    
    <!-- Filter & Export Buttons -->
    <div class="flex items-center gap-3">
      <div class="relative group/tooltip flex items-center">
        <button on:click={manualReload} class="flex items-center justify-center p-2 text-text-muted hover:text-text-primary transition-colors rounded-full border border-border-default bg-bg-surface hover:bg-bg-elevated focus:outline-none" aria-label="Refresh traces">
          <svg class={`w-4 h-4 ${isRefreshing ? 'animate-spin text-text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-default text-text-primary text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10">
          Refresh traces
        </div>
      </div>

      <div class="relative flex items-center gap-2">
        {#if statusFilter !== 'all' || scoreFilter !== 'all' || searchQuery !== ''}
          <button on:click={() => { searchQuery = ''; statusFilter = 'all'; scoreFilter = 'all'; showFilterDropdown = false; }} class="flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-border-default bg-bg-surface text-text-muted hover:text-text-primary text-[12px] font-medium transition-colors focus:outline-none group" title="Clear all filters">
            <svg class="w-3.5 h-3.5 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            Clear
          </button>
        {/if}

        <button on:click={() => showFilterDropdown = !showFilterDropdown} class="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-default bg-bg-surface text-text-primary text-[13px] font-medium hover:bg-bg-elevated transition-colors focus:outline-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 5h13a1 1 0 0 1 .5 1.5l-5 5.5l0 7l-4 -3l0 -4l-5 -5.5a1 1 0 0 1 .5 -1.5"></path></svg>
          Filter
          {#if statusFilter !== 'all' || scoreFilter !== 'all'}
            <span class="w-1.5 h-1.5 rounded-full bg-accent ml-0.5"></span>
          {/if}
        </button>

        {#if showFilterDropdown}
          <!-- Backdrop for clicking outside -->
          <div class="fixed inset-0 z-10" on:click={() => showFilterDropdown = false}></div>
          <div class="absolute top-full right-0 mt-2 w-[220px] bg-bg-surface border border-border-default rounded-xl shadow-lg z-20 p-4">
            <div class="text-[11px] font-medium text-text-muted uppercase mb-2 tracking-wider">Status</div>
            <select bind:value={statusFilter} class="w-full bg-bg-elevated border border-border-default rounded-md px-2.5 py-2 text-[13px] text-text-primary mb-4 focus:outline-none focus:border-border-strong transition-colors cursor-pointer appearance-none">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="stale">Stale</option>
            </select>
            
            <div class="text-[11px] font-medium text-text-muted uppercase mb-2 tracking-wider">Quality Score</div>
            <select bind:value={scoreFilter} class="w-full bg-bg-elevated border border-border-default rounded-md px-2.5 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors cursor-pointer appearance-none">
              <option value="all">All Scores</option>
              <option value="high">High (&gt; 80)</option>
              <option value="medium">Medium (60 - 80)</option>
              <option value="low">Low (&lt; 60)</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        {/if}
      </div>
      
      <div class="relative">
        <button on:click={() => showExportDropdown = !showExportDropdown} class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-primary text-bg-base text-[13px] font-medium hover:opacity-90 transition-opacity focus:outline-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path><path d="M7 11l5 5l5 -5"></path><path d="M12 4l0 12"></path></svg>
          Export Data
        </button>
        
        {#if showExportDropdown}
          <!-- Backdrop for clicking outside -->
          <div class="fixed inset-0 z-10" on:click={() => showExportDropdown = false}></div>
          <div class="absolute top-full right-0 mt-2 w-[160px] bg-bg-surface border border-border-default rounded-xl shadow-lg z-20 overflow-hidden">
            <button on:click={exportCSV} class="w-full text-left px-4 py-2.5 text-[13px] text-text-primary hover:bg-bg-elevated transition-colors border-b border-border-faint flex items-center gap-2">
              <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path><path d="M8 11h8v7h-8z"></path><path d="M8 15h8"></path><path d="M11 11v7"></path></svg>
              Export as CSV
            </button>
            <button on:click={exportJSON} class="w-full text-left px-4 py-2.5 text-[13px] text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2">
              <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8a2 2 0 0 0 -2 2v2a2 2 0 0 1 -2 2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2"></path><path d="M15 8a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 -2 2v2a2 2 0 0 1 -2 2"></path></svg>
              Export as JSON
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Table Card matching reference image -->
  <div class={`bg-bg-surface border border-border-default rounded-[16px] overflow-hidden w-full ${overviewLink ? '' : 'flex flex-col min-h-0 flex-1 shrink-0'}`}>
    
    <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-bg-subtle border-b border-border-faint text-[13px] font-medium text-text-secondary shrink-0">
      <div class="col-span-2">Trace ID</div>
      <div class="col-span-4">Description</div>
      <div class="col-span-2">Model</div>
      <div class="col-span-2">Status</div>
      <div class="col-span-1">Score</div>
      <div class="col-span-1"></div>
    </div>
    
    <!-- Table Rows -->
    <div class={`flex flex-col overflow-y-auto ${overviewLink ? 'max-h-[400px]' : 'flex-1 min-h-0'}`}>
      {#if loading}
        <div class="py-16 text-center text-[13px] text-text-muted animate-pulse">
          Loading traces...
        </div>
      {:else if traces.length === 0}
        <div class="py-16 text-center flex flex-col items-center justify-center">
          <div class="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
          </div>
          <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No traces found</h3>
          <p class="text-[13px] text-text-muted max-w-[300px] mb-5 leading-relaxed">Add your API key and integrate the SDK to start seeing full trace logs here.</p>
          <a 
            href="/docs/quickstart" 
            class="text-[13px] bg-bg-elevated hover:bg-bg-subtle border border-border-default text-text-primary px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          >
            View Integration Guide
          </a>
        </div>
      {:else if filteredTraces.length === 0}
        <div class="py-16 text-center flex flex-col items-center justify-center">
          <div class="w-12 h-12 bg-bg-subtle text-text-muted rounded-full flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No traces match your filters</h3>
          <p class="text-[13px] text-text-muted max-w-[300px] mb-5 leading-relaxed">Try adjusting your search query or removing some filters.</p>
          <button 
            on:click={() => { searchQuery = ''; statusFilter = 'all'; scoreFilter = 'all'; }} 
            class="text-[13px] bg-bg-elevated hover:bg-bg-subtle border border-border-default text-text-primary px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      {:else}
        {#each filteredTraces as trace, index}
          {@const s = getStatus(trace.status)}
          {@const scoreBadge = getScoreBadge(trace.score)}
          <a href={`/traces/${trace.trace_id || trace.id}`} class={`grid grid-cols-12 gap-4 px-6 py-4 items-center text-[13px] hover:bg-bg-subtle/40 transition-colors cursor-pointer group ${index !== filteredTraces.length - 1 ? 'border-b border-border-faint' : ''}`}>
            
            <div class="col-span-2 text-text-muted font-mono text-[12px]">{trace.trace_id || trace.id}</div>
            
            <div class="col-span-4 text-text-primary font-medium truncate pr-4">{trace.input}</div>
            
            <div class="col-span-2 text-text-secondary">{trace.model}</div>
            
            <div class="col-span-2 flex items-center">
              <span class={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${s.badgeBg} ${s.badgeText}`}>
                {trace.status}
              </span>
            </div>
            
            <div class="col-span-1 text-text-primary font-medium">
              <span class={`inline-flex items-center justify-center font-medium ${scoreBadge.class}`}>
                {scoreBadge.text}
              </span>
            </div>
            

            
          </a>
        {/each}
      {/if}
    </div>
  </div>
</div>
