<script>
  import { onMount } from 'svelte';
  import { animate, stagger } from 'motion';

  const activities = [
    { type: 'Feature Request', source: 'Reddit', sourceColor: '#ff4500', summary: 'Users requesting AI Search', confidence: '94%', status: 'New', statusColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20', created: '2h ago' },
    { type: 'Issue', source: 'Google Play', sourceColor: '#3bccff', summary: 'Login failures reported', confidence: '97%', status: 'Investigating', statusColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20', created: '4h ago' },
    { type: 'Competitor', source: 'Twitter', sourceColor: '#1da1f2', summary: 'Linear mentioned frequently', confidence: '91%', status: 'Monitoring', statusColor: 'text-text-secondary bg-bg-subtle border-border-default', created: '5h ago' }
  ];

  onMount(() => {
    animate(
      '.activity-row',
      { opacity: [0, 1] },
      { duration: 0.3, delay: stagger(0.1), easing: 'ease-out' }
    );
  });
</script>

<div class="bg-bg-surface border border-border-default rounded-xl overflow-hidden flex flex-col mb-6">
  <div class="px-5 py-4 border-b border-border-default flex items-center justify-between">
    <h2 class="text-base font-semibold text-text-primary tracking-tight">Recent Activity</h2>
    <button class="text-xs font-medium text-accent hover:text-accent-hover transition-colors">View All</button>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse whitespace-nowrap">
      <thead>
        <tr class="bg-bg-subtle select-none">
          <th class="px-5 py-3 text-[11px] font-medium text-text-secondary border-b border-border-default">Type</th>
          <th class="px-5 py-3 text-[11px] font-medium text-text-secondary border-b border-border-default">Source</th>
          <th class="px-5 py-3 text-[11px] font-medium text-text-secondary border-b border-border-default">Summary</th>
          <th class="px-5 py-3 text-[11px] font-medium text-text-secondary border-b border-border-default">Confidence</th>
          <th class="px-5 py-3 text-[11px] font-medium text-text-secondary border-b border-border-default">Status</th>
          <th class="px-5 py-3 text-[11px] font-medium text-text-secondary border-b border-border-default">Created</th>
        </tr>
      </thead>
      <tbody class="text-[12px]">
        {#each activities as act, index}
          <tr class="activity-row opacity-0 hover:bg-bg-subtle/30 transition-colors bg-bg-surface group">
            <td class={`px-5 py-3 align-middle text-text-primary font-medium border-b ${index === activities.length - 1 ? 'border-transparent' : 'border-border-faint'}`}>
              {act.type}
            </td>
            <td class={`px-5 py-3 align-middle font-medium border-b ${index === activities.length - 1 ? 'border-transparent' : 'border-border-faint'}`} style={`color: ${act.sourceColor}`}>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full" style={`background-color: ${act.sourceColor}`}></span>
                {act.source}
              </div>
            </td>
            <td class={`px-5 py-3 align-middle text-text-secondary border-b ${index === activities.length - 1 ? 'border-transparent' : 'border-border-faint'} max-w-[250px] truncate`}>
              {act.summary}
            </td>
            <td class={`px-5 py-3 align-middle text-text-secondary font-mono text-[11px] border-b ${index === activities.length - 1 ? 'border-transparent' : 'border-border-faint'}`}>
              {act.confidence}
            </td>
            <td class={`px-5 py-3 align-middle border-b ${index === activities.length - 1 ? 'border-transparent' : 'border-border-faint'}`}>
              <span class={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${act.statusColor}`}>
                {act.status}
              </span>
            </td>
            <td class={`px-5 py-3 align-middle text-text-muted text-[11px] border-b ${index === activities.length - 1 ? 'border-transparent' : 'border-border-faint'}`}>
              {act.created}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
