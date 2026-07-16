<script lang="ts">
  import { onMount } from "svelte";
  import Logo from "./Logo.svelte";
  export let projectId: string = "";
  export let overviewLink: boolean = false;
  export let date: string = "";

  let memoryKeys: any[] = [];
  let loading = true;
  let isRefreshing = false;
  let pollInterval: any;

  $: filteredKeys = memoryKeys;

  function processUsers(keys: any[]) {
    // Dropdown removed, no need to process distinct users
  }

  function getRelativeTime(isoString: string) {
    if (!isoString) return "";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffHrs > 24) return `${Math.floor(diffHrs / 24)} days ago`;
    if (diffHrs > 0) return `${diffHrs} hrs ago`;
    if (diffMins > 0) return `${diffMins} mins ago`;
    return "Just now";
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
      const url = `/api/competitors?app_id=${projectId}${date ? `&date=${date}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        memoryKeys = json.competitors || json.keys || json.memoryKeys || [];
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
    if (!projectId && typeof window !== "undefined") {
      projectId = localStorage.getItem("project_id") || "";
    }
    loadData();
    pollInterval = setInterval(loadData, 60000); // 60 seconds
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });

  // Add Competitor States & Handler
  let showAddModal = false;
  let newDomain = "";
  let newDescription = "";
  let adding = false;
  let addError = "";

  async function submitAddCompetitor() {
    if (!newDomain.trim()) {
      addError = "Domain name is required.";
      return;
    }
    
    let domainVal = newDomain.trim().toLowerCase();
    domainVal = domainVal.replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!domainVal.includes(".") || domainVal.length < 4) {
      addError = "Please enter a valid domain name (e.g. competitor.com).";
      return;
    }

    adding = true;
    addError = "";

    

    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: projectId,
          name: domainVal.split(".")[0],
          domain: domainVal,
          description: newDescription.trim() || `Tracking ${domainVal}`
        })
      });

      if (res.ok) {
        newDomain = "";
        newDescription = "";
        showAddModal = false;
        await loadData();
      } else {
        const data = await res.json();
        addError = data.error || "Failed to add competitor. Please try again.";
      }
    } catch (err: any) {
      console.error(err);
      addError = err.message || "An unexpected error occurred.";
    } finally {
      adding = false;
    }
  }

  let showDeleteModal = false;
  let domainToDelete = "";
  let deleting = false;

  function deleteCompetitor(domainVal: string) {
    domainToDelete = domainVal;
    showDeleteModal = true;
  }

  async function confirmDeleteCompetitor() {
    if (!domainToDelete) return;
    deleting = true;

    

    try {
      const res = await fetch("/api/competitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: projectId,
          domain: domainToDelete
        })
      });

      if (res.ok) {
        showDeleteModal = false;
        domainToDelete = "";
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete competitor.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred.");
    } finally {
      deleting = false;
    }
  }
</script>

{#if overviewLink}
  <!-- Dashboard Widget View (Boxed) -->
  <div
    class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden w-full flex flex-col h-full"
  >
    <div
      class="px-6 py-4 bg-bg-subtle border-b border-border-faint flex items-center justify-between"
    >
      <div class="flex items-center">
        <a
          href="/dashboard/competitors"
          class="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase flex items-center gap-1 hover:text-text-primary transition-colors group"
        >
          COMPETITOR WATCH
          <svg
            class="w-3.5 h-3.5 text-text-faint group-hover:text-text-primary transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg
          >
        </a>
      </div>

      <div class="flex items-center gap-4">
        <div class="relative group/tooltip flex items-center">
          <button
            on:click={manualReload}
            class="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-bg-elevated focus:outline-none"
            aria-label="Refresh competitors"
          >
            <svg
              class={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-text-primary" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg
            >
          </button>
          <div
            class="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-default text-text-primary text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10"
          >
            Refresh competitors
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 py-4 flex flex-col flex-1 gap-2 overflow-y-auto">
      {#if loading}
        <div class="py-12 text-center flex-1 flex flex-col items-center justify-center min-h-[200px]">
          <div class="w-6 h-6 border-[2px] border-border-default border-t-text-muted rounded-full animate-spin mb-3"></div>
          <span class="text-[12px] text-text-muted font-medium animate-pulse">Loading...</span>
        </div>
      {:else if memoryKeys.length === 0}
        <div class="flex-1 flex flex-col items-center justify-center min-h-[160px] py-6 px-6 mt-2 text-center">
          <button 
            class="flex items-center gap-2 h-9 px-4 rounded-full bg-text-primary text-bg-base text-[13px] font-medium hover:opacity-90 transition-all focus:outline-none cursor-pointer"
            on:click={() => (showAddModal = true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Competitor
          </button>
        </div>
      {:else}
        {#each filteredKeys as mem}
          <a
            href={`/dashboard/competitors/${mem.domain}`}
            class="flex gap-[14px] py-3 px-3 -mx-3 hover:bg-bg-subtle/40 transition-colors rounded-md group items-start outline-none focus-visible:ring-2 focus-visible:ring-accent block"
          >
            <div class="flex-shrink-0 w-[40px] h-[40px] flex items-center justify-center">
              <Logo
                client:load
                domain={mem.domain}
                alt={mem.domain}
                title={mem.domain}
                className="w-7 h-7 object-contain"
              />
            </div>
            <div class="flex flex-col gap-[4px] flex-1 pt-0.5">
              <div class="flex items-center gap-2">
                <span
                  class="text-[13px] text-text-primary leading-snug font-semibold group-hover:text-accent transition-colors"
                  >{mem.domain}</span
                >
                {#if mem.is_stale === false || mem.status === "fresh"}
                  <span
                    class="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-tag-fresh-bg)] text-[var(--color-tag-fresh-text)] font-bold uppercase tracking-wider"
                    >Active</span
                  >
                {:else}
                  <span
                    class="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-tag-stale-bg)] text-[var(--color-tag-stale-text)] font-bold uppercase tracking-wider"
                    >Idle</span
                  >
                {/if}
                <span class="text-[11px] text-text-muted ml-auto font-medium"
                  >{getRelativeTime(mem.updated_at)}</span
                >
              </div>
              <span class="text-[13px] text-text-secondary leading-relaxed"
                >{mem.description}</span
              >
            </div>
          </a>
        {/each}
      {/if}
    </div>
  </div>
{:else}
  <!-- Full Page View (Standalone Grid of Cards, NO OUTER BOX) -->
  <div class="w-full flex flex-col">
    <!-- Watchlist Section Header (Aligned with standard dashboard pattern) -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h2 class="text-[15px] font-semibold text-text-primary">Watchlist</h2>
        <span class="text-[11px] font-semibold px-2 py-0.5 bg-bg-subtle text-text-muted rounded-full border border-border-default/60">{filteredKeys.length}</span>
      </div>
      <div class="flex items-center gap-2.5">
        {#if memoryKeys.length > 0}
          <!-- Add Competitor Button -->
          <button
            on:click={() => (showAddModal = true)}
            class="flex items-center gap-2 h-9 px-4 rounded-full bg-text-primary text-bg-base text-[13px] font-semibold hover:opacity-90 transition-all focus:outline-none cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add competitor
          </button>
        {/if}
      </div>
    </div>

    {#if loading}
      <div class="w-full flex-1 min-h-[60vh] flex flex-col items-center justify-center">
        <div class="w-8 h-8 border-[3px] border-border-default border-t-text-muted rounded-full animate-spin mb-4"></div>
        <span class="text-[13px] text-text-muted font-medium animate-pulse">Loading data...</span>
      </div>
    {:else if memoryKeys.length === 0}
      <div class="w-full py-16 flex flex-col items-center justify-center bg-bg-surface border border-border-default border-dashed rounded-[16px] text-center">
        <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
        <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No competitors monitored.</h3>
        <p class="text-[13px] text-text-muted max-w-[320px] leading-relaxed mb-6">Start tracking your first competitor to monitor product updates and sentiment shifts.</p>
        <button
          on:click={() => (showAddModal = true)}
          class="flex items-center gap-2 h-9 px-4 rounded-full bg-text-primary text-bg-base text-[13px] font-semibold hover:opacity-90 transition-all focus:outline-none cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add competitor
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredKeys as mem}
          <a
            href={`/dashboard/competitors/${mem.domain}`}
            class="bg-bg-surface border border-border-default rounded-[16px] p-6 flex flex-col h-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent block group"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 flex items-center justify-center flex-shrink-0">
                  <Logo client:load domain={mem.domain} alt={mem.domain} title={mem.domain} className="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-semibold text-text-primary leading-tight">{mem.domain}</span>
                  <span class="text-[12px] text-text-muted mt-0.5 tracking-wide">Competitor Update</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                {#if mem.is_stale === false || mem.status === "fresh"}
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-tag-fresh-bg)] text-[var(--color-tag-fresh-text)] font-bold uppercase tracking-wider border border-[var(--color-tag-fresh-text)]/10">Active</span>
                {:else}
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-tag-stale-bg)] text-[var(--color-tag-stale-text)] font-bold uppercase tracking-wider border border-[var(--color-tag-stale-text)]/10">Idle</span>
                {/if}
                <button
                  on:click|preventDefault|stopPropagation={() => deleteCompetitor(mem.domain)}
                  class="p-1 rounded-[6px] text-text-muted hover:text-red-500 transition-colors focus:outline-none cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </div>

            <p class="text-[14px] text-text-secondary leading-relaxed line-clamp-3 mb-5">
              {mem.description}
            </p>

            <div class="pt-4 border-t border-border-faint text-[12px] text-text-muted flex items-center justify-between mt-auto font-medium">
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Updated {getRelativeTime(mem.updated_at)}
              </div>
              <svg class="w-4 h-4 text-text-faint hover:text-accent transition-transform duration-200 hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- Add Competitor Modal (real inserts + guest mocks) -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4" on:click={() => (showAddModal = false)}>
    <div class="bg-bg-surface border border-border-default rounded-[16px] w-full max-w-[400px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col z-[101]" on:click|stopPropagation>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[16px] font-semibold text-text-primary font-sans">Add Competitor</h3>
        <button on:click={() => (showAddModal = false)} class="text-text-muted hover:text-text-primary transition-colors focus:outline-none cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {#if addError}
        <div class="mb-4 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-[8px] text-[12px] font-medium leading-relaxed">
          {addError}
        </div>
      {/if}

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-medium text-text-secondary" for="competitor-domain">Website Domain</label>
          <input
            id="competitor-domain"
            type="text"
            placeholder="e.g. linear.app"
            bind:value={newDomain}
            class="w-full h-10 px-3 bg-bg-subtle border border-border-default rounded-[8px] text-[13px] text-text-primary focus:outline-none focus:border-border-strong focus:bg-bg-surface transition-all placeholder:text-text-muted"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-medium text-text-secondary" for="competitor-desc">Description (Optional)</label>
          <textarea
            id="competitor-desc"
            placeholder="e.g. Issue tracker and project planning tool"
            bind:value={newDescription}
            rows="3"
            class="w-full p-3 bg-bg-subtle border border-border-default rounded-[8px] text-[13px] text-text-primary focus:outline-none focus:border-border-strong focus:bg-bg-surface transition-all placeholder:text-text-muted resize-none"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 mt-6">
        <button
          on:click={() => (showAddModal = false)}
          class="h-9 px-4 rounded-[8px] border border-border-default hover:bg-bg-subtle/50 text-[13px] font-semibold text-text-secondary transition-colors focus:outline-none cursor-pointer"
        >
          Cancel
        </button>
        <button
          on:click={submitAddCompetitor}
          disabled={adding}
          class="h-9 px-4 rounded-[8px] bg-text-primary text-bg-base text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center min-w-[80px] focus:outline-none cursor-pointer"
        >
          {#if adding}
            <div class="w-4 h-4 border-[2px] border-bg-base border-t-transparent rounded-full animate-spin"></div>
          {:else}
            Add
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4" on:click={() => (showDeleteModal = false)}>
    <div class="bg-bg-surface border border-border-default rounded-[16px] w-full max-w-[380px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col z-[111]" on:click|stopPropagation>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[16px] font-semibold text-text-primary font-sans">Delete Competitor</h3>
        <button on:click={() => (showDeleteModal = false)} class="text-text-muted hover:text-text-primary transition-colors focus:outline-none cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <p class="text-[13px] text-text-secondary leading-relaxed mb-6">
        Are you sure you want to stop tracking <strong class="text-text-primary">{domainToDelete}</strong>? This will remove all collected intelligence logs.
      </p>

      <div class="flex items-center justify-end gap-3">
        <button
          on:click={() => (showDeleteModal = false)}
          class="h-9 px-4 rounded-[8px] border border-border-default hover:bg-bg-subtle/50 text-[13px] font-semibold text-text-secondary transition-colors focus:outline-none cursor-pointer"
        >
          Cancel
        </button>
        <button
          on:click={confirmDeleteCompetitor}
          disabled={deleting}
          class="h-9 px-4 rounded-[8px] bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold transition-colors focus:outline-none cursor-pointer flex items-center justify-center min-w-[80px]"
        >
          {#if deleting}
            <div class="w-4 h-4 border-[2px] border-white border-t-transparent rounded-full animate-spin"></div>
          {:else}
            Delete
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
