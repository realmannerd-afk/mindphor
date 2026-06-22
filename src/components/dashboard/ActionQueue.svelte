<script>
  import { onMount } from 'svelte';
  import { animate, stagger } from 'motion';
  import { IconArrowRight, IconTarget, IconFlame, IconInfoCircle } from '@tabler/icons-svelte';

  const actions = [
    { priority: 'High', action: 'Improve onboarding', impact: 'Very High', effort: 'Medium', confidence: '95%', icon: IconFlame, colorClass: 'text-red-500 bg-red-500/10' },
    { priority: 'Medium', action: 'Build Dark Mode', impact: 'High', effort: 'Low', confidence: '91%', icon: IconTarget, colorClass: 'text-orange-500 bg-orange-500/10' },
    { priority: 'Low', action: 'Add Slack Integration', impact: 'Medium', effort: 'High', confidence: '82%', icon: IconInfoCircle, colorClass: 'text-blue-500 bg-blue-500/10' }
  ];

  onMount(() => {
    animate(
      '.action-item',
      { opacity: [0, 1], y: [10, 0] },
      { duration: 0.3, delay: stagger(0.1), easing: 'ease-out' }
    );
  });
</script>

<div class="bg-bg-surface border border-border-default rounded-xl p-6 mb-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-base font-semibold text-text-primary tracking-tight">Recommended Actions</h2>
    <span class="text-xs font-medium text-text-secondary bg-bg-subtle px-2 py-1 rounded-md">Priority Queue</span>
  </div>

  <div class="space-y-3">
    {#each actions as action}
      <div class="action-item opacity-0 p-4 rounded-lg border border-border-default hover:border-border-strong bg-bg-base flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors cursor-pointer group">
        <div class="flex items-center gap-3">
          <div class={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${action.colorClass}`}>
            <svelte:component this={action.icon} size={18} stroke={2} />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class={`text-[10px] font-bold uppercase tracking-wide ${action.priority === 'High' ? 'text-red-500' : action.priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'}`}>{action.priority}</span>
            </div>
            <h3 class="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{action.action}</h3>
          </div>
        </div>
        
        <div class="flex items-center gap-6 text-[11px] w-full md:w-auto">
          <div>
            <p class="text-text-muted mb-0.5 text-[10px] uppercase">Impact</p>
            <p class="font-medium text-text-primary">{action.impact}</p>
          </div>
          <div>
            <p class="text-text-muted mb-0.5 text-[10px] uppercase">Effort</p>
            <p class="font-medium text-text-primary">{action.effort}</p>
          </div>
          <div>
            <p class="text-text-muted mb-0.5 text-[10px] uppercase">Confidence</p>
            <p class="font-medium text-text-primary">{action.confidence}</p>
          </div>
          <div class="hidden md:flex ml-2 w-8 h-8 rounded-full border border-border-default items-center justify-center group-hover:bg-bg-subtle transition-colors">
            <IconArrowRight size={16} stroke={1.5} class="text-text-secondary" />
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
