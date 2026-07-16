<script lang="ts">
  import { onMount } from 'svelte';
  let show = false;
  let loading = false;
  let error = '';

  onMount(() => {
    const handleOpen = () => {
      show = true;
      error = '';
    };

    window.addEventListener('open-delete-modal', handleOpen);
    return () => {
      window.removeEventListener('open-delete-modal', handleOpen);
    };
  });

  function close() {
    show = false;
  }

  async function submit() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/apps', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }
      window.location.href = '/dashboard';
    } catch (err: any) {
      error = err.message;
      loading = false;
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-text-primary/5 backdrop-blur-[2px] transition-all duration-200" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="bg-bg-surface w-full max-w-[380px] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border-faint overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-7">
      
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </div>
        <h2 id="modal-title" class="text-[18px] font-semibold text-text-primary tracking-tight">Delete Workspace</h2>
      </div>

      <p class="text-[14px] text-text-secondary leading-relaxed mb-6">
        This action cannot be undone. All data, traces, and feedback will be permanently removed.
      </p>

      {#if error}
        <div class="mb-5 p-3 bg-red-50 text-red-600 rounded-[8px] text-[13px] font-medium flex items-start gap-2">
          <p>{error}</p>
        </div>
      {/if}

      <div class="flex items-center justify-end gap-2 mt-2">
        <button class="px-5 py-2 rounded-full text-[14px] font-medium text-text-secondary hover:bg-bg-subtle transition-colors" on:click={close} disabled={loading}>
          Cancel
        </button>
        <button class="px-5 py-2 rounded-full text-[14px] font-medium text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50" on:click={submit} disabled={loading}>
          {#if loading}
            <svg class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          {:else}
            Delete
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
