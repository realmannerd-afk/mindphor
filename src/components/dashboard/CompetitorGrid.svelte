<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import { animate, stagger } from 'motion';
  import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-svelte';
  import Logo from '../islands/Logo.svelte';

  const competitors = [
    { name: 'Linear', domain: 'linear.app', mentions: '2.4k', sentiment: 'Positive', trend: 'up', threat: 92, gaps: 14, color: '#5e6ad2' },
    { name: 'Notion', domain: 'notion.so', mentions: '1.8k', sentiment: 'Neutral', trend: 'neutral', threat: 85, gaps: 8, color: '#000000' },
    { name: 'Jira', domain: 'atlassian.com', mentions: '4.2k', sentiment: 'Negative', trend: 'down', threat: 64, gaps: 32, color: '#0052CC' },
    { name: 'ClickUp', domain: 'clickup.com', mentions: '1.1k', sentiment: 'Neutral', trend: 'up', threat: 78, gaps: 12, color: '#7B68EE' },
    { name: 'Productboard', domain: 'productboard.com', mentions: '850', sentiment: 'Positive', trend: 'neutral', threat: 88, gaps: 6, color: '#00b050' }
  ];

  let radarContainers = [];

  onMount(() => {
    competitors.forEach((comp, idx) => {
      const el = radarContainers[idx];
      if (el) {
        const dataVals = [
          comp.threat,
          Math.floor(Math.random() * 40 + 60),
          Math.floor(Math.random() * 40 + 60),
          Math.floor(Math.random() * 40 + 60),
          Math.floor(Math.random() * 40 + 60)
        ];
        const chart = new Chart(el.getContext('2d'), {
          type: 'radar',
          data: {
            labels: ['Threat', 'Mentions', 'Sentiment', 'Growth', 'Gaps'],
            datasets: [{
              label: comp.name,
              data: dataVals,
              backgroundColor: comp.color + '33',
              borderColor: comp.color,
              pointBackgroundColor: comp.color,
              borderWidth: 1.5,
              pointRadius: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
            },
            scales: {
              r: {
                min: 0,
                max: 100,
                ticks: { display: false },
                pointLabels: { color: 'var(--color-text-muted)', font: { size: 9 } },
                grid: { color: 'var(--color-border-faint)' },
                angleLines: { color: 'var(--color-border-faint)' }
              }
            }
          }
        });
        // Save instance to destroy later if needed
        el.__chart = chart;
      }
    });

    animate(
      '.competitor-card',
      { opacity: [0, 1], scale: [0.95, 1] },
      { duration: 0.4, delay: stagger(0.1), easing: 'ease-out' }
    );
  });
</script>

<div class="mb-6">
  <div class="flex items-center gap-2 mb-6">
    <h2 class="text-base font-semibold text-text-primary tracking-tight">Competitor Intelligence</h2>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
    {#each competitors as comp, idx}
      <div class="competitor-card opacity-0 bg-bg-surface border border-border-default rounded-xl p-5 flex flex-col hover:border-border-strong transition-colors cursor-pointer group">
        <div class="flex justify-between items-start mb-4">
          <Logo domain={comp.domain} alt={comp.name} className="w-8 h-8 rounded-md bg-white border border-border-faint p-0.5 object-contain" />
          <div class={`flex items-center justify-center w-6 h-6 rounded-full ${comp.trend === 'up' ? 'bg-red-500/10 text-red-500' : comp.trend === 'down' ? 'bg-green-500/10 text-green-500' : 'bg-bg-subtle text-text-secondary'}`}>
            <svelte:component this={comp.trend === 'up' ? IconTrendingUp : comp.trend === 'down' ? IconTrendingDown : IconMinus} size={14} stroke={2.5} />
          </div>
        </div>
        <h3 class="text-sm font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">{comp.name}</h3>
        <p class="text-[11px] text-text-muted mb-4">{comp.mentions} mentions • {comp.sentiment}</p>
        
        <div class="w-full h-32 mb-4 relative">
          <canvas bind:this={radarContainers[idx]}></canvas>
        </div>

        <div class="grid grid-cols-2 gap-2 mt-auto border-t border-border-faint pt-4">
          <div>
            <p class="text-[10px] text-text-muted font-medium mb-0.5 uppercase tracking-wider">Threat Score</p>
            <p class={`text-sm font-bold ${comp.threat >= 80 ? 'text-red-500' : comp.threat >= 60 ? 'text-orange-500' : 'text-green-500'}`}>{comp.threat}</p>
          </div>
          <div>
            <p class="text-[10px] text-text-muted font-medium mb-0.5 uppercase tracking-wider">Feature Gaps</p>
            <p class="text-sm font-bold text-text-primary">{comp.gaps}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
