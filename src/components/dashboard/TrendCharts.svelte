<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  let risingFeaturesRef;
  let growingIssuesRef;

  onMount(() => {
    // Rising Features Chart
    if (risingFeaturesRef) {
      const risingChart = new Chart(risingFeaturesRef.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['W1', 'W2', 'W3', 'W4'],
          datasets: [
            { label: 'Offline Mode', data: [320, 332, 301, 334], borderColor: '#f59e0b', backgroundColor: '#f59e0b1a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 },
            { label: 'Export PDF', data: [150, 232, 201, 154], borderColor: '#10b981', backgroundColor: '#10b9811a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 },
            { label: 'AI Search', data: [220, 182, 191, 234], borderColor: '#3b82f6', backgroundColor: '#3b82f61a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 },
            { label: 'Dark Mode', data: [120, 132, 101, 134], borderColor: '#8b5cf6', backgroundColor: '#8b5cf61a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E1E1E',
              titleColor: '#FFFFFF',
              bodyColor: '#FFFFFF',
              borderColor: '#333333',
              borderWidth: 1
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { stacked: true, display: false }
          }
        }
      });
    }

    // Growing Issues Chart
    if (growingIssuesRef) {
      const issuesChart = new Chart(growingIssuesRef.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['W1', 'W2', 'W3', 'W4'],
          datasets: [
            { label: 'Login Errors', data: [80, 90, 85, 100], borderColor: '#64748b', backgroundColor: '#64748b1a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 },
            { label: 'Billing Problems', data: [150, 232, 201, 154], borderColor: '#eab308', backgroundColor: '#eab3081a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 },
            { label: 'Slow Performance', data: [220, 182, 191, 234], borderColor: '#f97316', backgroundColor: '#f973161a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 },
            { label: 'Onboarding Issues', data: [120, 282, 391, 434], borderColor: '#ef4444', backgroundColor: '#ef44441a', fill: true, tension: 0, pointRadius: 0, borderWidth: 2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E1E1E',
              titleColor: '#FFFFFF',
              bodyColor: '#FFFFFF',
              borderColor: '#333333',
              borderWidth: 1
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { stacked: true, display: false }
          }
        }
      });
    }
  });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Rising Features -->
  <div class="bg-bg-surface border border-border-default rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-text-primary">Rising Feature Requests</h3>
      <span class="text-[11px] font-medium text-text-secondary bg-bg-subtle border border-border-faint px-2 py-1 rounded-md">Last 4 Weeks</span>
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-2 mb-6 text-[11px] font-medium">
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#8b5cf6]"></div><span class="text-text-secondary">Dark Mode</span></div>
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#3b82f6]"></div><span class="text-text-secondary">AI Search</span></div>
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#10b981]"></div><span class="text-text-secondary">Export PDF</span></div>
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#f59e0b]"></div><span class="text-text-secondary">Offline Mode</span></div>
    </div>
    <div class="w-full h-48 relative">
      <canvas bind:this={risingFeaturesRef}></canvas>
    </div>
  </div>

  <!-- Growing Issues -->
  <div class="bg-bg-surface border border-border-default rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-text-primary">Growing Issues</h3>
      <span class="text-[11px] font-medium text-text-secondary bg-bg-subtle border border-border-faint px-2 py-1 rounded-md">Last 4 Weeks</span>
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-2 mb-6 text-[11px] font-medium">
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#ef4444]"></div><span class="text-text-secondary">Onboarding Issues</span></div>
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#f97316]"></div><span class="text-text-secondary">Slow Performance</span></div>
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#eab308]"></div><span class="text-text-secondary">Billing Problems</span></div>
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#64748b]"></div><span class="text-text-secondary">Login Errors</span></div>
    </div>
    <div class="w-full h-48 relative">
      <canvas bind:this={growingIssuesRef}></canvas>
    </div>
  </div>
</div>
