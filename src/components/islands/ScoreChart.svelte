<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let projectId: string;
  export let date: string = '';

  let lineCanvas: HTMLCanvasElement;
  let lineChart: Chart;
  let pollInterval: any;
  let versionLabels: (string | null)[] = [];
  let validPointsCount = 0;
  let currentAvgRating = "0.0";
  let isLoaded = false;

  async function loadData() {
    if (!projectId) return;
    try {
      const url = `/api/dashboard?app_id=${projectId}${date ? `&date=${date}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.rating_by_day && lineChart) {
        let labels = json.rating_by_day.map((d: any) => {
          const parts = d.date.split('-');
          if (parts.length === 3) {
            const dateObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
          }
          return d.date;
        });
        let ratingData = json.rating_by_day.map((d: any) => d.avg_rating);
        
        const versionMarkers = json.rating_by_day.map((d: any) => {
          const change = json.version_changes ? json.version_changes.find((vc: any) => vc.date === d.date) : null;
          return change ? d.avg_rating : null;
        });
        
        versionLabels = json.rating_by_day.map((d: any) => {
          const change = json.version_changes ? json.version_changes.find((vc: any) => vc.date === d.date) : null;
          return change ? change.version : null;
        });

        validPointsCount = ratingData.filter((r: any) => r !== null && r !== undefined).length;
        
        if (validPointsCount > 0) {
          const sum = ratingData.reduce((acc: number, curr: any) => (curr !== null && curr !== undefined) ? acc + curr : acc, 0);
          currentAvgRating = (sum / validPointsCount).toFixed(1);
        }
        
        isLoaded = true;

        lineChart.data.labels = labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        lineChart.data.datasets[0].data = ratingData.length ? ratingData : [1, 1, 1, 1, 1, 1, 1];
        
        lineChart.data.datasets[0].pointRadius = validPointsCount === 1 ? 4 : 0;
        
        lineChart.update('none');
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
      const lineGradient = lineCtx.createLinearGradient(0, 0, 0, 280);
      lineGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      lineGradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Average Rating',
            data: [1, 1, 1, 1, 1, 1, 1],
            borderColor: accent,
            backgroundColor: lineGradient,
            borderWidth: 3,
            tension: 0.45,
            fill: true,
            spanGaps: true,
            pointRadius: 0,
            pointHoverRadius: 7,
            pointBackgroundColor: accent,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2
          }]
        },
        options: {
          layout: {
            padding: { top: 10, right: 15, bottom: 5, left: 5 }
          },
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
                  return `Average Rating: ${context.parsed.y}`;
                }
              }
            } 
          },
          scales: {
            y: {
              min: 0, max: 5.5,
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

<div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden mb-10">
  <div class="w-full p-[24px]">
    <div class="text-[11px] uppercase tracking-wider text-text-muted mb-2">Rating & Sentiment Trend</div>
    
    {#if !isLoaded}
      <div class="w-full h-[100px] flex items-center justify-center text-[13px] text-text-secondary">
        Loading...
      </div>
    {:else if validPointsCount < 3}
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="text-[14px] font-medium text-text-primary">Building trend graph...</div>
        {#if validPointsCount > 0}
          <div class="text-[13px] text-text-secondary mt-2">
            Current rating is <span class="text-accent font-semibold">{currentAvgRating}</span> ({validPointsCount} {validPointsCount === 1 ? 'day' : 'days'} collected)
          </div>
        {/if}
        <div class="text-[12px] text-text-muted mt-2">Requires at least 3 days of monitoring to plot.</div>
      </div>
    {/if}

    <div class="relative w-full h-[280px] {!isLoaded || validPointsCount < 3 ? 'hidden' : 'mt-4'}">
      <canvas bind:this={lineCanvas}></canvas>
    </div>
  </div>
</div>
