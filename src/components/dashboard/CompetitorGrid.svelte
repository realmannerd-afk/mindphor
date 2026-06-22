<script>
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import { animate, stagger } from 'motion';
  import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-svelte';

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
        const chart = echarts.init(el);
        const dataVals = [
          comp.threat,
          Math.floor(Math.random() * 40 + 60),
          Math.floor(Math.random() * 40 + 60),
          Math.floor(Math.random() * 40 + 60),
          Math.floor(Math.random() * 40 + 60)
        ];
        
        chart.setOption({
          radar: {
            indicator: [
              { name: 'Threat', max: 100 },
              { name: 'Mentions', max: 100 },
              { name: 'Sentiment', max: 100 },
              { name: 'Growth', max: 100 },
              { name: 'Gaps', max: 100 }
            ],
            radius: '65%',
            axisName: { color: 'var(--color-text-muted)', fontSize: 9 },
            splitArea: { show: false },
            splitLine: { lineStyle: { color: 'var(--color-border-faint)' } },
            axisLine: { lineStyle: { color: 'var(--color-border-faint)' } }
          },
          series: [{
            type: 'radar',
            data: [{
              value: dataVals,
              name: comp.name,
              itemStyle: { color: comp.color },
              areaStyle: { color: comp.color, opacity: 0.2 },
              lineStyle: { width: 1.5 }
            }],
            symbol: 'none'
          }],
          tooltip: { show: false }
        });
        const resizeObserver = new ResizeObserver(() => chart.resize());
        resizeObserver.observe(el);
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
          <img src={`https://img.logo.dev/${comp.domain}?token=pk_q0D6rLqTRt6wF3L-kYjIqg`} alt={comp.name} class="w-8 h-8 rounded-md bg-white border border-border-faint p-0.5 object-contain" onerror={(e) => e.currentTarget.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjODg4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4='}/>
          <div class={`flex items-center justify-center w-6 h-6 rounded-full ${comp.trend === 'up' ? 'bg-red-500/10 text-red-500' : comp.trend === 'down' ? 'bg-green-500/10 text-green-500' : 'bg-bg-subtle text-text-secondary'}`}>
            <svelte:component this={comp.trend === 'up' ? IconTrendingUp : comp.trend === 'down' ? IconTrendingDown : IconMinus} size={14} stroke={2.5} />
          </div>
        </div>
        <h3 class="text-sm font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">{comp.name}</h3>
        <p class="text-[11px] text-text-muted mb-4">{comp.mentions} mentions • {comp.sentiment}</p>
        
        <div class="w-full h-32 mb-4" bind:this={radarContainers[idx]}></div>

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
