<script lang="ts">
  import { onMount } from 'svelte';
  import Logo from './Logo.svelte';
  import UserAvatar from './UserAvatar.svelte';

  export let projectId: string;
  export let overviewLink = false;
  export let date: string = '';
  export let playStoreUrl: string = '';

  let traces: any[] = [];
  let loading = true;
  let loadingMore = false;
  let isRefreshing = false;
  let offset = 0;
  let limit = 30;
  let hasMore = true;
  let isMounted = false;
  let prevSentimentFilter = 'all';
  let pollInterval: any;

  let searchQuery = '';
  let showFilterDropdown = false;
  let showExportDropdown = false;
  let sentimentFilter = 'all'; // 'all' | 'positive' | 'negative' | 'neutral'
  let newReviewsCount = 0;
  let showNewToast = false;
  let toastMessage = '';

  // Client-side filter on already-loaded traces (backup — API also filters)
  $: filteredTraces = traces.filter(trace => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const contentStr = (trace.input || '').toLowerCase();
      const sourceStr = (trace.model || '').toLowerCase();
      const authorStr = (trace.author || '').toLowerCase();
      if (!contentStr.includes(q) && !sourceStr.includes(q) && !authorStr.includes(q)) return false;
    }
    if (sentimentFilter !== 'all') {
      if ((trace.status || '').toLowerCase() !== sentimentFilter) return false;
    }
    return true;
  });

  let refreshTimeout: any;

  async function manualReload() {
    if (isRefreshing) return;
    isRefreshing = true;
    
    try {
      toastMessage = 'Scraping live reviews...';
      showNewToast = true;
      await fetch(`/api/apps/sync-reviews?app_id=${projectId}`, { method: 'POST' });
    } catch(e) {
      console.warn("Live sync failed", e);
    }
    
    // Remember the top ID to see what's new
    const currentTopId = traces.length > 0 ? traces[0].id : null;
    
    // Fetch from offset 0 to look for fresh data
    let apiUrl = `/api/feedback?app_id=${projectId}&limit=${limit}&offset=0`;
    if (date) apiUrl += `&date=${date}`;
    if (sentimentFilter && sentimentFilter !== 'all') apiUrl += `&sentiment=${encodeURIComponent(sentimentFilter)}`;
    if (searchQuery.trim()) apiUrl += `&search=${encodeURIComponent(searchQuery.trim())}`;
    
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const json = await res.json();
        const rawList = json.feedback || json.traces || [];
        const freshTraces = rawList.map((item: any) => {
          let derivedSentiment = item.sentiment || item.status || 'neutral';
          if (item.score !== undefined && item.score !== null) {
            if (item.score < 3) derivedSentiment = 'critical';
            else if (item.score === 3) derivedSentiment = 'neutral';
            else derivedSentiment = 'positive';
          } else if (derivedSentiment === 'negative') {
            derivedSentiment = 'critical';
          }
          return {
            ...item,
            id: item.id,
            input: item.content || item.input || '',
            model: (item.source || item.model || '').replace('Play Store', 'play_store'),
            status: derivedSentiment,
            score: item.score !== undefined ? item.score : null,
            raw_score: item.raw_score !== undefined ? item.raw_score : null,
            author: item.author || 'Anonymous User',
            url: item.url || ''
          };
        });
        
        if (currentTopId && freshTraces.length > 0) {
           const topIndexInFresh = freshTraces.findIndex((t: any) => t.id === currentTopId);
           if (topIndexInFresh > 0) {
              // Found new items
              newReviewsCount = topIndexInFresh;
              toastMessage = `Loaded ${newReviewsCount} new review${newReviewsCount > 1 ? 's' : ''}`;
              showNewToast = true;
              setTimeout(() => showNewToast = false, 3000);
              
              const newItems = freshTraces.slice(0, topIndexInFresh);
              traces = [...newItems, ...traces];
           } else if (topIndexInFresh === 0) {
              // Totally up to date
              newReviewsCount = 0;
              toastMessage = 'Already up to date';
              showNewToast = true;
              setTimeout(() => showNewToast = false, 3000);
           } else {
              traces = freshTraces; // Filter might have changed or huge gap
           }
        } else {
           traces = freshTraces;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      isRefreshing = false;
    }
  }

  async function resetAndReload() {
    offset = 0;
    traces = [];
    hasMore = true;
    loading = true;
    await loadData();
  }

  let isSyncing = false;
  async function syncMoreReviews() {
    if (isSyncing || !projectId || !playStoreUrl) return;
    isSyncing = true;
    try {
      const res = await fetch('/api/ingest/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: projectId,
          target_type: 'app',
          target_id: projectId,
          store: 'playstore',
          store_identifier: playStoreUrl
        })
      });
      if (res.ok) {
        toastMessage = 'Successfully synced more reviews!';
        showNewToast = true;
        setTimeout(() => showNewToast = false, 3000);
        await resetAndReload();
      }
    } catch (e) {
      console.error('Failed to sync more reviews:', e);
    } finally {
      isSyncing = false;
    }
  }

  async function loadData() {
    if (!projectId) {
      loading = false;
      return;
    }
    try {
      let apiUrl = `/api/feedback?app_id=${projectId}&limit=${limit}&offset=${offset}`;
      if (date) apiUrl += `&date=${date}`;
      if (sentimentFilter !== 'all') apiUrl += `&sentiment=${encodeURIComponent(sentimentFilter)}`;
      if (searchQuery.trim()) apiUrl += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(apiUrl);
      if (res.ok) {
        const json = await res.json();
        const rawList = json.feedback || json.traces || [];

        if (rawList.length === 0 && offset > 0) {
          offset = 0;
        }

        traces = rawList.map((item: any) => {
          let derivedSentiment = item.sentiment || item.status || 'neutral';
          if (item.score !== undefined && item.score !== null) {
            if (item.score < 3) derivedSentiment = 'critical';
            else if (item.score === 3) derivedSentiment = 'neutral';
            else derivedSentiment = 'positive';
          } else if (derivedSentiment === 'negative') {
            derivedSentiment = 'critical';
          }
          return {
            ...item,
            id: item.id,
            input: item.content || item.input || '',
            model: (item.source || item.model || '').replace('Play Store', 'play_store'),
            status: derivedSentiment,
            score: item.score !== undefined ? item.score : null,
            raw_score: item.raw_score !== undefined ? item.raw_score : null,
            author: item.author || 'Anonymous User',
            url: item.url || ''
          };
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function loadMore() {
    if (loading || loadingMore || !hasMore) return;
    loadingMore = true;
    offset += limit;
    
    try {
      let apiUrl = `/api/feedback?app_id=${projectId}&limit=${limit}&offset=${offset}`;
      
      if (sentimentFilter && sentimentFilter !== 'all') {
        apiUrl += `&sentiment=${encodeURIComponent(sentimentFilter)}`;
      }
      if (searchQuery) {
        apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const res = await fetch(apiUrl);
      if (res.ok) {
        const json = await res.json();
        const rawList = json.feedback || json.traces || [];
        
        if (rawList.length < limit) {
          hasMore = false;
        }

        const formatted = rawList.map((item: any) => {
          let derivedSentiment = item.sentiment;
          if (item.score !== undefined && item.score !== null) {
            if (item.score < 3) derivedSentiment = 'critical';
            else if (item.score === 3) derivedSentiment = 'neutral';
            else derivedSentiment = 'positive';
          }
          return {
            ...item,
            id: item.id,
            input: item.content || item.input || '',
            model: (item.source || item.model || '').replace('Play Store', 'play_store'),
            status: derivedSentiment,
            score: item.score !== undefined ? item.score : null,
            raw_score: item.raw_score !== undefined ? item.raw_score : null,
            author: item.author || 'Anonymous User',
            url: item.url || ''
          };
        });
        
        traces = [...traces, ...formatted];
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingMore = false;
    }
  }

  function infiniteScroll(node: HTMLElement) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { rootMargin: '100px' });
    
    observer.observe(node);
    return {
      destroy() { observer.disconnect(); }
    };
  }

  // Debounced search — re-fetches from API after 400ms of no typing
  function handleSearchInput() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      offset = 0;
      traces = [];
      loading = true;
      loadData();
    }, 400);
  }

  onMount(() => {
    isMounted = true;
    loadData();
  });

  // Re-fetch only when sentimentFilter actually changes after mount
  $: if (isMounted && sentimentFilter !== prevSentimentFilter) {
    prevSentimentFilter = sentimentFilter;
    offset = 0;
    hasMore = true;
    traces = [];
    loading = true;
    loadData();
  }

  function getStatus(status: string) {
    if (status === 'positive' || status === 'active' || status === 'good') return { badgeBg: 'bg-[var(--color-tag-fresh-bg)]', badgeText: 'text-[var(--color-tag-fresh-text)]' };
    return { badgeBg: 'bg-[var(--color-tag-stale-bg)]', badgeText: 'text-[var(--color-tag-stale-text)]' };
  }

  // Handle rating representation
  function getScoreBadge(score: number | null, rawScore: number | null, source: string) {
    const srcLower = (source || '').toLowerCase();
    const isAppReview = srcLower.includes('play') || srcLower.includes('app store') || srcLower.includes('appstore') || srcLower.includes('ios') || srcLower.includes('android');
    
    if (score === null && rawScore === null) {
       return { class: 'text-text-muted text-[12px]', text: isAppReview ? 'No Rating' : 'Pending', type: 'text', score: 0 };
    }
    
    // Check rawScore first if it's an app review
    if (isAppReview && rawScore !== null && rawScore <= 5) {
      return { class: '', text: `${rawScore}/5`, type: 'stars', score: rawScore };
    }
    if (isAppReview && score !== null && score <= 5) {
      return { class: '', text: `${score}/5`, type: 'stars', score: score };
    }
    
    let percent = score;
    if (score <= 5) {
      percent = score * 20;
    }
    if (percent > 80) return { class: 'text-[#2D5A0E] bg-[#2D5A0E]/10 px-2 py-0.5 rounded-full', text: percent.toString() + '%', type: 'percentage', score: score };
    if (percent >= 60) return { class: 'text-amber-600 bg-amber-600/10 px-2 py-0.5 rounded-full', text: percent.toString() + '%', type: 'percentage', score: score };
    return { class: 'text-[#A32D2D] bg-[#A32D2D]/10 px-2 py-0.5 rounded-full', text: percent.toString() + '%', type: 'percentage', score: score };
  }

  function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTraces, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "feedback_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showExportDropdown = false;
  }

  function exportCSV() {
    if (filteredTraces.length === 0) return;
    const headers = ["Feedback ID", "Content", "Source", "Author", "Sentiment Score", "Created At"];
    const csvRows = [headers.join(',')];
    
    for (const trace of filteredTraces) {
      const row = [
        trace.trace_id || trace.id || '',
        `"${(trace.input || '').replace(/"/g, '""')}"`,
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
    downloadAnchorNode.setAttribute("download", "feedback_export.csv");
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
        oninput={handleSearchInput}
        placeholder="Search Feedback Content..." 
        class="w-full bg-bg-surface border border-border-default rounded-full pl-11 pr-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors"
      />
    </div>
    
    <!-- Filter & Export Buttons -->
    <div class="flex items-center gap-3 relative">
      <div class="relative group/tooltip flex items-center">
        <button onclick={manualReload} class="flex items-center justify-center p-2 text-text-muted hover:text-text-primary transition-colors rounded-full border border-border-default bg-bg-surface hover:bg-bg-elevated focus:outline-none" aria-label="Refresh feedback">
          <svg class={`w-4 h-4 ${isRefreshing ? 'animate-spin text-text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <div class={`absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-default text-text-primary text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10 ${showNewToast ? 'opacity-100' : 'opacity-0 group-hover/tooltip:opacity-100'}`}>
          {#if showNewToast && toastMessage.includes('Loaded')}
            <span class="flex items-center gap-1.5 text-text-primary">
              <div class="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg class="w-2.5 h-2.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
              {toastMessage}
            </span>
          {:else}
            {showNewToast ? toastMessage : 'Refresh feedback'}
          {/if}
        </div>
      </div>

      <div class="relative flex items-center gap-2">
        {#if sentimentFilter !== 'all' || searchQuery !== ''}
          <button onclick={() => { searchQuery = ''; sentimentFilter = 'all'; showFilterDropdown = false; resetAndReload(); }} class="flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-border-default bg-bg-surface text-text-muted hover:text-text-primary text-[12px] font-medium transition-colors focus:outline-none" title="Clear all filters">
            <svg class="w-3.5 h-3.5 hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            Clear
          </button>
        {/if}

        <button onclick={() => showFilterDropdown = !showFilterDropdown} class="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-default bg-bg-surface text-text-primary text-[13px] font-medium hover:bg-bg-elevated transition-colors focus:outline-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 5h13a1 1 0 0 1 .5 1.5l-5 5.5l0 7l-4 -3l0 -4l-5 -5.5a1 1 0 0 1 .5 -1.5"></path></svg>
          Filter
          {#if sentimentFilter !== 'all'}
            <span class="w-1.5 h-1.5 rounded-full bg-accent ml-0.5"></span>
          {/if}
        </button>

        {#if showFilterDropdown}
          <div class="fixed inset-0 z-10" onclick={() => showFilterDropdown = false} role="presentation"></div>
          <div class="absolute top-full right-0 mt-2 w-[220px] bg-bg-surface border border-border-default rounded-xl shadow-lg z-20 p-4">
            <div class="text-[11px] font-medium text-text-muted uppercase mb-2 tracking-wider">Sentiment</div>
            <select bind:value={sentimentFilter} class="w-full bg-bg-elevated border border-border-default rounded-md px-2.5 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors cursor-pointer appearance-none">
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        {/if}
      </div>
      
      <div class="relative">
        <button onclick={() => showExportDropdown = !showExportDropdown} class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-primary text-bg-base text-[13px] font-medium hover:opacity-90 transition-opacity focus:outline-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path><path d="M7 11l5 5l5 -5"></path><path d="M12 4l0 12"></path></svg>
          Export Data
        </button>
        
        {#if showExportDropdown}
          <!-- Backdrop for clicking outside -->
          <div class="fixed inset-0 z-10" onclick={() => showExportDropdown = false} role="presentation"></div>
          <div class="absolute top-full right-0 mt-2 w-[160px] bg-bg-surface border border-border-default rounded-xl shadow-lg z-20 overflow-hidden">
            <button onclick={exportCSV} class="w-full text-left px-4 py-2.5 text-[13px] text-text-primary hover:bg-bg-elevated transition-colors border-b border-border-faint flex items-center gap-2">
              <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path><path d="M8 11h8v7h-8z"></path><path d="M8 15h8"></path><path d="M11 11v7"></path></svg>
              Export as CSV
            </button>
            <button onclick={exportJSON} class="w-full text-left px-4 py-2.5 text-[13px] text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2">
              <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8a2 2 0 0 0 -2 2v2a2 2 0 0 1 -2 2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2"></path><path d="M15 8a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 -2 2v2a2 2 0 0 1 -2 2"></path></svg>
              Export as JSON
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Table Card matching reference image -->
  {#if loading}
    <div class="flex-1 flex flex-col items-center justify-center py-16 text-center min-h-[350px] bg-bg-surface border border-border-default rounded-[16px] w-full">
      <div class="w-8 h-8 border-[3px] border-border-default border-t-text-muted rounded-full animate-spin mb-4"></div>
      <p class="text-[13px] text-text-muted">Loading intelligence logs...</p>
    </div>
  {:else}
    <div class={`bg-bg-surface border border-border-default rounded-[16px] overflow-hidden w-full ${overviewLink ? '' : 'flex flex-col min-h-0 flex-1 shrink-0'}`}>
      
      <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-bg-subtle border-b border-border-faint text-[13px] font-medium text-text-secondary shrink-0">
        <div class="col-span-1">ID</div>
        <div class="col-span-6">Feedback Content</div>
        <div class="col-span-1 text-center">Source</div>
        <div class="col-span-2 text-center">Author</div>
        <div class="col-span-2 text-center">Rating</div>
      </div>
      
      <!-- Table Rows -->
      <div class={`flex flex-col overflow-y-auto ${overviewLink ? 'max-h-[398px]' : 'flex-1 min-h-0'}`}>
        {#if traces.length === 0}
          <div class="flex-1 flex flex-col items-center justify-center py-16 text-center min-h-[300px]">
            <div class="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No competitor intelligence found</h3>
            <p class="text-[13px] text-text-muted max-w-[300px] mb-5 leading-relaxed">Add competitors and trigger a changelog or review sync to start capturing competitive signals here.</p>
          </div>
        {:else if filteredTraces.length === 0}
          <div class="flex-1 flex flex-col items-center justify-center py-16 text-center min-h-[300px]">
            <div class="w-12 h-12 bg-bg-subtle text-text-muted rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No feedback match your filters</h3>
            <p class="text-[13px] text-text-muted max-w-[300px] mb-5 leading-relaxed">Try adjusting your search query or removing some filters.</p>
            <button 
              onclick={() => { searchQuery = ''; sentimentFilter = 'all'; resetAndReload(); }} 
              class="text-[13px] bg-bg-elevated hover:bg-bg-subtle border border-border-default text-text-primary px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        {:else}
          {#each filteredTraces as trace, index}
            {@const s = getStatus(trace.status)}
            {@const scoreBadge = getScoreBadge(trace.score, trace.raw_score, trace.model)}
            <a href={`/dashboard/feedback/${trace.id}`} class={`grid grid-cols-12 gap-4 px-6 py-4 items-center text-[13px] transition-colors group block ${index !== filteredTraces.length - 1 ? 'border-b border-border-faint' : ''}`}>
              
              <div class="col-span-1 text-text-muted font-mono text-[12px]">{index + 1}</div>
              
              <div class="col-span-6 text-text-primary font-medium truncate pr-4">{trace.input}</div>
              
              <div class="col-span-1 flex items-center justify-center">
                <Logo client:load domain={trace.model} alt={trace.model} className="w-6 h-6 object-contain" />
              </div>
              
              <div class="col-span-2 flex items-center justify-center">
                <UserAvatar name={trace.author || 'Anonymous User'} className="w-6 h-6 text-[10px]" />
              </div>
              
              <div class="col-span-2 flex justify-center text-text-primary font-medium">
                {#if scoreBadge.type === 'stars'}
                  <div class="flex items-center justify-center">
                    <div class="flex items-center gap-[2px]">
                      {#each Array(5) as _, i}
                        <svg class={`w-3.5 h-3.5 ${i < scoreBadge.score ? 'text-[#F59E0B]' : 'text-border-strong/50'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      {/each}
                    </div>
                  </div>
                {:else}
                  <span class={`inline-flex items-center justify-center font-medium ${scoreBadge.class}`}>
                    {scoreBadge.text}
                  </span>
                {/if}
              </div>
              
            </a>
          {/each}
          
          <!-- Infinite Scroll Trigger -->
          {#if hasMore && filteredTraces.length > 0}
            <div use:infiniteScroll class="py-8 flex justify-center items-center w-full">
              {#if loadingMore}
                <svg class="animate-spin h-6 w-6 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {/if}
            </div>
          {:else if !hasMore && filteredTraces.length > 0 && playStoreUrl}
            <div class="py-12 flex flex-col items-center justify-center w-full gap-4">
              <span class="text-[13px] text-text-muted">You've reached the end of the currently synced reviews.</span>
              <button 
                onclick={syncMoreReviews}
                disabled={isSyncing}
                class="flex items-center gap-2 px-5 py-2.5 bg-bg-surface hover:bg-bg-elevated border border-border-default rounded-full text-[13px] font-medium text-text-primary transition-colors disabled:opacity-50"
              >
                {#if isSyncing}
                  <svg class="animate-spin h-4 w-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Fetching older reviews...
                {:else}
                  <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"></path></svg>
                  Sync Older Reviews
                {/if}
              </button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>
