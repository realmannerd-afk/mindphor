<script lang="ts">
  import { onMount } from 'svelte';
  export let projectId: string = '';
  export let overviewLink: boolean = false;

  let memoryKeys: any[] = [];
  let loading = true;
  let isRefreshing = false;
  let pollInterval: any;

  // UI state for User Dropdown
  let distinctUsers: string[] = [];
  let selectedUser: string = '';

  $: filteredKeys = selectedUser ? memoryKeys.filter(m => m.user_id === selectedUser) : memoryKeys;

  function processUsers(keys: any[]) {
    const users = Array.from(new Set(keys.map(k => k.user_id).filter(Boolean))) as string[];
    distinctUsers = users;
    if (distinctUsers.length > 0 && !distinctUsers.includes(selectedUser)) {
      selectedUser = distinctUsers[0];
    }
  }

  function getRelativeTime(isoString: string) {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffHrs > 24) return `${Math.floor(diffHrs / 24)} days ago`;
    if (diffHrs > 0) return `${diffHrs} hrs ago`;
    if (diffMins > 0) return `${diffMins} mins ago`;
    return 'Just now';
  }

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
      const res = await fetch(`/api/memory?project_id=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        // Fallback to json.keys since the backend now returns { keys: [...] }
        memoryKeys = json.keys || json.memoryKeys || [];
        processUsers(memoryKeys);
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // If projectId is not passed, attempt to grab it from localStorage
    if (!projectId && typeof window !== 'undefined') {
      projectId = localStorage.getItem('project_id') || '';
    }
    loadData();
    pollInterval = setInterval(loadData, 60000); // 60 seconds
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });
</script>

<div class={`bg-bg-surface border border-border-default rounded-[16px] overflow-hidden w-full flex flex-col ${overviewLink ? 'h-full' : 'max-h-full'}`}>
  <div class="px-6 py-4 bg-bg-subtle border-b border-border-faint flex items-center justify-between">
    <div class="flex items-center">
      {#if overviewLink}
        <a href="/dashboard/memory" class="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase flex items-center gap-1 hover:text-text-primary transition-colors group">
          ACTIVE MEMORY
          <svg class="w-3.5 h-3.5 text-text-faint group-hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
        </a>
      {:else}
        <div class="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">ACTIVE MEMORY</div>
      {/if}
    </div>
    
    <div class="flex items-center gap-4">
      <div class="relative group/tooltip flex items-center">
        <button on:click={manualReload} class="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-bg-elevated focus:outline-none" aria-label="Refresh memory">
          <svg class={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-default text-text-primary text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10">
          Refresh memory
        </div>
      </div>

      {#if distinctUsers.length > 0}
        <div class="relative">
          <select bind:value={selectedUser} class="appearance-none flex items-center gap-2 pl-3 pr-8 py-1 rounded-md border border-border-default bg-bg-surface cursor-pointer hover:border-border-strong transition-colors text-[13px] text-text-primary font-medium focus:outline-none">
            {#each distinctUsers as user}
              <option value={user}>User {user}</option>
            {/each}
          </select>
          <svg class="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"></path></svg>
        </div>
      {/if}
    </div>
  </div>

  <div class="px-6 py-2 flex flex-col flex-1 divide-y divide-border-faint overflow-y-auto">
    {#if loading}
      <div class="py-12 text-center flex-1 flex items-center justify-center text-[13px] text-text-muted animate-pulse">Loading memory...</div>
    {:else if memoryKeys.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center">
        <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
        <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No memory keys yet.</h3>
        <p class="text-[13px] text-text-muted max-w-[400px] leading-relaxed text-center">Use the SDK to start tracking user context.</p>
      </div>
    {:else}
      {#each filteredKeys as mem}
        <div class="py-2">
          <a href={overviewLink ? "/dashboard/memory" : `/memory/${mem.id}`} class="flex items-center justify-between py-3 px-3 -mx-3 hover:bg-bg-subtle/40 transition-colors rounded-md group">
            <div class="flex items-center gap-4 w-full overflow-hidden pr-4">
              <div class="flex items-center justify-between w-[220px] flex-shrink-0 pr-2">
                <span class="text-[13px] text-text-primary font-medium truncate">{mem.key}</span>
                {#if mem.is_stale === false || mem.status === 'fresh'}
                  <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--color-tag-fresh-bg)] text-[var(--color-tag-fresh-text)] font-medium">fresh</span>
                {:else}
                  <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--color-tag-stale-bg)] text-[var(--color-tag-stale-text)] font-medium">stale</span>
                {/if}
              </div>
              <div class="flex-1 flex flex-col justify-center pr-2">
                <div class="w-full text-[12px] font-mono tracking-tight px-3 py-1.5 rounded-[6px] bg-transparent border-transparent text-text-secondary truncate">
                  {mem.value ? (mem.value.length > 40 ? mem.value.substring(0, 40) + '...' : mem.value) : ''}
                </div>
              </div>
              <div class="flex-shrink-0 text-[11px] text-text-muted font-medium w-[80px] text-right">
                {getRelativeTime(mem.updated_at)}
              </div>
              {#if !overviewLink}
                <div class="flex-shrink-0 pl-2">
                  <svg class="w-4 h-4 text-text-faint group-hover:text-text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"></path></svg>
                </div>
              {/if}
            </div>
          </a>
        </div>
      {/each}
    {/if}
  </div>
</div>
