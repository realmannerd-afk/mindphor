<script lang="ts">
  import { onMount } from 'svelte';

  // 1. Rigorous Schema for Animation Event Tracking
  interface TypingStep { type: 'type-prompt'; text: string; }
  interface ThinkingStep { type: 'thinking'; logs: string[]; duration: number; }
  interface StreamStep { type: 'stream-response'; text: string; source: string; meta?: string; }
  interface NodeStep { type: 'inject-node'; nodeType: 'metric' | 'alert-row'; data: any; }
  interface PauseStep { type: 'pause'; duration: number; }

  type TimelineEvent = TypingStep | ThinkingStep | StreamStep | NodeStep | PauseStep;

  // 2. The Comprehensive Simulation Script
  const sequence: TimelineEvent[] = [
    { type: 'type-prompt', text: 'sync --target=all --mode=intelligence' },
    { 
      type: 'thinking', 
      logs: [
        '✨ Mindphor engine initialised.',
        '📡 Connecting to 6 pipeline sockets...',
        '🔒 Auth verified for App Store, G2, and Product Hunt.',
        '🚀 Fetching payload diff hashes...'
      ],
      duration: 2000 
    },
    { 
      type: 'stream-response', 
      source: 'Product Hunt', 
      meta: 'v2.graphql.live',
      text: 'Linear launched "Linear Asks" today. The update features automated ticketing consolidation, internal triage channels, and deep Slack workspace integrations. AI engine evaluates this as a high-threat product divergence.' 
    },
    {
      type: 'inject-node',
      nodeType: 'metric',
      data: { score: '94/100', status: 'High Threat Delta', color: 'text-rose-400' }
    },
    { type: 'pause', duration: 3500 },
    { type: 'type-prompt', text: 'analyze --source=app-store --filter=sentiment' },
    { 
      type: 'thinking', 
      logs: [
        '📥 Ingesting 142 new App Store customer reviews...',
        '📊 Running sentiment aggregation via local embeddings...',
        '💡 Feature variance detected in mobile viewports.'
      ],
      duration: 1800 
    },
    { 
      type: 'stream-response', 
      source: 'Apple App Store', 
      meta: 'v1.reviews.rss',
      text: 'Critical mobile sentiment dip detected. Multiple users reporting the new workspace navigation drawer crashes on iOS 17.4 device viewports. Average rating dropped from 4.8 to 4.1 over a 24-hour window.' 
    },
    {
      type: 'inject-node',
      nodeType: 'alert-row',
      data: { msg: 'iOS Navigation Drawer Crash', count: '14 reports', severity: 'CRITICAL' }
    },
    { type: 'pause', duration: 5000 }
  ];

  // 3. Granular Reactive State Machine
  let currentPrompt = '';
  let activeResponse = '';
  let activeSource = '';
  let activeMeta = '';
  let currentStatus: 'idle' | 'typing' | 'thinking' | 'streaming' | 'complete' = 'idle';
  
  // Terminal logs display state
  let consoleLogs: Array<{ text: string; timestamp: string; isSystem?: boolean }> = [];
  
  // Component Node Visual Injection States
  let injectedMetric: { score: string; status: string; color: string } | null = null;
  let injectedAlert: { msg: string; count: string; severity: string } | null = null;

  function formatTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }

  function appendLog(text: string, isSystem = false) {
    consoleLogs = [...consoleLogs, { text, timestamp: formatTime(), isSystem }];
    if (consoleLogs.length > 8) consoleLogs.shift();
  }

  // 4. Async Execution Engine Loop
  async function runSimulationLoop() {
    while (true) {
      for (const event of sequence) {
        
        // --- STEP A: TYPE PROMPT ---
        if (event.type === 'type-prompt') {
          currentStatus = 'typing';
          currentPrompt = '';
          activeResponse = '';
          activeSource = '';
          activeMeta = '';
          injectedMetric = null;
          injectedAlert = null;
          appendLog('awaiting console instructions...', true);

          // Type with randomized micro-delays to look organic
          for (let i = 0; i < event.text.length; i++) {
            currentPrompt += event.text[i];
            await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
          }
          await new Promise(r => setTimeout(r, 600));
        }

        // --- STEP B: THINKING ENGINE ---
        else if (event.type === 'thinking') {
          currentStatus = 'thinking';
          
          // Stream logs sequentially throughout the duration window
          const delayPerLog = event.duration / event.logs.length;
          for (const log of event.logs) {
            appendLog(log);
            await new Promise(r => setTimeout(r, delayPerLog));
          }
        }

        // --- STEP C: AI STREAMING RESPONSE ---
        else if (event.type === 'stream-response') {
          currentStatus = 'streaming';
          activeSource = event.source;
          activeMeta = event.meta || '';
          appendLog(`Parsing delta compilation stream from [${event.source}]...`, true);

          const words = event.text.split(' ');
          for (const word of words) {
            activeResponse += (activeResponse ? ' ' : '') + word;
            // Simulated variable network chunk streaming delay
            await new Promise(r => setTimeout(r, 40 + Math.random() * 50));
          }
          currentStatus = 'complete';
        }

        // --- STEP D: STRUCTURAL INJECTION ---
        else if (event.type === 'inject-node') {
          if (event.nodeType === 'metric') {
            injectedMetric = event.data;
            appendLog('📊 Appended structural metric card to dashboard data tree.');
          } else if (event.nodeType === 'alert-row') {
            injectedAlert = event.data;
            appendLog('🚨 Dispatched priority action_tasks vector row.');
          }
        }

        // --- STEP E: COOLDOWN PAUSE ---
        else if (event.type === 'pause') {
          await new Promise(r => setTimeout(r, event.duration));
        }
      }
    }
  }

  onMount(() => {
    runSimulationLoop();
  });
</script>

<!-- The Container -->
<div class="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[520px] bg-zinc-950 border border-white/[0.06] rounded-xl overflow-hidden font-mono text-sm text-zinc-300 shadow-2xl shadow-indigo-500/5 select-none">
  
  <!-- LEFT PIPELINE DIALER DISPLAY (4 Columns) -->
  <div class="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-zinc-900/20 p-5 flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
          <span class="text-xs font-sans font-semibold tracking-wider text-zinc-400 uppercase">System Orchestration</span>
        </div>
        <span class="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500">v1.4.2</span>
      </div>

      <!-- Real-time Console Logger -->
      <div class="space-y-2 text-[12px] leading-relaxed select-text">
        {#each consoleLogs as log}
          <div class="flex items-start gap-2">
            <span class="text-zinc-600 shrink-0">[{log.timestamp}]</span>
            <p class={log.isSystem ? 'text-indigo-400/90 font-semibold text-left' : 'text-zinc-400 text-left'}>
              {log.text}
            </p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Static Decorative Pipeline Status Indicators -->
    <div class="pt-5 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-[11px] font-sans text-zinc-500">
      <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>Reddit Pipeline</div>
      <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>Product Hunt</div>
      <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>Apple Store</div>
      <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>Capterra Sync</div>
    </div>
  </div>

  <!-- RIGHT INTERACTIVE SANDBOX GRAPHIC (8 Columns) -->
  <div class="lg:col-span-8 p-6 flex flex-col justify-between bg-zinc-950/80">
    
    <!-- Top Mock App Window Header -->
    <div class="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4 font-sans">
      <div class="flex items-center gap-2.5">
        <div class="flex gap-1.5">
          <span class="w-3 h-3 rounded-full bg-zinc-800"></span>
          <span class="w-3 h-3 rounded-full bg-zinc-800"></span>
          <span class="w-3 h-3 rounded-full bg-zinc-800"></span>
        </div>
        <div class="h-4 w-[1px] bg-zinc-800 mx-1"></div>
        <span class="text-xs text-white font-semibold tracking-tight">Mindphor Cloud Intelligence</span>
      </div>
      <div class="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 border border-white/[0.04] text-zinc-400 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        Production API Environment
      </div>
    </div>

    <!-- Main Live Simulation Workspace Area -->
    <div class="flex-1 flex flex-col gap-5 justify-start">
      
      <!-- Simulated Input Console Prompt Box -->
      <div class="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 shadow-inner relative group">
        <div class="absolute top-3.5 right-4 flex items-center gap-1 text-[11px] text-zinc-600 font-sans">
          <span>Ctrl + Enter to force call</span>
        </div>
        <div class="flex items-center gap-2 text-indigo-400/80 text-xs font-bold uppercase tracking-wider mb-1.5">
          <span>$ mindphor_cmd</span>
        </div>
        <div class="text-zinc-100 font-mono tracking-wide text-sm flex items-center min-h-[20px] text-left">
          {currentPrompt}
          {#if currentStatus === 'typing'}
            <span class="w-1.5 h-4 bg-indigo-500 ml-1 animate-pulse"></span>
          {/if}
        </div>
      </div>

      <!-- Live Dynamic Output Frame -->
      <div class="flex-1 flex flex-col">
        {#if currentStatus === 'thinking'}
          <div class="flex items-center gap-3 text-zinc-500 py-4 px-2 text-xs font-sans tracking-wide">
            <svg class="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Querying remote datasets and evaluating semantic vectors...</span>
          </div>
        {/if}

        {#if activeResponse}
          <div class="border border-white/[0.06] bg-gradient-to-b from-zinc-900/40 to-transparent rounded-xl p-5 space-y-4 shadow-xl">
            <!-- Source Tag Metadata Row -->
            <div class="flex items-center justify-between text-xs border-b border-white/[0.04] pb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span class="text-zinc-200 font-sans font-bold tracking-tight">AI Trace Digest</span>
              </div>
              <div class="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                <span>src: {activeSource}</span>
                <span>•</span>
                <span class="text-zinc-600">{activeMeta}</span>
              </div>
            </div>
            
            <!-- The Rendered Streaming Text -->
            <p class="text-zinc-300 leading-relaxed font-sans text-[13px] sm:text-[14px] text-left">
              {activeResponse}
              {#if currentStatus === 'streaming'}
                <span class="w-2 h-4 bg-zinc-500 ml-0.5 inline-block animate-pulse align-middle"></span>
              {/if}
            </p>

            <!-- EXTRA INTERACTIVE HOOK: DYNAMICALLY INJECTED UI NODE ELEMENTS -->
            {#if injectedMetric}
              <div class="pt-2 flex grid grid-cols-2 gap-4 border-t border-white/[0.04] mt-2 font-sans text-left">
                <div class="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04]">
                  <p class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Computed Severity</p>
                  <p class="text-xl font-black mt-0.5 {injectedMetric.color}">{injectedMetric.score}</p>
                </div>
                <div class="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04]">
                  <p class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Classification</p>
                  <p class="text-xs font-semibold text-zinc-300 mt-1.5">{injectedMetric.status}</p>
                </div>
              </div>
            {/if}

            {#if injectedAlert}
              <div class="pt-2 border-t border-white/[0.04] mt-2 font-sans text-left">
                <div class="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs">
                  <div class="flex items-center gap-2.5">
                    <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-[9px] font-bold text-rose-400 uppercase tracking-widest">{injectedAlert.severity}</span>
                    <span class="text-zinc-200 font-medium">{injectedAlert.msg}</span>
                  </div>
                  <span class="text-zinc-500 text-[11px]">{injectedAlert.count}</span>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
