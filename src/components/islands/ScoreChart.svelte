<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import Logo from './Logo.svelte';

  export let projectId: string;
  export let date: string = '';

  let lineCanvas: HTMLCanvasElement;
  let lineChart: Chart;
  let categoryData: { category: string, score: number }[] = [
    { category: 'Google Play', score: 0 },
    { category: 'App Store', score: 0 },
    { category: 'Reddit', score: 0 },
    { category: 'Twitter', score: 0 }
  ];
  let pollInterval: any;

  async function loadData() {
    if (!projectId) return;
    try {
      const url = `/api/dashboard?app_id=${projectId}${date ? `&date=${date}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.score_by_day && lineChart) {
        lineChart.data.labels = json.score_by_day.map((d: any) => d.day);
        lineChart.data.datasets[0].data = json.score_by_day.map((d: any) => d.score);
        lineChart.update('none');
      }
      if (json.score_by_category) {
        categoryData = json.score_by_category;
      }
    } catch (e) {
      console.error(e);
    }
  }

  onMount(() => {
    // Note: Due to dark mode toggling, real implementations often need to observe 
    // the .dark class and update chart colors, but for this demo we'll use CSS vars 
    // Use #FFFAFA for tooltips consistently across both light and dark modes
    const rootStyle = getComputedStyle(document.documentElement);
    const tooltipBg = '#FFFAFA';
    const tooltipText = '#2D2C2A'; 
    const tooltipBorder = '#E6E4DF';
    const txtSecondary = rootStyle.getPropertyValue('--text-secondary').trim() || '#AAA9A5';

    // Accent for the chart lines
    const accent = '#6366F1';
    const accentSubtle = 'rgba(99, 102, 241, 0.1)';

    // LINE CHART
    const lineCtx = lineCanvas.getContext('2d');
    if (lineCtx) {
      const lineGradient = lineCtx.createLinearGradient(0, 0, 0, 220);
      lineGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      lineGradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Avg Rating',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: accent,
            backgroundColor: lineGradient,
            borderWidth: 3,
            tension: 0.45,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: accent,
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { 
            legend: { display: false }, 
            tooltip: { 
              enabled: true,
              backgroundColor: tooltipBg,
              titleColor: tooltipText,
              bodyColor: tooltipText,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: { x: 10, y: 8 },
              cornerRadius: 6,
              displayColors: false,
              titleFont: { size: 11, family: 'Geist', weight: 500 },
              bodyFont: { size: 11, family: 'Geist', weight: 500 },
              callbacks: {
                label: function(context) {
                  return `Avg Rating: ${context.parsed.y}%`;
                }
              }
            } 
          },
          scales: {
            y: {
              min: 0, max: 100,
              grid: { display: false },
              ticks: { display: false },
              border: { display: false }
            },
            x: {
              grid: { display: false },
              ticks: { color: txtSecondary, font: { size: 12, family: 'Geist' } },
              border: { display: false }
            }
          }
        }
      });
    }

    // BAR CHART LOGIC REMOVED - using HTML template instead

    loadData();
    pollInterval = setInterval(loadData, 5000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (lineChart) lineChart.destroy();
    };
  });
</script>

<div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-faint mb-10">
  <!-- Left Chart (60%) -->
  <div class="w-full lg:w-[60%] p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-[16px]">Rating & Sentiment Trend</div>
    <div class="relative w-full h-[220px]">
      <canvas bind:this={lineCanvas}></canvas>
    </div>
  </div>

  <!-- Right Chart (40%) -->
  <div class="w-full lg:w-[40%] p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-[16px]">Reviews by Platform</div>
    <div class="relative w-full h-[220px] flex flex-col justify-around py-2">
      {#each categoryData as item}
        <div class="flex items-center w-full gap-4 group">
          <Logo domain={item.category.replace(' ', '_').toLowerCase()} alt={item.category} className="w-[20px] h-[20px] object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
          <div class="flex-1 flex flex-col justify-center">
            <div class="flex justify-between items-end mb-1.5">
              <span class="text-[12px] font-medium text-text-primary">{item.category}</span>
              <span class="text-[12px] font-medium text-text-muted group-hover:text-text-primary transition-colors">{item.score}%</span>
            </div>
            <div class="w-full bg-bg-subtle h-2.5 rounded-[4px] overflow-hidden border border-border-faint">
              <div class="bg-gradient-to-r from-indigo-500/60 to-indigo-500 h-full rounded-[4px] transition-all duration-500 ease-out" style="width: {item.score}%"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
