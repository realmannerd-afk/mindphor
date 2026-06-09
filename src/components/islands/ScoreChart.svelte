<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let projectId: string;

  let lineCanvas: HTMLCanvasElement;
  let barCanvas: HTMLCanvasElement;
  let lineChart: Chart;
  let barChart: Chart;
  let pollInterval: any;
  let hasCategoryData = false;
  let hasLineData = false;
  let isLoaded = false;

  async function loadData() {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/dashboard?project_id=${projectId}`);
      const json = await res.json();
      if (json.score_by_day) {
        hasLineData = json.score_by_day.some((d: any) => d.score !== null && d.score !== 0);
        if (lineChart) {
          lineChart.data.labels = json.score_by_day.map((d: any) => d.day);
          lineChart.data.datasets[0].data = json.score_by_day.map((d: any) => d.score);
          lineChart.update('none');
        }
      } else {
        hasLineData = false;
      }
      if (json.score_by_category) {
        hasCategoryData = json.score_by_category.some((c: any) => c.score !== null && c.score !== 0);
        if (hasCategoryData && barChart) {
          barChart.data.labels = json.score_by_category.map((c: any) => c.category);
          barChart.data.datasets[0].data = json.score_by_category.map((c: any) => c.score);
          barChart.update('none');
        }
      } else {
        hasCategoryData = false;
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoaded = true;
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
            label: 'Score',
            data: [null, null, null, null, null, null, null],
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
              titleFont: { size: 11, family: 'Geist', weight: '500' },
              bodyFont: { size: 11, family: 'Geist', weight: '500' },
              callbacks: {
                label: function(context) {
                  if (context.parsed.y === 0 || context.parsed.y === null) return "No data";
                  return `Score: ${context.parsed.y}`;
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

    // BAR CHART
    const barCtx = barCanvas.getContext('2d');
    if (barCtx) {
      const barGradient = barCtx.createLinearGradient(0, 0, 300, 0);
      barGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      barGradient.addColorStop(1, 'rgba(99, 102, 241, 1)');

      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Memory'],
          datasets: [{
            data: [0],
            backgroundColor: barGradient,
            barThickness: 12,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
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
              titleFont: { size: 11, family: 'Geist', weight: '500' },
              bodyFont: { size: 11, family: 'Geist', weight: '500' }
            } 
          },
          scales: {
            x: {
              min: 0, max: 100,
              grid: { display: false },
              ticks: { display: false },
              border: { display: false }
            },
            y: {
              grid: { display: false },
              ticks: { color: txtSecondary, font: { size: 12, family: 'Geist' } },
              border: { display: false }
            }
          }
        }
      });
    }

    loadData();
    pollInterval = setInterval(loadData, 5000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (lineChart) lineChart.destroy();
      if (barChart) barChart.destroy();
    };
  });
</script>

{#if isLoaded && !hasLineData && !hasCategoryData}
  <div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden mb-10 p-12 flex flex-col items-center justify-center text-center">
    <div class="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
    </div>
    <h3 class="text-[15px] font-medium text-text-primary mb-1.5">No analytics data yet</h3>
    <p class="text-[13px] text-text-muted max-w-[350px] mb-6 leading-relaxed">Add your API key and integrate the SDK to start monitoring your LLM application's quality and latency trends.</p>
    <a 
      href="/docs/quickstart" 
      class="text-[13px] bg-text-primary text-bg-base hover:opacity-90 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
      View Integration Guide
    </a>
  </div>
{/if}

<div class={`bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-faint mb-10 ${isLoaded && !hasLineData && !hasCategoryData ? 'hidden' : ''}`}>
  <!-- Left Chart (60%) -->
  <div class="w-full lg:w-[60%] p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-[16px]">Quality Score Trend</div>
    <div class="relative w-full h-[220px]">
      <canvas bind:this={lineCanvas}></canvas>
    </div>
  </div>

  <!-- Right Chart (40%) -->
  <div class="w-full lg:w-[40%] p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-[16px]">Score by Category</div>
    <div class="relative w-full h-[220px]">
      <canvas bind:this={barCanvas} class={hasCategoryData ? '' : 'opacity-0 pointer-events-none'}></canvas>
      {#if !hasCategoryData}
        <div class="absolute inset-0 flex items-center justify-center text-[13px] text-text-muted">
          No category data yet
        </div>
      {/if}
    </div>
  </div>
</div>
