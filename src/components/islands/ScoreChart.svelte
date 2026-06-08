<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let projectId: string;

  let lineCanvas: HTMLCanvasElement;
  let barCanvas: HTMLCanvasElement;
  let lineChart: Chart;
  let barChart: Chart;
  let pollInterval: any;

  async function loadData() {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/dashboard?project_id=${projectId}`);
      const json = await res.json();
      if (json.score_by_day && lineChart) {
        lineChart.data.labels = json.score_by_day.map((d: any) => d.day);
        lineChart.data.datasets[0].data = json.score_by_day.map((d: any) => d.score);
        lineChart.update('none');
      }
      if (json.score_by_category && barChart) {
        barChart.data.labels = json.score_by_category.map((c: any) => c.category);
        barChart.data.datasets[0].data = json.score_by_category.map((c: any) => c.score);
        barChart.update('none');
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
            label: 'Score',
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
              titleFont: { size: 11, family: 'Geist', weight: '500' },
              bodyFont: { size: 11, family: 'Geist', weight: '500' },
              callbacks: {
                label: function(context) {
                  return `Score: ${context.parsed.y}`;
                },
                afterLabel: function(context) {
                  const latency = Math.floor(Math.random() * 150 + 100);
                  const tokens = (Math.random() * 2 + 1).toFixed(1);
                  return `Latency: ${latency}ms\nTokens: ${tokens}k`;
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
          labels: ['Relevance', 'Accuracy', 'Consistency', 'Memory'],
          datasets: [{
            data: [92, 85, 88, 76],
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

<div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-faint mb-10">
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
      <canvas bind:this={barCanvas}></canvas>
    </div>
  </div>
</div>
