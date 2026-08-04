<script lang="ts">
  import { onMount } from 'svelte';
  import Logo from './Logo.svelte';
  
  export let projectId: string;
  export let playStoreUrl: string = '';
  export let appStoreUrl: string = '';
  export let hasPlan: boolean = false;

  let syncing = false;
  let error = '';
  let progressText = 'Fetching Details...';
  
  let appPreview: any = null;
  let fetchingPreview = true;

  // Sync Configuration Options
  let fetchSource = 'both';
  let fetchCountry = 'all';
  let fetchLimit = 50;
  let fetchSinceDate = '';

  $: missingUrlMessage = (() => {
    const hasApple = appStoreUrl && appStoreUrl !== 'null' && appStoreUrl !== 'undefined';
    const hasGoogle = playStoreUrl && playStoreUrl !== 'null' && playStoreUrl !== 'undefined';
    
    if (fetchSource === 'appstore' && !hasApple) return 'Please add your App Store URL in settings.';
    if (fetchSource === 'playstore' && !hasGoogle) return 'Please add your Play Store URL in settings.';
    if (fetchSource === 'both') {
      if (!hasApple && !hasGoogle) return 'Please add both Store URLs in settings.';
      if (!hasApple) return 'Please add your App Store URL in settings to fetch both.';
      if (!hasGoogle) return 'Please add your Play Store URL in settings to fetch both.';
    }
    return '';
  })();

  onMount(() => {
    if (playStoreUrl || appStoreUrl) {
      fetchPreview();
    } else {
      fetchingPreview = false;
    }
  });

  async function fetchPreview() {
    try {
      let endpoint = '';
      if (playStoreUrl && playStoreUrl !== 'null' && playStoreUrl !== 'undefined') {
        endpoint = `/api/apps/playstore-info?url=${encodeURIComponent(playStoreUrl)}`;
      } else if (appStoreUrl && appStoreUrl !== 'null' && appStoreUrl !== 'undefined') {
        endpoint = `/api/apps/appstore-info?url=${encodeURIComponent(appStoreUrl)}`;
      }
      
      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
          appPreview = await res.json();
        }
      }
    } catch (e) {
      console.error("Failed to fetch app preview", e);
    } finally {
      fetchingPreview = false;
    }
  }

  async function fetchDetails() {
    if (syncing) return;
    
    syncing = true;
    error = '';
    progressText = 'Starting fetch...';
    
    if (!playStoreUrl && !appStoreUrl) {
      error = "Please configure at least one platform URL in Settings before fetching.";
      syncing = false;
      return;
    }

    try {
      let syncUrl = `/api/apps/sync-reviews?app_id=${projectId}&limit=${fetchLimit}`;
      if (fetchCountry !== 'all') {
        syncUrl += `&countries=${fetchCountry}`;
      }
      if (fetchSource !== 'both') {
        syncUrl += `&source=${fetchSource}`;
      }
      if (fetchSinceDate) {
        syncUrl += `&sinceDate=${fetchSinceDate}`;
      }

      const res = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const reader = res.body?.getReader();
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
                    error = data.error;
                    syncing = false;
                    return;
                  }
                  if (data.status === 'scraping' || data.status === 'analyzing') {
                    progressText = data.message;
                  } else if (data.status === 'inserting') {
                    progressText = `${data.current} / ${data.total} processed`;
                  } else if (data.status === 'complete') {
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  }
                } catch(e) {}
              }
            }
          }
        }
      } else {
        error = 'Failed to read response stream.';
      }
      
    } catch (e: any) {
      error = e.message || 'An error occurred';
      syncing = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto mt-10 px-6 text-center">
  {#if fetchingPreview}
    <div class="w-16 h-16 bg-bg-elevated rounded-2xl mx-auto mb-4 border border-border-default flex items-center justify-center">
      <svg class="animate-spin w-6 h-6 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
  {:else if appPreview}
    <img src={appPreview.icon} alt={appPreview.title} class="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 shadow-sm object-cover border border-border-default" />
  {:else}
    <div class="w-16 h-16 bg-bg-elevated text-text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-default">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    </div>
  {/if}
  
  <!-- Vercel-Style Configuration Card -->
  <div class="max-w-2xl mx-auto border border-border-default rounded-lg bg-bg-base text-left mb-8 overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
    
    <!-- Card Header -->
    <div class="p-5 border-b border-border-default bg-bg-base">
      <h3 class="text-[16px] font-semibold text-text-primary tracking-tight">Sync Configuration</h3>
      <p class="text-[14px] text-text-secondary mt-1">Configure the parameters for your initial data sync from the app stores.</p>
    </div>
    
    <!-- Card Body -->
    <div class="p-5 flex flex-col gap-6 bg-bg-base">
      
      <!-- Platform Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="text-[14px] font-medium text-text-primary">Platform Source</h4>
          <p class="text-[13px] text-text-secondary mt-1">Select which app stores to pull feedback from.</p>
        </div>
        <div class="relative w-full sm:w-[200px]">
          <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
            {#if fetchSource === 'appstore'}
              <Logo domain="appstore" className="w-3.5 h-3.5 object-contain opacity-80" />
            {:else if fetchSource === 'playstore'}
              <Logo domain="playstore" className="w-3.5 h-3.5 object-contain opacity-80" />
            {:else}
              <Logo domain="appstore" className="w-3.5 h-3.5 object-contain opacity-80" />
              <Logo domain="playstore" className="w-3.5 h-3.5 object-contain opacity-80" />
            {/if}
          </div>
          <select bind:value={fetchSource} class={`w-full bg-bg-surface border border-border-default rounded-md pr-8 py-1.5 h-9 text-[13px] text-text-primary outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary transition-all cursor-pointer appearance-none ${fetchSource === 'both' ? 'pl-12' : 'pl-9'}`}>
            <option value="both">Both Stores</option>
            <option value="appstore">App Store</option>
            <option value="playstore">Play Store</option>
          </select>
          <svg class="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>

      <div class="h-px w-full bg-border-default/50"></div>

      <!-- Region Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="text-[14px] font-medium text-text-primary">Store Region</h4>
          <p class="text-[13px] text-text-secondary mt-1">Target a specific country storefront.</p>
        </div>
        <div class="relative w-full sm:w-[200px]">
          <select bind:value={fetchCountry} class="w-full bg-bg-surface border border-border-default rounded-md px-3 py-1.5 h-9 text-[13px] text-text-primary outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary transition-all cursor-pointer appearance-none">
            <option value="all">Global (All Regions)</option>
            <option value="us">United States (US)</option>
            <option value="gb">United Kingdom (GB)</option>
            <option value="ca">Canada (CA)</option>
            <option value="au">Australia (AU)</option>
            <option value="in">India (IN)</option>
          </select>
          <svg class="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>

      <div class="h-px w-full bg-border-default/50"></div>

      <!-- Limit Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="text-[14px] font-medium text-text-primary">Fetch Limit</h4>
          <p class="text-[13px] text-text-secondary mt-1">Maximum number of reviews to ingest initially.</p>
        </div>
        <div class="relative w-full sm:w-[200px]">
          <select bind:value={fetchLimit} class="w-full bg-bg-surface border border-border-default rounded-md px-3 py-1.5 h-9 text-[13px] text-text-primary outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary transition-all cursor-pointer appearance-none">
            <option value={50}>50 Reviews (Fastest)</option>
            <option value={100}>100 Reviews</option>
            <option value={500}>500 Reviews</option>
            <option value={1000}>1,000 Reviews</option>
            <option value={3000}>3,000 Reviews (Max)</option>
          </select>
          <svg class="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>

      <div class="h-px w-full bg-border-default/50"></div>

      <!-- Date Limit Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="text-[14px] font-medium text-text-primary">Fetch Since Date</h4>
          <p class="text-[13px] text-text-secondary mt-1">Optional. Only fetch reviews after this date.</p>
        </div>
        <div class="relative w-full sm:w-[200px]">
          <input type="date" bind:value={fetchSinceDate} class="w-full bg-bg-surface border border-border-default rounded-md px-3 py-1.5 h-9 text-[13px] text-text-primary outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary transition-all cursor-pointer" />
        </div>
      </div>

    </div>

    <!-- Card Footer (Vercel Style Action Bar) -->
    <div class="bg-bg-surface border-t border-border-default p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="text-[13px] text-text-secondary font-medium flex items-center gap-2">
        {#if error}
          <span class="text-red-500 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            {error}
          </span>
        {:else if missingUrlMessage}
          <span class="text-red-400">{missingUrlMessage}</span>
        {:else if !hasPlan}
          <span class="text-amber-500 font-semibold">Upgrade to a paid plan to fetch app details and analyze feedback.</span>
        {:else}
          Ready to fetch application data.
        {/if}
      </div>
      
      {#if !hasPlan}
        <a 
          href="/dashboard/billing"
          class="px-5 py-2 bg-accent hover:opacity-90 text-white rounded-full font-medium text-[13px] transition-opacity flex items-center justify-center min-w-[140px]"
        >
          View Plans
        </a>
      {:else}
        <button 
          on:click={fetchDetails}
          disabled={syncing || !!missingUrlMessage}
          class="px-5 py-2 bg-text-primary hover:opacity-90 text-bg-base rounded-full font-medium text-[13px] transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none min-w-[140px]"
        >
          {#if syncing}
            <svg class="animate-spin w-4 h-4 text-bg-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {progressText}
          {:else}
            Fetch Details
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>
