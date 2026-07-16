<script lang="ts">
  import Logo from './Logo.svelte';
  export let value: string = "";
  export let appId: string = "";
  let editing = false;
  let inputValue = value;
  let saving = false;
  let saved = false;
  let error = false;

  $: domains = value.split(',').map(d => d.trim()).filter(Boolean);

  async function save() {
    saving = true;
    error = false;
    const newDomains = inputValue.split(',').map(d => d.trim()).filter(Boolean);

    try {
      // Delete all existing competitors for this app and re-add
      // First, get existing competitors
      const getRes = await fetch(`/api/competitors?app_id=${appId}`);
      if (getRes.ok) {
        const data = await getRes.json();
        const existing = data.competitors || [];

        // Delete ones not in the new list
        for (const comp of existing) {
          if (!newDomains.includes(comp.domain)) {
            await fetch(`/api/competitors?id=${comp.id}`, { method: 'DELETE' });
          }
        }

        // Add new ones
        const existingDomains = existing.map((c: any) => c.domain);
        for (const domain of newDomains) {
          if (!existingDomains.includes(domain)) {
            await fetch('/api/competitors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ app_id: appId, domain })
            });
          }
        }
      }

      value = newDomains.join(', ');
      editing = false;
      saved = true;
      setTimeout(() => saved = false, 2000);
    } catch (err) {
      console.error('Failed to save competitors', err);
      error = true;
      setTimeout(() => error = false, 3000);
    } finally {
      saving = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') {
      editing = false;
      inputValue = value;
    }
  }
</script>

<div class="flex items-center gap-2">
  {#if editing}
    <input 
      type="text" 
      bind:value={inputValue} 
      on:keydown={handleKeydown}
      class="w-[260px] bg-bg-subtle border border-border-default rounded-[6px] px-3 py-1.5 text-[13px] text-text-primary focus:outline-none focus:border-border-strong shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]" 
      autofocus
    />
    
    <button on:click={save} class="px-3 py-1.5 bg-text-primary text-bg-base text-[12px] font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50" disabled={saving}>
      {saving ? 'Saving...' : 'Save'}
    </button>
    <button on:click={() => { editing = false; inputValue = value; }} class="px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors">
      Cancel
    </button>
  {:else}
    <div class="w-[260px] flex flex-wrap gap-1.5 py-1">
      {#each domains as domain}
        <div class="flex items-center gap-1.5 px-2 py-0.5 bg-bg-subtle border border-border-strong rounded-full">
          <Logo {domain} className="w-3.5 h-3.5 object-contain" />
          <span class="text-[12px] font-medium text-text-primary">{domain}</span>
        </div>
      {/each}
      {#if domains.length === 0}
        <span class="text-[13px] text-text-muted italic py-1">No competitors configured</span>
      {/if}
    </div>
    
    <button on:click={() => { editing = true; inputValue = value; }} class="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" /><path d="M16 5l3 3" /></svg>
    </button>
  {/if}

  {#if saved && !editing}
    <span class="text-green-500 text-[12px] font-medium ml-2">Saved!</span>
  {/if}
  {#if error}
    <span class="text-red-500 text-[12px] font-medium ml-2">Error saving</span>
  {/if}
</div>
