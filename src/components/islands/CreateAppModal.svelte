<script lang="ts">
  import { onMount } from 'svelte';

  let show = false;
  let name = '';
  let url = '';
  let description = '';
  let loading = false;
  let error = '';

  onMount(() => {
    const handleOpen = () => {
      show = true;
      name = '';
      url = '';
      description = '';
      error = '';
    };

    window.addEventListener('open-create-app-modal', handleOpen);
    return () => {
      window.removeEventListener('open-create-app-modal', handleOpen);
    };
  });

  function close() {
    show = false;
  }

  async function submit() {
    if (!name.trim()) {
      error = 'App name is required.';
      return;
    }

    loading = true;
    error = '';

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, description })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create app');
      }

      // Success! Reload the page to fetch the new app in the sidebar
      // Optional: Set a cookie or search param to auto-select this new app
      window.location.reload();
    } catch (err: any) {
      error = err.message;
      loading = false;
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="bg-bg-surface w-full max-w-[440px] rounded-[16px] shadow-2xl border border-border-default overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="px-6 py-5 border-b border-border-default flex items-center justify-between bg-bg-base/50">
        <div>
          <h2 id="modal-title" class="text-[18px] font-bold text-text-primary tracking-tight">Create New App</h2>
          <p class="text-[13px] text-text-muted mt-1">Setup a workspace to track competitors and feedback.</p>
        </div>
        <button aria-label="Close modal" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors" on:click={close}>
          <svg class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-5">
        {#if error}
          <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-500 text-[13px] font-medium flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path></svg>
            <p>{error}</p>
          </div>
        {/if}

        <div class="space-y-1.5">
          <label for="appName" class="block text-[13px] font-semibold text-text-primary">App Name <span class="text-red-500">*</span></label>
          <input id="appName" type="text" bind:value={name} placeholder="e.g. Mindphor Intelligence" class="w-full bg-bg-base border border-border-default rounded-[8px] px-3.5 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
        </div>

        <div class="space-y-1.5">
          <label for="appUrl" class="block text-[13px] font-semibold text-text-primary">Website URL</label>
          <input id="appUrl" type="url" bind:value={url} placeholder="e.g. https://mindphor.com" class="w-full bg-bg-base border border-border-default rounded-[8px] px-3.5 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
        </div>

        <div class="space-y-1.5">
          <label for="appDesc" class="block text-[13px] font-semibold text-text-primary">Description</label>
          <textarea id="appDesc" bind:value={description} placeholder="Briefly describe what this app does..." rows="3" class="w-full bg-bg-base border border-border-default rounded-[8px] px-3.5 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none"></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-border-default flex items-center justify-end gap-3 bg-bg-base/50">
        <button class="px-4 py-2 rounded-[8px] text-[14px] font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors" on:click={close} disabled={loading}>
          Cancel
        </button>
        <button class="px-5 py-2 rounded-[8px] text-[14px] font-semibold text-white bg-accent hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm" on:click={submit} disabled={loading || !name.trim()}>
          {#if loading}
            <svg class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          {:else}
            Create App
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
