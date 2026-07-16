<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  export let projectId: string = '';
  export let overviewLink: boolean = false;
  export let date: string = '';
  export let expanded: boolean = false;

  let alerts: any[] = [];
  let loading = true;
  let isRefreshing = false;
  let pollInterval: any;
  let unreadCount = 0;
  let checkedIds: string[] = [];
  let starredIds: string[] = [];

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

  async function loadData() {
    if (!projectId) {
      alerts = (window as any).mockAlerts || [];
      loading = false;
      return;
    }
    try {
      const url = `/api/alerts?app_id=${projectId}${date ? `&date=${date}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const rawAlerts = json.alerts || [];
        alerts = rawAlerts.map((a: any) => ({
          ...a,
          sub: a.sub || `${getRelativeTime(a.created_at || a.date)} • ${a.severity || a.type || 'System'}`,
          message: a.message || a.description || a.title || 'System alert triggered'
        }));
        updateUnreadCount();
      }
    } catch (e) {
      console.error(e);
      alerts = (window as any).mockAlerts || [];
    } finally {
      loading = false;
    }
  }

  async function handleRefresh() {
    isRefreshing = true;
    await new Promise(r => setTimeout(r, 600)); // simulate network fetch
    isRefreshing = false;
  }

  let isOptionsOpen = false;

  async function markAllAsRead() {
    isOptionsOpen = false;
    if (!projectId) return;
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: projectId, all: true })
      });
      alerts = alerts.map(a => ({ ...a, is_read: true }));
      unreadCount = 0;
    } catch (e) { console.error(e); }
  }

  async function deleteSelected() {
    isOptionsOpen = false;
    if (!projectId || checkedIds.length === 0) return;
    try {
      await fetch('/api/alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: checkedIds })
      });
      alerts = alerts.filter(a => !checkedIds.includes(a.id));
      checkedIds = [];
      updateUnreadCount();
    } catch (e) { console.error(e); }
  }

  function toggleStar(id: string, e: Event) {
    e.preventDefault();
    if (starredIds.includes(id)) {
      starredIds = starredIds.filter(i => i !== id);
    } else {
      starredIds = [...starredIds, id];
    }
  }

  function toggleAll(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      checkedIds = alerts.map(a => a.id);
    } else {
      checkedIds = [];
    }
  }

  function formatTimeOnly(subtext: string) {
    if (!subtext) return '';
    // Split by common bullet characters to extract just the time
    return subtext.split(/•|·|-/)[0].trim();
  }

  onMount(() => {
    loadData();
    pollInterval = setInterval(() => {
      if (Math.random() > 0.8 && alerts.length > 0) {
        alerts = [...alerts];
      }
    }, 5000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
  });

  function getIcon(type: string) {
    if (type === 'error') return '<svg class="w-4 h-4 text-[#A32D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 8l0 4" /><path d="M12 16l.01 0" /></svg>';
    if (type === 'warning') return '<svg class="w-4 h-4 text-[#854F0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>';
    return '<svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>';
  }

  function formatAlertMessage(message: string) {
    if (!message) return 'System Event';
    let formatted = message.replace(/(Trace [a-zA-Z0-9_-]+) scored \d+\s*—\s*/, '$1 - ');
    formatted = formatted.replace(/(Trace [a-zA-Z0-9_-]+) scored \d+ \((.*?)\)\.?/, '$1 - $2');
    formatted = formatted.replace(/Trace ([a-zA-Z0-9_-]+)/g, 'Feedback $1');
    formatted = formatted.replace(/quality score/g, 'rating');
    formatted = formatted.replace(/stale memory keys/g, 'competitor moves');
    return formatted;
  }
</script>

<div class="flex flex-col w-full h-full">
  {#if loading}
    <div class={`w-full h-full flex-1 flex flex-col items-center justify-center text-text-muted ${expanded ? 'min-h-[60vh]' : 'min-h-[200px]'}`}>
      <div class="w-8 h-8 border-[3px] border-border-default border-t-text-muted rounded-full animate-spin mb-4"></div>
      <span class="text-[13px] text-text-muted font-medium animate-pulse">Loading alerts...</span>
    </div>
  {:else if !expanded}
    {#if !overviewLink}
      <div class="flex flex-col gap-2">
        <!-- Widget View (Compact) -->
        {#each alerts.slice(0, 5) as alert}
          <a href={`/alerts/${alert.id}`} class="flex flex-col p-4 rounded-xl border border-border-faint hover:border-border-default bg-bg-surface transition-colors cursor-pointer group outline-none">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class={`w-2 h-2 rounded-full ${alert.type === 'error' ? 'bg-[#A32D2D]' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-accent'}`}></div>
                <span class="text-[12px] font-semibold text-text-primary capitalize">{alert.type}</span>
              </div>
              <span class="text-[11px] text-text-muted">{formatTimeOnly(alert.sub)}</span>
            </div>
            <span class="text-[14px] text-text-primary font-medium line-clamp-2 leading-snug">
              {formatAlertMessage(alert.message)}
            </span>
          </a>
        {/each}
        
        {#if alerts.length === 0}
          <div class="py-6 text-center">
            <p class="text-[13px] text-text-muted">No active alerts</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Widget View (Boxed Feed) -->
      <div class={`bg-bg-surface border border-border-default rounded-[16px] overflow-hidden w-full flex flex-col ${overviewLink ? 'h-full' : 'max-h-full'}`}>
        <div class="px-6 py-4 bg-bg-subtle border-b border-border-faint flex items-center justify-between">
          <div class="flex items-center">
            <a href="/dashboard/alerts" class="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase flex items-center gap-1.5 hover:text-text-primary transition-colors group">
              <span class="flex items-center gap-1.5">
                FEEDBACK ALERTS
              {#if unreadCount > 0 && !loading}
                <div class="px-1.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              {/if}
              </span>
              <svg class="w-3.5 h-3.5 text-text-faint group-hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
            </a>
          </div>
          
          <div class="relative group/tooltip flex items-center">
            <button on:click={manualReload} class="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-bg-elevated focus:outline-none" aria-label="Refresh alerts">
              <svg class={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
            </button>
            <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-bg-elevated border border-border-default text-text-primary text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm z-10">
              Refresh alerts
            </div>
          </div>
        </div>

        <div class="px-6 py-4 flex flex-col flex-1 gap-2 overflow-y-auto custom-scrollbar">
          {#if alerts.length === 0}
            <div class="flex-1 flex flex-col items-center justify-center">
              <div class="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              </div>
              <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No alerts</h3>
              <p class="text-[13px] text-text-muted max-w-[400px] leading-relaxed text-center">Everything looks good! No critical reviews or competitor shifts detected.</p>
            </div>
          {:else}
            {#each alerts as alert}
              {@const msgFormatted = formatAlertMessage(alert.message)}
              {@const msgParts = msgFormatted.split(':')}
              {@const subject = msgParts.length > 1 ? msgParts[0].trim() : msgFormatted}
              {@const snippetBody = msgParts.length > 1 ? msgParts.slice(1).join(':').trim() : ''}
              
              {@const subParts = (alert.sub || '').split('•')}
              {@const snippetMeta = subParts.length > 1 ? subParts.slice(1).join(' • ').trim() : ''}
              {@const finalSnippet = snippetBody && snippetMeta ? `${snippetBody} — ${snippetMeta}` : snippetBody || snippetMeta}

              <a href={overviewLink ? "/dashboard/alerts" : `/alerts/${alert.id}`} class="flex flex-col gap-[4px] py-3 px-3 -mx-3 hover:bg-bg-subtle/60 transition-colors rounded-[8px] cursor-pointer group">
                <div class="flex items-center gap-2.5 w-full">
                  <span class={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                    alert.type === 'error' ? 'bg-[#A32D2D]/10 text-[#A32D2D]' : 
                    alert.type === 'warning' ? 'bg-amber-500/10 text-amber-600' : 
                    'bg-blue-500/10 text-blue-600'
                  }`}>
                    {alert.type === 'error' ? 'CRITICAL' : alert.type === 'warning' ? 'WARNING' : 'INFO'}
                  </span>
                  <span class="text-[13px] text-text-primary font-semibold truncate leading-snug">{subject}</span>
                  <span class="text-[12px] font-medium text-text-muted ml-auto flex-shrink-0 group-hover:text-text-primary transition-colors">{formatTimeOnly(alert.sub || '')}</span>
                </div>
                {#if finalSnippet}
                  <div class="text-[13px] text-text-secondary truncate leading-relaxed">
                    {finalSnippet}
                  </div>
                {/if}
              </a>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  {:else}
    {#if alerts.length === 0}
      <div class="flex flex-col items-center justify-center py-20 px-4 bg-bg-surface rounded-2xl border border-border-faint border-dashed">
        <div class="w-16 h-16 rounded-full bg-bg-subtle flex items-center justify-center mb-4 text-text-muted">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h3 class="text-[16px] font-medium text-text-primary mb-2">Inbox Zero</h3>
        <p class="text-[13px] text-text-muted max-w-[400px] leading-relaxed text-center">Everything looks good! No critical reviews or competitor shifts detected.</p>
      </div>
    {:else}
      <div class="flex items-center justify-between w-full mb-3 px-1">
        <div class="text-[13px] font-medium text-text-muted">
          {#if checkedIds.length > 0}
            {checkedIds.length} alert{checkedIds.length === 1 ? '' : 's'} selected
          {/if}
        </div>
        
        <div class="relative">
          <button 
            class={`flex items-center h-8 px-3 gap-1.5 rounded-full border transition-all focus-within:ring-2 focus-within:ring-border-strong/50 focus:outline-none ${
              isOptionsOpen
              ? 'bg-bg-elevated/70 border-border-default text-text-primary' 
              : 'bg-transparent border-border-default hover:bg-bg-elevated/70 text-text-secondary hover:text-text-primary'
            }`}
            aria-label="More options" 
            on:click={() => isOptionsOpen = !isOptionsOpen}
          >
            <span class="text-[13px] font-medium">Options</span>
            <svg class={`w-3.5 h-3.5 transition-transform ${isOptionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {#if isOptionsOpen}
            <div class="fixed inset-0 z-40" aria-label="Close dropdown" role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (isOptionsOpen = false)} on:click={() => isOptionsOpen = false}></div>
            <div class="absolute right-0 top-full mt-2 w-48 bg-bg-surface border border-border-default rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-1.5 z-50 overflow-hidden flex flex-col font-normal normal-case tracking-normal text-[13px]">
              <button class="w-full text-left px-4 py-2 text-text-primary hover:bg-bg-subtle transition-colors focus:outline-none" on:click={markAllAsRead}>Mark all as read</button>
              <button class={`w-full text-left px-4 py-2 transition-colors focus:outline-none ${checkedIds.length > 0 ? 'text-text-primary hover:bg-bg-subtle' : 'text-text-muted opacity-50 cursor-not-allowed'}`} disabled={checkedIds.length === 0} on:click={deleteSelected}>Delete selected ({checkedIds.length})</button>
              <div class="h-px w-full bg-border-faint my-1"></div>
              <a href="/dashboard/settings" class="w-full text-left px-4 py-2 text-text-primary hover:bg-bg-subtle transition-colors focus:outline-none block" on:click={() => isOptionsOpen = false}>Alert settings</a>
            </div>
          {/if}
        </div>
      </div>
      
      <div class="flex flex-col w-full bg-bg-surface border border-border-default rounded-[12px] overflow-hidden">
        <!-- Table Header -->
        <div class="grid grid-cols-[16px_24px_100px_1fr_120px] gap-4 items-center px-4 py-3 border-b border-border-default bg-bg-subtle/30 text-[11px] font-semibold tracking-[0.05em] uppercase text-text-muted">
          <!-- Checkbox Col -->
          <div class="flex items-center justify-center">
            <input type="checkbox" on:change={toggleAll} checked={alerts.length > 0 && checkedIds.length === alerts.length} class="w-[14px] h-[14px] rounded border-border-strong text-accent focus:ring-accent cursor-pointer bg-transparent" />
          </div>
          
          <!-- Refresh/Action Col -->
          <div class="flex items-center justify-center relative">
            <button class="text-text-muted hover:text-text-primary transition-colors focus:outline-none flex items-center justify-center" aria-label="Refresh alerts" on:click={handleRefresh}>
              <svg class="w-[16px] h-[16px] {isRefreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
            </button>
          </div>
          
          <!-- Type Col -->
          <div class="pl-2">Type</div>
          
          <!-- Subject Col -->
          <div class="flex items-center">
            <span>Subject</span>
          </div>
          
          <!-- Date Col -->
          <div class="text-right">Date</div>
        </div>
        
        <div class="flex flex-col w-full bg-bg-surface">
          {#each alerts as alert}
            {@const msgFormatted = formatAlertMessage(alert.message)}
            {@const msgParts = msgFormatted.split(':')}
            {@const subject = msgParts.length > 1 ? msgParts[0].trim() : msgFormatted}
            {@const snippetBody = msgParts.length > 1 ? msgParts.slice(1).join(':').trim() : ''}
            {@const subParts = alert.sub ? alert.sub.split(/•|·|-/) : []}
            {@const snippetMeta = subParts.length > 1 ? subParts.slice(1).join(' • ').trim() : ''}
            {@const finalSnippet = snippetBody && snippetMeta ? `${snippetBody} — ${snippetMeta}` : snippetBody || snippetMeta}

            <div class={`grid grid-cols-[16px_24px_100px_1fr_120px] gap-4 items-center px-4 py-3 border-b border-border-faint hover:bg-bg-subtle transition-colors group relative ${checkedIds.includes(alert.id) ? 'bg-bg-subtle/50' : 'bg-transparent'}`}>
              <!-- Checkbox -->
              <div class="flex items-center justify-center z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                <input type="checkbox" bind:group={checkedIds} value={alert.id} class="w-[14px] h-[14px] rounded border-border-strong text-accent focus:ring-accent cursor-pointer bg-transparent" />
              </div>
              
              <!-- Star icon -->
              <div class="flex items-center justify-center z-10">
                <button type="button" aria-label="Toggle star" class={`cursor-pointer transition-opacity focus:outline-none flex items-center justify-center ${starredIds.includes(alert.id) ? 'text-amber-500 opacity-100' : 'text-text-faint hover:text-amber-500 opacity-60 group-hover:opacity-100'}`} on:click={(e) => toggleStar(alert.id, e)}>
                  <svg class="w-[18px] h-[18px]" fill={starredIds.includes(alert.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </button>
              </div>

              <!-- Sender/Type (Notion-style Pill) -->
              <div class="flex items-center">
                <span class={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-all ${
                  alert.type === 'error' ? 'bg-[#A32D2D]/10 text-[#A32D2D]' : 
                  alert.type === 'warning' ? 'bg-amber-500/10 text-amber-600' : 
                  'bg-blue-500/10 text-blue-600'
                } ${checkedIds.includes(alert.id) ? 'line-through decoration-1 opacity-50' : ''}`}>
                  {alert.type === 'error' ? 'CRITICAL' : alert.type === 'warning' ? 'WARNING' : 'INFO'}
                </span>
              </div>
              
              <!-- Subject & Snippet -->
              <div class="flex min-w-0 items-baseline gap-2 truncate">
                <a href={`/alerts/${alert.id}`} class={`text-[14px] font-semibold flex-shrink-0 hover:underline outline-none transition-all duration-300 ${checkedIds.includes(alert.id) ? 'line-through decoration-1 text-text-muted' : 'text-text-primary'}`}>
                  {subject}
                </a>
                {#if finalSnippet}
                  <a href={`/alerts/${alert.id}`} class={`text-[13px] font-normal truncate hidden sm:inline-block hover:underline outline-none transition-all duration-300 ${checkedIds.includes(alert.id) ? 'line-through decoration-1 text-text-muted/50' : 'text-text-muted'}`}>
                    - {finalSnippet}
                  </a>
                {/if}
              </div>
              
              <!-- Date/Time (Sub) -->
              <div class="text-right truncate flex items-center justify-end">
                <span class={`text-[13px] font-medium whitespace-nowrap transition-colors ${checkedIds.includes(alert.id) ? 'line-through decoration-1 text-text-muted/50' : 'text-text-muted group-hover:text-text-primary'}`}>
                  {formatTimeOnly(alert.sub)}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>


