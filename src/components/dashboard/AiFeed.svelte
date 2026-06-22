<script>
  import { onMount } from 'svelte';
  import { animate, stagger } from 'motion';
  import { IconRocket, IconAlertOctagon, IconTrophy } from '@tabler/icons-svelte';

  const insights = [
    {
      id: 1,
      type: 'positive',
      icon: IconRocket,
      colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      title: 'AI Search requests increased 143%',
      evidence: '482 mentions',
      confidence: 'Confidence: 94%',
      action: 'Move to roadmap review.'
    },
    {
      id: 2,
      type: 'negative',
      icon: IconAlertOctagon,
      colorClass: 'text-red-500 bg-red-500/10 border-red-500/20',
      title: 'Onboarding complaints increased 216%',
      evidence: '612 mentions',
      confidence: 'Confidence: 96%',
      action: 'Investigate onboarding funnel.'
    },
    {
      id: 3,
      type: 'threat',
      icon: IconTrophy,
      colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      title: 'Linear mentioned 57% more often',
      evidence: '214 mentions',
      confidence: 'Threat Level: High',
      action: 'Review feature gaps.'
    }
  ];

  onMount(() => {
    animate(
      '.insight-item',
      { opacity: [0, 1], x: [-10, 0] },
      { duration: 0.3, delay: stagger(0.1), easing: 'ease-out' }
    );
  });
</script>

<div class="bg-bg-surface border border-border-default rounded-xl p-6">
  <div class="flex items-center gap-2 mb-6">
    <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
    <h2 class="text-base font-semibold text-text-primary tracking-tight">AI Intelligence Feed</h2>
  </div>

  <div class="space-y-4">
    {#each insights as insight}
      <div class="insight-item opacity-0 p-4 rounded-lg border border-border-default bg-bg-base flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div class="flex items-start gap-4">
          <div class={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${insight.colorClass}`}>
            <svelte:component this={insight.icon} size={20} stroke={1.5} />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-text-primary mb-1">{insight.title}</h3>
            <div class="flex items-center gap-4 text-[11px] text-text-secondary">
              <span class="flex items-center gap-1.5">
                <span class="w-1 h-1 rounded-full bg-text-muted"></span>
                Evidence: <span class="font-medium text-text-primary">{insight.evidence}</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-1 h-1 rounded-full bg-text-muted"></span>
                <span class="font-medium text-text-primary">{insight.confidence}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="bg-bg-subtle px-3 py-2 rounded-md border border-border-faint text-xs w-full lg:w-auto">
          <span class="text-text-secondary">Recommended:</span> 
          <span class="font-medium text-text-primary ml-1">{insight.action}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
