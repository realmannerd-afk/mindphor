<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import { animate, stagger } from 'motion';
  import { 
    IconMessageCircle, 
    IconActivity, 
    IconBulb, 
    IconAlertTriangle, 
    IconBuildingStore, 
    IconHeartRateMonitor 
  } from '@tabler/icons-svelte';

  const kpis = [
    { label: 'Total Feedback', value: '12.4k', change: '+14%', trend: 'up', data: [10, 15, 13, 20, 22, 18, 25], icon: IconMessageCircle, color: '#3b82f6' },
    { label: 'Active Sources', value: '8', change: '0%', trend: 'neutral', data: [8, 8, 8, 8, 8, 8, 8], icon: IconActivity, color: '#8b5cf6' },
    { label: 'Feature Requests', value: '842', change: '+24%', trend: 'up', data: [5, 12, 18, 24, 30, 28, 42], icon: IconBulb, color: '#10b981' },
    { label: 'Issues Detected', value: '24', change: '-12%', trend: 'down', data: [15, 12, 18, 10, 8, 5, 2], icon: IconAlertTriangle, color: '#ef4444' },
    { label: 'Competitor Mentions', value: '312', change: '+5%', trend: 'up', data: [8, 10, 15, 12, 14, 18, 20], icon: IconBuildingStore, color: '#f59e0b' },
    { label: 'Sentiment Health', value: '92%', change: '+2%', trend: 'up', data: [80, 82, 85, 84, 88, 90, 92], icon: IconHeartRateMonitor, color: '#0f766e' },
  ];

  let chartContainers = [];

  onMount(() => {
    // Mount Echarts sparklines
    kpis.forEach((kpi, idx) => {
      const el = chartContainers[idx];
      if (el) {
        const ctx = el.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 40);
        gradient.addColorStop(0, kpi.color + '40');
        gradient.addColorStop(1, kpi.color + '00');

        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['1', '2', '3', '4', '5', '6', '7'],
            datasets: [{
              data: kpi.data,
              borderColor: kpi.color,
              borderWidth: 2,
              backgroundColor: gradient,
              fill: true,
              pointRadius: 0,
              tension: 0.4
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
              x: { display: false },
              y: { display: false, min: Math.min(...kpi.data) * 0.9 }
            },
            layout: { padding: 0 }
          }
        });
        el.__chart = chart;
      }
    });

    // Animate Cards
    animate(
      '.kpi-card',
      { opacity: [0, 1], y: [10, 0] },
      { duration: 0.3, delay: stagger(0.05), easing: 'ease-out' }
    );
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {#each kpis as kpi, idx}
    <div class="kpi-card bg-bg-surface border border-border-default rounded-xl p-5 opacity-0 flex flex-col justify-between">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <svelte:component this={kpi.icon} size={16} stroke={2} class="text-text-secondary" />
          <h3 class="text-[13px] font-medium text-text-secondary">{kpi.label}</h3>
        </div>
        <span class={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${kpi.trend === 'up' ? 'text-green-500 bg-green-500/10' : kpi.trend === 'down' ? 'text-red-500 bg-red-500/10' : 'text-text-secondary bg-bg-subtle'}`}>
          {kpi.change}
        </span>
      </div>
      <div class="flex items-end justify-between">
        <div class="text-2xl font-bold text-text-primary tracking-tight">{kpi.value}</div>
        <div class="w-24 h-10 relative">
          <canvas bind:this={chartContainers[idx]}></canvas>
        </div>
      </div>
    </div>
  {/each}
</div>
