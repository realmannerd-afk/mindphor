<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Logo from './Logo.svelte';
  import UserAvatar from './UserAvatar.svelte';

  export let projectId: string;
  export let overviewLink = false;
  export let date: string = '';
  export let playStoreUrl: string = '';
  export let appStoreUrl: string = '';

  let traces: any[] = [];
  let loading = true;
  let loadingMore = false;
  let isRefreshing = false;
  let offset = 0;
  let limit = 1000;
  let hasMore = true;
  let isMounted = false;
  let prevSentimentFilter = 'all';
  let pollInterval: any;

  let searchQuery = '';
  let showFilterDropdown = false;
  let showExportDropdown = false;
  $: hasApple = !!(appStoreUrl && appStoreUrl !== 'null' && appStoreUrl !== 'undefined');
  $: hasGoogle = !!(playStoreUrl && playStoreUrl !== 'null' && playStoreUrl !== 'undefined');
  
  $: isFetchDisabled = (syncSource === 'appstore' && !hasApple) || 
                       (syncSource === 'playstore' && !hasGoogle) || 
                       (syncSource === 'both' && (!hasApple || !hasGoogle));
                       
  let sentimentFilter = 'all'; // 'all' | 'positive' | 'negative' | 'neutral'
  let sourceFilter = 'all'; // 'all' | 'app store' | 'google play'
  let countryFilter = 'all';
  let dateRangeFilter = 'all';
  
  let syncLimit = '50';
  let syncCountry = 'all';
  let syncDateRange = 'all';
  let syncSource = 'both';
  
  let newReviewsCount = 0;
  let showNewToast = false;
  let toastMessage = '';
  let syncError: string | null = null;
  let availableCountries: string[] = [];

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
      const ts = (trace.status || '').toLowerCase();
      const sf = sentimentFilter;
      if (sf === 'negative' && ts !== 'negative' && ts !== 'critical') return false;
      if (sf !== 'negative' && ts !== sf) return false;
    }
    if (sourceFilter !== 'all') {
      const src = (trace.model || trace.source || '').toLowerCase();
      if (sourceFilter === 'app store' && !src.includes('app store')) return false;
      if (sourceFilter === 'google play' && (!src.includes('google play') && !src.includes('play_store'))) return false;
    }
    if (countryFilter !== 'all') {
      if ((trace.country || '').toLowerCase() !== countryFilter) return false;
    }
    return true;
  });

  let currentPage = 1;
  let itemsPerPage = 9;
  $: paginatedTraces = filteredTraces.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: totalPages = Math.ceil(filteredTraces.length / itemsPerPage);
  
  // Reset page when filters change
  $: if (searchQuery || sentimentFilter || sourceFilter || countryFilter || dateRangeFilter) {
    currentPage = 1;
  }

  let refreshTimeout: any;

  // Persist selections whenever they change
  $: if (isMounted && typeof window !== 'undefined') {
    localStorage.setItem('mindphor_sync_source', syncSource);
    localStorage.setItem('mindphor_sync_country', syncCountry);
    localStorage.setItem('mindphor_sync_limit', syncLimit);
  }

  async function manualReload() {
    if (isRefreshing) return;
    
    if (syncSource === 'appstore' && !hasApple) {
      toastMessage = 'App Store URL missing in Settings';
      showNewToast = true;
      setTimeout(() => showNewToast = false, 4000);
      return;
    }
    if (syncSource === 'playstore' && !hasGoogle) {
      toastMessage = 'Play Store URL missing in Settings';
      showNewToast = true;
      setTimeout(() => showNewToast = false, 4000);
      return;
    }
    if (syncSource === 'both' && (!hasApple || !hasGoogle)) {
      toastMessage = 'Store URLs missing in Settings';
      showNewToast = true;
      setTimeout(() => showNewToast = false, 4000);
      return;
    }

    isRefreshing = true;
    
    try {
      toastMessage = `Scraping live reviews (limit: ${syncLimit})...`;
      showNewToast = true;
      syncError = null;
      let syncUrl = `/api/apps/sync-reviews?app_id=${projectId}&limit=${syncLimit}`;
      if (syncCountry !== 'all') syncUrl += `&countries=${syncCountry}`;
      if (syncSource !== 'both') syncUrl += `&source=${syncSource}`;
      if (syncDateRange !== 'all') syncUrl += `&date_range=${syncDateRange}`;
      const response = await fetch(syncUrl, { method: 'POST' });
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.error) {
                    syncError = data.error;
                    break;
                  }
                  if (data.status === 'scraping') {
                    toastMessage = data.message;
                  } else if (data.status === 'inserting') {
                    toastMessage = `Saving to database... ${data.current} / ${data.total} processed`;
                  } else if (data.status === 'analyzing') {
                    toastMessage = data.message;
                  } else if (data.status === 'complete') {
                    toastMessage = `Successfully fetched ${data.total_fetched} reviews (${data.inserted} new, ${data.skipped} skipped).`;
                    setTimeout(() => toastMessage = '', 4000);
                  }
                } catch(e) {}
              }
            }
          }
        }
      } else {
        syncError = 'Failed to read response stream.';
        showNewToast = false;
      }
    } catch(e) {
      console.warn("Live sync failed", e);
      syncError = 'Network error while attempting to sync.';
      showNewToast = false;
    }
    
    // Remember the top ID to see what's new
    const currentTopId = traces.length > 0 ? traces[0].id : null;
    
    // Fetch from offset 0 to look for fresh data
    let apiUrl = `/api/feedback?app_id=${projectId}&limit=${limit}&offset=0`;
    if (date) apiUrl += `&date=${date}`;
    if (sentimentFilter && sentimentFilter !== 'all') apiUrl += `&sentiment=${encodeURIComponent(sentimentFilter)}`;
    if (sourceFilter && sourceFilter !== 'all') apiUrl += `&source=${encodeURIComponent(sourceFilter)}`;
    if (countryFilter && countryFilter !== 'all') apiUrl += `&country=${encodeURIComponent(countryFilter)}`;
    if (dateRangeFilter && dateRangeFilter !== 'all') apiUrl += `&date_range=${encodeURIComponent(dateRangeFilter)}`;
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
    if (isSyncing || !projectId) return;
    isSyncing = true;
    try {
      syncError = null;
      let syncUrl = `/api/apps/sync-reviews?app_id=${projectId}`;
      const response = await fetch(syncUrl, { method: 'POST' });
      
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.error) {
                    syncError = data.error;
                    break;
                  }
                  if (data.status === 'scraping') {
                    toastMessage = data.message;
                  } else if (data.status === 'inserting') {
                    toastMessage = `Saving to database... ${data.current} / ${data.total} processed`;
                  } else if (data.status === 'analyzing') {
                    toastMessage = data.message;
                  } else if (data.status === 'complete') {
                    toastMessage = `Successfully fetched ${data.total_fetched} reviews (${data.inserted} new, ${data.skipped} skipped).`;
                    setTimeout(() => toastMessage = '', 4000);
                    await resetAndReload();
                  }
                } catch(e) {}
              }
            }
          }
        }
      } else {
        syncError = 'Failed to read response stream.';
      }
    } catch (e) {
      console.warn("Live sync failed", e);
      syncError = 'Network error while attempting to sync.';
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
      if (sourceFilter !== 'all') apiUrl += `&source=${encodeURIComponent(sourceFilter)}`;
      if (countryFilter !== 'all') apiUrl += `&country=${encodeURIComponent(countryFilter)}`;
      if (dateRangeFilter !== 'all') apiUrl += `&date_range=${encodeURIComponent(dateRangeFilter)}`;
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

  onMount(async () => {
    isMounted = true;
    
    // Restore persistent sync config from previous session
    if (typeof window !== 'undefined') {
      const savedSource = localStorage.getItem('mindphor_sync_source');
      if (savedSource) syncSource = savedSource;
      const savedCountry = localStorage.getItem('mindphor_sync_country');
      if (savedCountry) syncCountry = savedCountry;
      const savedLimit = localStorage.getItem('mindphor_sync_limit');
      if (savedLimit) syncLimit = savedLimit;

      // Ensure the restored source is actually valid based on available URLs
      const currentHasApple = !!(appStoreUrl && appStoreUrl !== 'null' && appStoreUrl !== 'undefined');
      const currentHasGoogle = !!(playStoreUrl && playStoreUrl !== 'null' && playStoreUrl !== 'undefined');
      
      if (syncSource === 'appstore' && !currentHasApple && currentHasGoogle) syncSource = 'playstore';
      else if (syncSource === 'playstore' && !currentHasGoogle && currentHasApple) syncSource = 'appstore';
      else if (syncSource === 'both' && (!currentHasApple || !currentHasGoogle)) {
        syncSource = currentHasApple ? 'appstore' : (currentHasGoogle ? 'playstore' : 'both');
      }
    }

    loadData();
    loadCountries();
  });

  onDestroy(() => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
  });

  async function loadCountries() {
    try {
      const res = await fetch(`/api/feedback-countries?app_id=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        availableCountries = json.countries || [];
      }
    } catch (e) {
      console.error('Failed to load countries', e);
    }
  }

  // Monitor filters for reactive reload
  $: {
    if (isMounted) {
      const _1 = sentimentFilter;
      const _2 = sourceFilter;
      const _3 = countryFilter;
      const _4 = dateRangeFilter;
      resetAndReload();
    }
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
    if (score === null || score === undefined) {
      return { class: 'text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full', text: 'N/A', type: 'percentage', score: 0 };
    }
    if (score <= 5) {
      percent = score * 20;
    }
    if ((percent as number) > 80) return { class: 'text-[#2D5A0E] bg-[#2D5A0E]/10 px-2 py-0.5 rounded-full', text: (percent as number).toString() + '%', type: 'percentage', score: score };
    if ((percent as number) >= 60) return { class: 'text-amber-600 bg-amber-600/10 px-2 py-0.5 rounded-full', text: (percent as number).toString() + '%', type: 'percentage', score: score };
    return { class: 'text-[#A32D2D] bg-[#A32D2D]/10 px-2 py-0.5 rounded-full', text: (percent as number).toString() + '%', type: 'percentage', score: score };
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

  {#if syncError}
    <div class="w-full bg-[#A32D2D]/10 border border-[#A32D2D]/30 text-[#A32D2D] rounded-[8px] p-3 mb-4 flex items-start gap-3">
      <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <div class="flex-1">
        <h4 class="text-[13px] font-semibold">Sync Failed</h4>
        <p class="text-[12px] opacity-90 mt-0.5 leading-relaxed">{syncError}</p>
      </div>
      <button class="text-[#A32D2D] opacity-70 hover:opacity-100 transition-opacity focus:outline-none" onclick={() => syncError = null}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  {/if}
  
  <!-- Action Bar matching reference image -->
  <div class="flex items-center justify-between mb-6 shrink-0">
    <!-- Left Section -->
    <div class="flex items-center gap-4">
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
    </div>
    
    <!-- Filter & Export Buttons -->
    <div class="flex items-center gap-3 relative">
      
      <div class="flex items-center gap-3">
        <!-- Persistent Sync Config & Refresh Button -->
        <div class="relative flex items-center gap-2 px-1.5 py-1.5 rounded-full border border-border-default bg-transparent shadow-[0_0_1px_rgba(0,0,0,0.1)]">
          <select bind:value={syncSource} class="bg-transparent border-none text-[12px] font-medium text-text-primary pl-1.5 pr-1 focus:outline-none cursor-pointer uppercase appearance-none hover:text-text-secondary transition-colors disabled:cursor-not-allowed">
            <option value="both" disabled={!hasApple || !hasGoogle} class="disabled:cursor-not-allowed disabled:text-text-muted/50">Both Stores</option>
            <option value="appstore" disabled={!hasApple} class="disabled:cursor-not-allowed disabled:text-text-muted/50">App Store</option>
            <option value="playstore" disabled={!hasGoogle} class="disabled:cursor-not-allowed disabled:text-text-muted/50">Play Store</option>
          </select>
          <div class="w-px h-3.5 bg-border-strong/50"></div>
          <select bind:value={syncCountry} class="bg-transparent border-none text-[12px] font-medium text-text-primary px-1.5 focus:outline-none cursor-pointer uppercase appearance-none hover:text-text-secondary transition-colors">
            <option value="all">Global</option>
            <option value="us">US</option>
            <option value="gb">GB</option>
            <option value="ca">CA</option>
            <option value="au">AU</option>
            <option value="in">IN</option>
            <option value="de">DE</option>
            <option value="fr">FR</option>
          </select>
          <div class="w-px h-3.5 bg-border-strong/50"></div>
          <select bind:value={syncLimit} class="bg-transparent border-none text-[12px] font-medium text-text-primary px-1.5 focus:outline-none cursor-pointer appearance-none hover:text-text-secondary transition-colors">
            <option value="50">50 max</option>
            <option value="100">100 max</option>
            <option value="500">500 max</option>
            <option value="1000">1K max</option>
            <option value="3000">3K max</option>
          </select>
          <div class="w-px h-3.5 bg-border-strong/50"></div>
          <select bind:value={syncDateRange} class="bg-transparent border-none text-[12px] font-medium text-text-primary pl-1.5 pr-2 focus:outline-none cursor-pointer appearance-none hover:text-text-secondary transition-colors">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="last_7">Last 7 Days</option>
            <option value="last_30">Last 30 Days</option>
          </select>
          
          <div class="w-px h-3.5 bg-border-strong/50 mx-0.5"></div>
          
          <button onclick={manualReload} disabled={isFetchDisabled} class="flex items-center justify-center p-1.5 text-text-primary transition-colors rounded-full hover:bg-bg-elevated focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Fetch reviews">
            <svg class={`w-4 h-4 text-text-primary ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>

          <!-- Toast Status (No Hover) -->
          <div class={`absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-default text-text-primary text-[11px] font-medium px-3.5 py-2 rounded-md transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-50 ${showNewToast ? 'opacity-100' : 'opacity-0'}`}>
            {#if showNewToast && toastMessage.includes('Loaded')}
              <span class="flex items-center gap-1.5 text-text-primary">
                <div class="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg class="w-2.5 h-2.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                {toastMessage}
              </span>
            {:else}
              {toastMessage}
            {/if}
          </div>
        </div>
      </div>

      <div class="relative flex items-center gap-2 ml-2">
        {#if sentimentFilter !== 'all' || sourceFilter !== 'all' || countryFilter !== 'all' || dateRangeFilter !== 'all' || searchQuery !== ''}
          <button onclick={() => { searchQuery = ''; sentimentFilter = 'all'; sourceFilter = 'all'; countryFilter = 'all'; dateRangeFilter = 'all'; showFilterDropdown = false; resetAndReload(); }} class="flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-border-default bg-bg-surface text-text-muted hover:text-text-primary text-[12px] font-medium transition-colors focus:outline-none" title="Clear all filters">
            <svg class="w-3.5 h-3.5 hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            Clear
          </button>
        {/if}

        <button onclick={() => showFilterDropdown = !showFilterDropdown} class="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-default bg-bg-surface text-text-primary text-[13px] font-medium hover:bg-bg-elevated transition-colors focus:outline-none">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 5h13a1 1 0 0 1 .5 1.5l-5 5.5l0 7l-4 -3l0 -4l-5 -5.5a1 1 0 0 1 .5 -1.5"></path></svg>
          Filter
          {#if sentimentFilter !== 'all' || sourceFilter !== 'all' || countryFilter !== 'all' || dateRangeFilter !== 'all'}
            <span class="w-1.5 h-1.5 rounded-full bg-text-primary ml-0.5"></span>
          {/if}
        </button>

        {#if showFilterDropdown}
          <div class="fixed inset-0 z-10" onclick={() => showFilterDropdown = false} role="presentation"></div>
          <div class="absolute top-full right-0 mt-2 w-[220px] bg-bg-surface border border-border-default rounded-xl shadow-lg z-20 p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            <div class="text-[11px] font-medium text-text-muted uppercase mb-2 tracking-wider">Date Range</div>
            <select bind:value={dateRangeFilter} class="w-full bg-bg-elevated border border-border-default rounded-md px-2.5 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors cursor-pointer appearance-none">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last_7">Last 7 Days</option>
              <option value="last_30">Last 30 Days</option>
            </select>
            
            <div class="text-[11px] font-medium text-text-muted uppercase mb-2 tracking-wider mt-4">Sentiment</div>
            <select bind:value={sentimentFilter} class="w-full bg-bg-elevated border border-border-default rounded-md px-2.5 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors cursor-pointer appearance-none">
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            
            <div class="text-[11px] font-medium text-text-muted uppercase mb-2 tracking-wider mt-4">Source</div>
            <select bind:value={sourceFilter} class="w-full bg-bg-elevated border border-border-default rounded-md px-2.5 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors cursor-pointer appearance-none">
              <option value="all">All Sources</option>
              <option value="app store">App Store</option>
              <option value="google play">Google Play</option>
            </select>
            
            <div class="text-[11px] font-medium text-text-muted uppercase mb-2 tracking-wider mt-4">Country</div>
            <select bind:value={countryFilter} class="w-full bg-bg-elevated border border-border-default rounded-md px-2.5 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors cursor-pointer appearance-none">
              <option value="all">All Countries</option>
              {#each availableCountries as cc}
                <option value={cc}>{cc.toUpperCase()}</option>
              {/each}
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
          <div class="absolute top-full right-0 mt-2 w-[180px] bg-bg-surface border border-border-default rounded-xl shadow-lg z-20 overflow-hidden">
            <button onclick={exportCSV} class="w-full text-left px-4 py-2.5 text-[13px] text-text-primary hover:bg-bg-elevated transition-colors border-b border-border-faint flex items-center gap-2">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
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
    <div class={`bg-bg-surface border border-border-default rounded-[16px] w-full flex flex-col min-h-0 ${overviewLink ? '' : 'flex-1 shrink-0'}`}>
      
      <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-bg-subtle border-b border-border-faint text-[13px] font-medium text-text-secondary shrink-0">
        <div class="col-span-1">ID</div>
        <div class="col-span-6">Feedback Content</div>
        <div class="col-span-1 text-center">Source</div>
        <div class="col-span-2 text-center">Author</div>
        <div class="col-span-2 text-center">Rating</div>
      </div>
      
      <!-- Table Rows -->
      <div class={`flex flex-col ${overviewLink ? '' : 'flex-1 min-h-0'}`}>
        {#if traces.length === 0}
          <div class="flex-1 flex flex-col items-center justify-center py-16 text-center min-h-[300px]">
            <div class="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </div>
            <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No feedback found</h3>
            <p class="text-[13px] text-text-muted max-w-[300px] mb-5 leading-relaxed">Trigger a review sync or adjust your filters to view feedback here.</p>
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
          {#each paginatedTraces as trace, index}
            {@const s = getStatus(trace.status)}
            {@const scoreBadge = getScoreBadge(trace.score, trace.raw_score, trace.model)}
            <a href={`/dashboard/feedback/${trace.id}`} class={`grid grid-cols-12 gap-4 px-6 py-4 items-center text-[13px] transition-colors group block ${index !== paginatedTraces.length - 1 ? 'border-b border-border-faint' : ''}`}>
              
              <div class="col-span-1 text-text-muted font-mono text-[12px]">{index + 1}</div>
              
              <div class="col-span-6 flex items-center gap-2 pr-4 min-w-0">
                {#if trace.reply_text}
                  <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                {/if}
                <span class="text-text-primary font-medium truncate">{trace.input}</span>
              </div>
              
              <div class="col-span-1 flex items-center justify-center">
                <Logo domain={trace.model} alt={trace.model} className="w-6 h-6 object-contain" />
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
          
          {#if totalPages > 1}
            <div class="px-6 py-4 border-t border-border-faint flex items-center justify-between">
              <span class="text-[13px] text-text-muted">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTraces.length)} of {filteredTraces.length}</span>
              <div class="flex items-center gap-2">
                <button 
                  class="px-3 py-1.5 text-[13px] font-medium rounded-md border border-border-default hover:bg-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
                  disabled={currentPage === 1}
                  onclick={() => currentPage -= 1}
                >Previous</button>
                <button 
                  class="px-3 py-1.5 text-[13px] font-medium rounded-md border border-border-default hover:bg-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
                  disabled={currentPage === totalPages}
                  onclick={() => currentPage += 1}
                >Next</button>
              </div>
            </div>
          {/if}

          {#if !hasMore && filteredTraces.length > 0 && playStoreUrl}
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
