<script lang="ts">
  import { onMount } from 'svelte';
  export let projectId: string = '';
  export let expanded: boolean = false;
  export let overviewLink: boolean = false;

  let alerts: any[] = [];
  let loading = true;
  let isRefreshing = false;
  let pollInterval: any;
  let unreadCount = 0;

  function updateUnreadCount() {
    if (typeof document === 'undefined') return;
    const cookies = document.cookie.split(';');
    let lastSeen = 0;
    for (let c of cookies) {
      const [key, val] = c.trim().split('=');
      if (key === 'last_seen_alerts_count') {
        lastSeen = parseInt(val || '0');
      }
    }
    unreadCount = Math.max(0, alerts.length - lastSeen);
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
      const res = await fetch(`/api/alerts?project_id=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        alerts = json.alerts || [];
        updateUnreadCount();
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
    pollInterval = setInterval(loadData, 1500);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });

  function getIcon(type: string) {
    if (type === 'error') return '<svg class="w-4 h-4 text-[#A32D2D] dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 8l0 4" /><path d="M12 16l.01 0" /></svg>';
    if (type === 'warning') return '<svg class="w-4 h-4 text-[#854F0B] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>';
    return '<svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>';
  }

  function formatAlertMessage(message: string) {
    let formatted = message.replace(/(Trace [a-zA-Z0-9_-]+) scored \d+\s*—\s*/, '$1 - ');
    formatted = formatted.replace(/(Trace [a-zA-Z0-9_-]+) scored \d+ \((.*?)\)\.?/, '$1 - $2');
    return formatted;
  }
</script>

<div class={`bg-bg-surface border border-border-default rounded-[16px] overflow-hidden w-full flex flex-col ${overviewLink ? 'h-full' : 'max-h-full'}`}>
  <div class="px-6 py-4 bg-bg-subtle border-b border-border-faint flex items-center justify-between">
    <div class="flex items-center">
      {#if overviewLink}
        <a href="/dashboard/alerts" class="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase flex items-center gap-1.5 hover:text-text-primary transition-colors group">
          <span class="flex items-center gap-1.5">
            SYSTEM ALERTS
          {#if unreadCount > 0 && !loading}
            <div class="px-1.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          {/if}
        </span>
          <svg class="w-3.5 h-3.5 text-text-faint group-hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
        </a>
      {:else}
        <div class="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">SYSTEM ALERTS</div>
      {/if}
    </div>
    
    <div class="relative group/tooltip flex items-center">
      <button on:click={manualReload} class="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-bg-elevated focus:outline-none" aria-label="Refresh alerts">
        <svg class={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
      </button>
      
      <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-default text-text-primary text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10">
        Refresh alerts
      </div>
    </div>
  </div>

  <div class="px-6 py-2 flex flex-col flex-1 divide-y divide-border-faint overflow-y-auto">
    {#if loading}
      <div class="py-12 text-center flex-1 flex items-center justify-center text-[13px] text-text-muted animate-pulse">Loading alerts...</div>
    {:else if alerts.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center">
        <div class="w-12 h-12 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        </div>
        <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No system alerts</h3>
        <p class="text-[13px] text-text-muted max-w-[400px] leading-relaxed text-center">Everything looks good! No quality drops or stale memory detected.</p>
      </div>
    {:else}
      {#each alerts as alert}
        <div class="py-2">
          <a href={overviewLink ? "/dashboard/alerts" : `/alerts/${alert.id}`} class="flex gap-[12px] py-3 px-3 -mx-3 hover:bg-bg-subtle/40 transition-colors rounded-md cursor-pointer group items-center">
            <div class="mt-[2px] flex-shrink-0">
              {@html getIcon(alert.type)}
            </div>
            <div class="flex flex-col gap-[2px] flex-1">
              <span class="text-[13px] text-text-primary leading-snug font-medium">{formatAlertMessage(alert.message)}</span>
              <span class="text-[12px] text-text-muted">{alert.sub}</span>
            </div>
            {#if !overviewLink}
              <div class="flex-shrink-0 pl-2">
                <svg class="w-4 h-4 text-text-faint group-hover:text-text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"></path></svg>
              </div>
            {/if}
          </a>
        </div>
      {/each}
    {/if}
  </div>
</div>
