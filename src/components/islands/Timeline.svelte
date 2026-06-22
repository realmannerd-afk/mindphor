<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { spring } from 'svelte/motion';

  export let data: any;

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  function getFormattedDate(isoString: string) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="w-full bg-bg-surface border border-border-default rounded-[16px] p-6">
  <div class="relative pl-6 border-l-2 border-border-faint space-y-8 py-2">
    
    <!-- Timeline Item 1 -->
    <div class="relative">
      <div class="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-accent ring-4 ring-bg-surface"></div>
      <div class="flex flex-col">
        <span class="text-[13px] font-medium text-text-primary mb-1">{getFormattedDate(data.updated_at)}</span>
        <p class="text-[14px] text-text-secondary leading-relaxed bg-bg-subtle p-4 rounded-[12px] border border-border-faint mt-2">
          {data.value}
        </p>
      </div>
    </div>
    
    <!-- Timeline Start -->
    <div class="relative">
      <div class="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-border-strong ring-4 ring-bg-surface"></div>
      <div class="flex flex-col">
        <span class="text-[13px] font-medium text-text-muted mb-1">Earlier</span>
        <p class="text-[14px] text-text-muted italic mt-1">
          Monitoring initiated for {data.key}. Future competitive updates will appear here.
        </p>
      </div>
    </div>

  </div>
</div>
