<script>
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';

  let risingFeaturesRef;
  let growingIssuesRef;

  onMount(() => {
    // Rising Features Chart
    if (risingFeaturesRef) {
      const risingChart = echarts.init(risingFeaturesRef);
      risingChart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', textStyle: { color: 'var(--color-text-primary)', fontSize: 12 } },
        grid: { top: 10, bottom: 20, left: 0, right: 0 },
        xAxis: { 
          type: 'category', 
          boundaryGap: false, 
          data: ['W1', 'W2', 'W3', 'W4'],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: 'var(--color-text-muted)', fontSize: 11 }
        },
        yAxis: { type: 'value', show: false },
        series: [
          {
            name: 'Offline Mode',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [320, 332, 301, 334],
            itemStyle: { color: '#f59e0b' } // amber
          },
          {
            name: 'Export PDF',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [150, 232, 201, 154],
            itemStyle: { color: '#10b981' } // green
          },
          {
            name: 'AI Search',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [220, 182, 191, 234],
            itemStyle: { color: '#3b82f6' } // blue
          },
          {
            name: 'Dark Mode',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [120, 132, 101, 134],
            itemStyle: { color: '#8b5cf6' } // purple
          }
        ]
      });
      const resizeObserver1 = new ResizeObserver(() => risingChart.resize());
      resizeObserver1.observe(risingFeaturesRef);
    }

    // Growing Issues Chart
    if (growingIssuesRef) {
      const issuesChart = echarts.init(growingIssuesRef);
      issuesChart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', textStyle: { color: 'var(--color-text-primary)', fontSize: 12 } },
        grid: { top: 10, bottom: 20, left: 0, right: 0 },
        xAxis: { 
          type: 'category', 
          boundaryGap: false, 
          data: ['W1', 'W2', 'W3', 'W4'],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: 'var(--color-text-muted)', fontSize: 11 }
        },
        yAxis: { type: 'value', show: false },
        series: [
          {
            name: 'Login Errors',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [80, 90, 85, 100],
            itemStyle: { color: '#64748b' } // slate
          },
          {
            name: 'Billing Problems',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [150, 232, 201, 154],
            itemStyle: { color: '#eab308' } // yellow
          },
          {
            name: 'Slow Performance',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [220, 182, 191, 234],
            itemStyle: { color: '#f97316' } // orange
          },
          {
            name: 'Onboarding Issues',
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.1 },
            lineStyle: { width: 2 },
            symbol: 'none',
            data: [120, 282, 391, 434],
            itemStyle: { color: '#ef4444' } // red
          }
        ]
      });
      const resizeObserver2 = new ResizeObserver(() => issuesChart.resize());
      resizeObserver2.observe(growingIssuesRef);
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
    <div class="w-full h-48" bind:this={risingFeaturesRef}></div>
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
    <div class="w-full h-48" bind:this={growingIssuesRef}></div>
  </div>
</div>
