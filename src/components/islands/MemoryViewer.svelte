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
    if (!projectId && typeof window !== "undefined") {
      projectId = localStorage.getItem("project_id") || "";
    }
    loadData();
    pollInterval = setInterval(loadData, 60000); // 60 seconds
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });
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
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path></svg
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
        <div
          class="py-12 text-center flex-1 flex items-center justify-center text-[13px] text-text-muted animate-pulse"
        >
          Loading competitors...
        </div>
      {:else if memoryKeys.length === 0}
        <div
          class="flex-1 flex flex-col items-center justify-center min-h-[150px]"
        >
          <p class="text-[13px] text-text-muted">No competitors monitored.</p>
        </div>
      {:else}
        {#each filteredKeys as mem}
          <a
            href={`/dashboard/competitors/${mem.key}`}
            class="flex gap-[14px] py-3 px-3 -mx-3 hover:bg-bg-subtle/40 transition-colors rounded-md group items-start outline-none focus-visible:ring-2 focus-visible:ring-accent block"
          >
            <div
              class="mt-[2px] flex-shrink-0 w-8 h-8 rounded-full bg-bg-surface border border-border-default p-1.5 flex items-center justify-center"
            >
              <Logo
                domain={mem.key}
                alt={mem.key}
                title={mem.key}
                className="w-full h-full object-contain"
              />
            </div>
            <div class="flex flex-col gap-[4px] flex-1">
              <div class="flex items-center gap-2">
                <span
                  class="text-[13px] text-text-primary leading-snug font-semibold group-hover:text-accent transition-colors"
                  >{mem.key}</span
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
                >{mem.value}</span
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
    {#if loading}
      <div
        class="w-full py-12 flex justify-center text-text-muted text-[13px] animate-pulse"
      >
        Loading competitor data...
      </div>
    {:else if memoryKeys.length === 0}
      <div
        class="w-full py-16 flex flex-col items-center justify-center bg-bg-surface border border-border-default rounded-[16px]"
      >
        <div
          class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path></svg
          >
        </div>
        <h3 class="text-[15px] font-medium text-text-primary mb-1.5">
          No competitors monitored.
        </h3>
        <p
          class="text-[13px] text-text-muted max-w-[400px] leading-relaxed text-center"
        >
          Configure your competitor watch list in settings to start tracking.
        </p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredKeys as mem}
          <a
            href={`/dashboard/competitors/${mem.key}`}
            class="bg-bg-surface border border-border-default rounded-[16px] p-6 flex flex-col h-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent block group"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-11 h-11 rounded-full bg-bg-subtle border border-border-faint flex items-center justify-center p-2.5"
                >
                  <Logo
                    domain={mem.key}
                    alt={mem.key}
                    title={mem.key}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div class="flex flex-col">
                  <span
                    class="text-[15px] font-semibold text-text-primary leading-tight"
                    >{mem.key}</span
                  >
                  <span class="text-[12px] text-text-muted mt-0.5 tracking-wide"
                    >Competitor Update</span
                  >
                </div>
              </div>
              {#if mem.is_stale === false || mem.status === "fresh"}
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-tag-fresh-bg)] text-[var(--color-tag-fresh-text)] font-bold uppercase tracking-wider border border-[var(--color-tag-fresh-text)]/10"
                  >Active</span
                >
              {:else}
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-tag-stale-bg)] text-[var(--color-tag-stale-text)] font-bold uppercase tracking-wider border border-[var(--color-tag-stale-text)]/10"
                  >Idle</span
                >
              {/if}
            </div>

            <div
              class="text-[14px] text-text-secondary leading-relaxed flex-1 mt-1 mb-6"
            >
              {mem.value}
            </div>

            <div
              class="pt-4 border-t border-border-faint text-[12px] text-text-muted flex items-center justify-between mt-auto font-medium"
            >
              <div class="flex items-center gap-1.5">
                <svg
                  class="w-4 h-4 text-text-faint"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path></svg
                >
                Updated {getRelativeTime(mem.updated_at)}
              </div>
              <svg
                class="w-4 h-4 text-text-faint group-hover:text-accent transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                ></path></svg
              >
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
{/if}
