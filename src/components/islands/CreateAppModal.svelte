<script lang="ts">
  import { onMount } from 'svelte';
  import Logo from './Logo.svelte';
  export let forceShow = false;
  let show = forceShow;
  
  // State
  let step = 1; // 1: App Info, 2: Platforms, 3: Competitors, 4: Success
  let name = '';
  let url = '';
  let description = '';
  let platforms = {
    appStore: '',
    playStore: '',
    reddit: ''
  };
  let competitors = [{ domain: '', category: '' }];
  let loading = false;
  let error = '';

  // App Preview State
  let appPreview = null;
  let fetchingPreview = false;
  let previewTimer = null;

  $: {
    if (platforms.playStore) {
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        fetchPlayStorePreview(platforms.playStore);
      }, 600);
    } else if (platforms.appStore) {
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        fetchAppStorePreview(platforms.appStore);
      }, 600);
    } else {
      appPreview = null;
    }
  }

  async function fetchPlayStorePreview(url: string) {
    if (!url.trim() || url.length < 5) return;
    fetchingPreview = true;
    try {
      const res = await fetch(`/api/apps/playstore-info?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        appPreview = { ...data, platform: 'playstore' };
        // Auto fill name if empty
        if (!name.trim() && data.title) {
          name = data.title;
        }
      } else {
        // don't clear if we have an appStore preview already
        if (appPreview?.platform !== 'appstore') appPreview = null;
      }
    } catch (e) {
      if (appPreview?.platform !== 'appstore') appPreview = null;
    } finally {
      fetchingPreview = false;
    }
  }

  async function fetchAppStorePreview(url: string) {
    if (!url.trim() || url.length < 5) return;
    fetchingPreview = true;
    try {
      const res = await fetch(`/api/apps/appstore-info?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        appPreview = { ...data, platform: 'appstore' };
        // Auto fill name if empty
        if (!name.trim() && data.title) {
          name = data.title;
        }
      } else {
        if (appPreview?.platform !== 'playstore') appPreview = null;
      }
    } catch (e) {
      if (appPreview?.platform !== 'playstore') appPreview = null;
    } finally {
      fetchingPreview = false;
    }
  }

  onMount(() => {
    const handleOpen = () => {
      show = true;
      step = 1;
      name = '';
      url = '';
      description = '';
      platforms = { appStore: '', playStore: '', reddit: '' };
      competitors = [{ domain: '', category: '' }];
      error = '';
      appPreview = null;
      fetchingPreview = false;
    };

    window.addEventListener('open-create-app-modal', handleOpen);
    return () => {
      window.removeEventListener('open-create-app-modal', handleOpen);
    };
  });

  function close() {
    if (!forceShow) show = false;
  }

  function addCompetitor() {
    if (competitors.length < 3) {
      competitors = [...competitors, { domain: '', category: '' }];
    }
  }

  function removeCompetitor(index: number) {
    competitors = competitors.filter((_, i) => i !== index);
    if (competitors.length === 0) competitors = [{ domain: '', category: '' }];
  }

  async function nextStep() {
    if (step === 1) {
      if (!name.trim()) {
        error = 'Workspace name is required.';
        return;
      }
      if (!platforms.playStore.trim() && !platforms.appStore.trim()) {
        error = 'At least one store URL (Google Play or Apple App Store) is required.';
        return;
      }
      error = '';
      step = 2;
    } else if (step === 2) {
      submit();
    }
  }

  function prevStep() {
    if (step > 1) {
      step -= 1;
      error = '';
    }
  }

  async function submit() {
    loading = true;
    error = '';

    try {
      // 1. Create App
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, 
          url, 
          description,
          playStoreUrl: platforms.playStore,
          appStoreUrl: platforms.appStore,
          redditSearchTerm: platforms.reddit
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create app');
      const appId = data.id;

      // 2. Add Competitors if any
      const validCompetitors = competitors.filter(c => c.domain.trim());
      for (const comp of validCompetitors) {
        await fetch('/api/competitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_id: appId,
            domain: comp.domain,
            description: `Tracking ${comp.domain}`,
            name: comp.category || 'General'
          })
        });
      }

      // 3. (Optional) Save Platforms logic goes here when backend is ready
      // Object.entries(platforms).forEach(([key, val]) => ...)

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // 4. Move to success step
      step = 3;
      loading = false;
    } catch (err: any) {
      error = err.message;
      loading = false;
    }
  }

  function finish() {
    window.location.href = '/dashboard';
  }
</script>

{#if show}
  <div class={forceShow ? "relative z-10 w-full flex justify-center transition-all py-10" : "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all py-10"} aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="bg-bg-surface w-full max-w-[500px] rounded-[20px] shadow-none border border-border-default overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Progress Bar (Steps 1 & 2 only) -->
      {#if step < 3}
      <div class="w-full bg-border-faint h-1.5 flex">
        <div class="bg-[linear-gradient(to_right,#eab308,#f97316,#ef4444,#f43f5e)] h-full transition-all duration-300 relative overflow-hidden" style="width: {step === 1 ? '50%' : '100%'}">
          <div class="absolute inset-0 opacity-[0.35] mix-blend-overlay grain-overlay"></div>
        </div>
      </div>
      {/if}

      <!-- Header -->
      <div class="px-7 py-6 border-b border-border-default flex items-start justify-between bg-bg-base/50">
        <div>
          <h2 id="modal-title" class="text-[20px] font-bold text-text-primary tracking-tight">
            {#if step === 1}
              Create New Workspace
            {:else if step === 2}
              Track Competitors
            {:else}
              Workspace Ready!
            {/if}
          </h2>
          <p class="text-[14px] text-text-muted mt-1.5">
            {#if step === 1}
              Let's setup your app environment first.
            {:else if step === 2}
              Add up to 3 competitors you want to keep an eye on.
            {:else}
              Everything is set up. You can now access your dashboard.
            {/if}
          </p>
        </div>
        {#if !forceShow && step < 3}
          <button aria-label="Close modal" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors" on:click={close}>
            <svg class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
          </button>
        {/if}
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        {#if step === 1}
          <div class="space-y-1.5">
            <label for="appName" class="block text-[13px] font-semibold text-text-primary">Workspace Name <span class="text-red-500">*</span></label>
            <input id="appName" type="text" bind:value={name} placeholder="e.g. Acme Corp" class="w-full bg-bg-base border border-border-default rounded-[10px] px-3.5 py-2 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
          </div>

          <div class="space-y-1.5">
            <label for="appUrl" class="block text-[13px] font-semibold text-text-primary">Website URL <span class="text-text-faint font-normal">(Optional)</span></label>
            <input id="appUrl" type="url" bind:value={url} placeholder="e.g. https://acme.com" class="w-full bg-bg-base border border-border-default rounded-[10px] px-3.5 py-2 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
          </div>

          <div class="space-y-1.5">
            <label for="appDesc" class="block text-[13px] font-semibold text-text-primary">Short Description <span class="text-text-faint font-normal">(Optional)</span></label>
            <textarea id="appDesc" bind:value={description} placeholder="What does this workspace focus on?" rows="1" class="w-full bg-bg-base border border-border-default rounded-[10px] px-3.5 py-2 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none"></textarea>
          </div>
          
          <div class="space-y-1.5 relative">
            <label for="playStoreUrl" class="block text-[13px] font-semibold text-text-primary">Google Play Store URL <span class="text-text-faint font-normal">(Optional)</span></label>
            <input id="playStoreUrl" type="text" bind:value={platforms.playStore} placeholder="e.g. https://play.google.com/store/apps/..." class="w-full bg-bg-base border border-border-default rounded-[10px] px-3.5 py-2 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
            
            {#if fetchingPreview}
              <div class="absolute right-3 bottom-2.5">
                <svg class="animate-spin w-4 h-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
            {/if}
          </div>

          <div class="space-y-1.5 relative">
            <label for="appStoreUrl" class="block text-[13px] font-semibold text-text-primary">Apple App Store URL <span class="text-text-faint font-normal">(Optional)</span></label>
            <input id="appStoreUrl" type="text" bind:value={platforms.appStore} placeholder="e.g. https://apps.apple.com/us/app/..." class="w-full bg-bg-base border border-border-default rounded-[10px] px-3.5 py-2 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
            
            {#if fetchingPreview && !platforms.playStore}
              <div class="absolute right-3 bottom-2.5">
                <svg class="animate-spin w-4 h-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
            {/if}
          </div>

          {#if appPreview}
            <div class="mt-2 p-3 bg-bg-subtle border border-border-faint rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <img src={appPreview.icon} alt={appPreview.title} class="w-12 h-12 rounded-[10px] shadow-sm object-cover bg-white" />
              <div class="flex-1 min-w-0">
                <h4 class="text-[14px] font-bold text-text-primary truncate">{appPreview.title}</h4>
                <p class="text-[12px] text-text-secondary truncate mt-0.5">{appPreview.developer}</p>
              </div>
              
              {#if appPreview.platform === 'appstore'}
                <div class="w-7 h-7 rounded-full bg-bg-surface border border-border-faint flex items-center justify-center flex-shrink-0">
                  <img src="/local_logos/appstore.svg" alt="App Store" class="w-4 h-4 object-contain opacity-80" />
                </div>
              {:else}
                <div class="w-7 h-7 rounded-full bg-bg-surface border border-border-faint flex items-center justify-center flex-shrink-0">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" alt="Google Play" class="w-4 h-4 object-contain opacity-80" />
                </div>
              {/if}
            </div>
          {/if}
        {:else if step === 2}
          <div class="space-y-4">
            {#each competitors as comp, index}
              <div class="flex items-start gap-3">
                <div class="flex-1 space-y-2">
                  <input type="text" bind:value={comp.domain} placeholder="Domain (e.g. linear.app)" class="w-full bg-bg-base border border-border-default rounded-[10px] px-3.5 py-2 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                </div>
                <div class="flex-1 space-y-2">
                  <input type="text" bind:value={comp.category} placeholder="Category (e.g. Productivity)" class="w-full bg-bg-base border border-border-default rounded-[10px] px-3.5 py-2 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                </div>
                {#if competitors.length > 1}
                <button aria-label="Remove competitor" class="mt-1 w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors" on:click={() => removeCompetitor(index)}>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                {/if}
              </div>
            {/each}

            {#if competitors.length < 3}
            <button class="text-[13px] font-medium text-accent hover:text-accent-hover transition-colors flex items-center gap-1 mt-2" on:click={addCompetitor}>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Add another competitor
            </button>
            {/if}
          </div>
        {:else if step === 3}
          <div class="flex flex-col items-center justify-center py-6 text-center">
            <div class="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/5">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 class="text-[18px] font-bold text-text-primary">You're All Set!</h3>
            <p class="text-[14px] text-text-secondary mt-2">Your workspace "{name}" has been created. We'll start tracking your platforms and competitors in the background.</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-7 py-5 border-t border-border-default flex items-center justify-between bg-bg-base/50">
        {#if step === 1}
          <div class="flex-1">
            {#if error}
              <div class="text-red-500 text-[13px] font-medium flex items-center gap-1.5">
                <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path></svg>
                <p>{error}</p>
              </div>
            {/if}
          </div>
          <button class="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-accent hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center gap-2" on:click={nextStep}>
            Next Step
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        {:else if step === 2}
          <div class="flex items-center gap-3">
            <button class="px-5 py-2 rounded-full text-[14px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors" on:click={prevStep} disabled={loading}>
              Back
            </button>
            {#if error}
              <div class="text-red-500 text-[13px] font-medium flex items-center gap-1.5">
                <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path></svg>
                <p>{error}</p>
              </div>
            {/if}
          </div>
          <button class="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-accent hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none" on:click={nextStep} disabled={loading}>
            {#if loading}
              <svg class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Saving...
            {:else}
              Complete Setup
            {/if}
          </button>
        {:else if step === 3}
          <button class="w-full px-6 py-3 rounded-full text-[15px] font-bold text-white bg-accent hover:bg-accent-hover active:scale-[0.98] transition-all" on:click={finish}>
            Go to Dashboard
          </button>
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  .grain-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }
</style>
