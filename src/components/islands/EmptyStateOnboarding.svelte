<script lang="ts">
  import { onMount } from 'svelte';
  export let projectId: string;
  export let playStoreUrl: string;

  let syncing = false;
  let error = '';
  
  let appPreview = null;
  let fetchingPreview = true;

  onMount(() => {
    if (playStoreUrl) {
      fetchPreview();
    } else {
      fetchingPreview = false;
    }
  });

  async function fetchPreview() {
    try {
      const res = await fetch(`/api/apps/playstore-info?url=${encodeURIComponent(playStoreUrl)}`);
      if (res.ok) {
        appPreview = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch app preview", e);
    } finally {
      fetchingPreview = false;
    }
  }

  async function fetchDetails() {
    if (!projectId || !playStoreUrl) {
      error = "Missing workspace ID or Play Store URL.";
      return;
    }
    
    syncing = true;
    error = '';
    
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

      if (!res.ok) {
        let errorMsg = 'Failed to fetch details';
        try {
          const json = await res.json();
          errorMsg = json.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      
      const json = await res.json();
      
      if (json.total_fetched === 0) {
        throw new Error('No reviews found for this App URL. Please check the URL in Settings.');
      }
      
      // Wait a moment for UX, then reload to show the dashboard
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
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
  
  <h1 class="text-[18px] font-bold text-text-primary tracking-tight mb-1.5">
    {#if appPreview}
      Ready to sync {appPreview.title}!
    {:else}
      Your workspace is ready!
    {/if}
  </h1>
  <p class="text-[13px] leading-relaxed text-text-secondary max-w-lg mx-auto mb-6">
    We're ready to pull the latest reviews and market signals from the Google Play Store to populate your dashboard.
  </p>

  {#if error}
    <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[14px] font-medium flex items-center justify-center gap-2">
      <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path></svg>
      {error}
    </div>
  {/if}

  <button 
    on:click={fetchDetails}
    disabled={syncing || !playStoreUrl}
    class="mx-auto px-5 py-2 bg-text-primary hover:opacity-90 text-bg-base rounded-full font-medium text-[13px] transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
  >
    {#if syncing}
      <svg class="animate-spin w-4 h-4 text-bg-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      Fetching Details...
    {:else}
      Fetch Details Now
    {/if}
  </button>
  
  {#if !playStoreUrl}
    <p class="text-sm text-red-400 mt-4 font-medium">Please add a Play Store URL in settings to fetch details.</p>
  {/if}
</div>
