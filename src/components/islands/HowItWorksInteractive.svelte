<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide, fly, scale } from 'svelte/transition';
  import { IconPlug, IconCircleCheck, IconBrain, IconChartBar, IconRefresh, IconAlertOctagon, IconBell, IconBellRinging, IconTrendingUp } from '@tabler/icons-svelte';
  import Logo from './Logo.svelte';
  import Apple from '@thesvg/svelte/apple';
  import Github from '@thesvg/svelte/github';
  import Slack from '@thesvg/svelte/slack';
  import Figma from '@thesvg/svelte/figma';
  import TypingAnimation from './TypingAnimation.svelte';
  let activeStep = 0;
  let autoplayTimer: ReturnType<typeof setTimeout>;

  function scheduleNextStep(duration: number) {
    if (typeof window === 'undefined') return;
    clearTimeout(autoplayTimer);
    autoplayTimer = setTimeout(() => {
      activeStep = (activeStep + 1) % 3;
    }, duration);
  }

  // Fire animations and schedule next step whenever activeStep changes
  $: if (activeStep !== undefined && typeof window !== 'undefined') {
    if (activeStep === 0) {
      isConnected = false;
      triggerStep1();
      scheduleNextStep(4000); // 1.5s animate + 2.5s view
    } else if (activeStep === 1) {
      nextReview();
      triggerStep2();
      scheduleNextStep(4500); // 1.2s animate + 3.3s view
    } else if (activeStep === 2) {
      triggerStep3();
      scheduleNextStep(4500); // 1.2s animate + 3.3s view
    }
  }

  onMount(() => {
    return () => {
      clearTimeout(autoplayTimer);
    };
  });
  
  // Step 1 states
  let appUrl = 'https://play.google.com/store/apps/details?id=com.mindphor.app';
  let isConnecting = false;
  let isConnected = false;

  // Step 2 states
  let activeReviewIndex = 0;
  const mockReviews = [
    { type: "Issue", summary: "Login failures reported", confidence: "97%", status: "Investigating" },
    { type: "Feature Request", summary: "Users requesting AI Search", confidence: "94%", status: "New" },
    { type: "Competitor", summary: "Linear mentioned frequently", confidence: "91%", status: "Monitoring" }
  ];
  let isAnalyzing = false;
  let showAnalysisResult = false;

  // Step 3 states
  let competitorName = 'com.instagram.android';
  let isTracking = false;

  function triggerStep1() {
    isConnecting = true;
    setTimeout(() => {
      isConnecting = false;
      isConnected = true;
    }, 1500);
  }

  function triggerStep2() {
    isAnalyzing = true;
    showAnalysisResult = false;
    setTimeout(() => {
      isAnalyzing = false;
      showAnalysisResult = true;
    }, 1200);
  }

  let step3Toasts: any[] = [];
  function triggerStep3() {
    isTracking = true;
    step3Toasts = [];
    setTimeout(() => {
      isTracking = false;
      step3Toasts = [{ id: 1, title: 'Jira Sentiment', desc: 'Score dropped 5%' }, ...step3Toasts];
      setTimeout(() => {
        step3Toasts = [{ id: 2, title: 'Asana Mentions', desc: 'Down 12% in UI' }, ...step3Toasts];
        setTimeout(() => {
          step3Toasts = [{ id: 3, title: 'Linear Spike', desc: 'Mentions are up 57% today' }, ...step3Toasts];
        }, 300);
      }, 300);
    }, 1200);
  }

  function nextReview() {
    activeReviewIndex = (activeReviewIndex + 1) % mockReviews.length;
    showAnalysisResult = false;
  }

  function resetStep1() {
    isConnected = false;
    appUrl = 'https://play.google.com/store/apps/details?id=com.mindphor.app';
  }

  function getTypeColor(type: string) {
    if (type === 'Issue') return 'text-red-500';
    if (type === 'Feature Request') return 'text-green-500';
    if (type === 'Competitor') return 'text-orange-500';
    return 'text-text-primary';
  }
</script>

<div class="w-full flex flex-col lg:flex-row gap-8 lg:gap-16 items-stretch select-none">
  <!-- Left Side: Interactive Step Selectors -->
  <div class="w-full lg:w-[420px] flex-shrink-0 flex flex-col justify-center gap-6 py-2">
    <!-- Step 1 Trigger -->
    <button 
      on:click={() => activeStep = 0} 
      class={`text-left py-4 transition-all duration-300 relative overflow-hidden ${
        activeStep === 0 
          ? 'opacity-100' 
          : 'opacity-40 hover:opacity-100'
      }`}
    >
      <div class="flex items-start gap-4">
        <span class={`text-[20px] font-mono font-light leading-none mt-1 ${activeStep === 0 ? 'text-accent' : 'text-text-muted'}`}>01</span>
        <div class="w-full">
          <h3 class="text-[15px] font-medium text-text-primary">Connect Channels</h3>
          {#if activeStep === 0}
            <div transition:slide={{ duration: 300 }}>
              <p class="text-[13px] text-text-secondary leading-relaxed mt-2">
                Link your Google Play Store app link securely in one simple step. No-code required setup.
              </p>
            </div>
          {/if}
        </div>
      </div>
    </button>

    <!-- Step 2 Trigger -->
    <button 
      on:click={() => activeStep = 1} 
      class={`text-left py-4 transition-all duration-300 relative overflow-hidden ${
        activeStep === 1 
          ? 'opacity-100' 
          : 'opacity-40 hover:opacity-100'
      }`}
    >
      <div class="flex items-start gap-4">
        <span class={`text-[20px] font-mono font-light leading-none mt-1 ${activeStep === 1 ? 'text-accent' : 'text-text-muted'}`}>02</span>
        <div class="w-full">
          <h3 class="text-[15px] font-medium text-text-primary">AI Sentiment Analysis</h3>
          {#if activeStep === 1}
            <div transition:slide={{ duration: 300 }}>
              <p class="text-[13px] text-text-secondary leading-relaxed mt-2">
                Automatically analyze reviews, classify sentiment, and sort feedback into bugs, features, and UI requests.
              </p>
            </div>
          {/if}
        </div>
      </div>
    </button>

    <!-- Step 3 Trigger -->
    <button 
      on:click={() => activeStep = 2} 
      class={`text-left py-4 transition-all duration-300 relative overflow-hidden ${
        activeStep === 2 
          ? 'opacity-100' 
          : 'opacity-40 hover:opacity-100'
      }`}
    >
      <div class="flex items-start gap-4">
        <span class={`text-[20px] font-mono font-light leading-none mt-1 ${activeStep === 2 ? 'text-accent' : 'text-text-muted'}`}>03</span>
        <div class="w-full">
          <h3 class="text-[15px] font-medium text-text-primary">Competitor Watch</h3>
          {#if activeStep === 2}
            <div transition:slide={{ duration: 300 }}>
              <p class="text-[13px] text-text-secondary leading-relaxed mt-2">
                Establish comparison metrics and monitor alternative marketplace updates automatically.
              </p>
            </div>
          {/if}
        </div>
      </div>
    </button>
  </div>

  <!-- Right Side: Interactive Simulation Sandbox Visualizer -->
  <div class="w-full flex-1 bg-white/90 border border-border-default/50 rounded-2xl p-10 shadow-none relative overflow-hidden grid grid-cols-1 grid-rows-1 items-stretch min-h-[420px]">

    {#if activeStep === 0}
      <!-- SIMULATION 1: CONNECT CHANNELS -->
      <div transition:fade={{ duration: 150 }} class="col-start-1 row-start-1 relative z-10 flex flex-col justify-between h-full w-full">
        <div class="mb-8 text-center px-4">
          <h4 class="text-[15px] font-medium text-text-primary mb-2">Connect Google Play Link</h4>
          <p class="text-[13px] text-text-secondary leading-relaxed mb-6">Enter your app bundle URL below to connect the real-time review feed:</p>
        </div>

        <!-- Connection Visual -->
        <div class="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-6 w-full">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden opacity-100">
            <img src="/icons/google-play.svg" alt="Google Play" class="w-full h-full object-contain relative z-10" />
          </div>
          <div class="flex items-center transition-colors duration-300 {isConnecting ? 'text-accent' : 'text-text-muted'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" class="w-8 h-8 rotate-180 opacity-90">
              <defs>
                <linearGradient id="shimmerGradient" x1="100%" y1="0" x2="200%" y2="0">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="0.2" />
                  <stop offset="50%" stop-color="currentColor" stop-opacity="1" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0.2" />
                  <animate attributeName="x1" values="100%; -100%" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="200%; 0%" dur="1.5s" repeatCount="indefinite" />
                </linearGradient>
              </defs>
              <path fill="none" stroke="url(#shimmerGradient)" stroke-width="1.5" d="M8 5c0 .742-.733 1.85-1.475 2.78c-.954 1.2-2.094 2.247-3.401 3.046C2.144 11.425.956 12 0 12m0 0c.956 0 2.145.575 3.124 1.174c1.307.8 2.447 1.847 3.401 3.045C7.267 17.15 8 18.26 8 19m-8-7h24"/>
            </svg>
          </div>
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center p-3 relative overflow-visible opacity-100">
            <div class="flex items-end justify-center w-full h-full gap-[1px] relative z-10 scale-[0.8]">
              <img src="/Group.svg" alt="Mindphor Circle" class="h-[80%] w-auto object-contain" />
              <img src="/Group-1.svg" alt="Mindphor Bar" class="h-full w-auto object-contain" />
            </div>
          </div>


        </div>


      </div>

    {:else if activeStep === 1}
      <!-- SIMULATION 2: AI SENTIMENT ANALYSIS -->
      <div transition:fade={{ duration: 150 }} class="col-start-1 row-start-1 relative z-10 flex flex-col justify-between h-full w-full">
        <div class="mb-8 text-center px-4">
          <h4 class="text-[15px] font-medium text-text-primary mb-2">Mindphor AI Classification</h4>
          <p class="text-[13px] text-text-secondary leading-relaxed mb-4">Simulate feeding user review content into our classifier model:</p>
        </div>

        <!-- Shimmer AI Engine Visual (No Cards) -->
        <div class="mt-4 mb-auto relative w-full flex flex-col items-center justify-center text-[13px] py-4 overflow-visible">
          
          <!-- Re-added logo for Step 2 -->
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center p-2 relative z-10 mx-auto mb-6 transition-opacity duration-500 {showAnalysisResult ? 'opacity-100' : 'opacity-0'} -mt-12">
            <div class="flex items-end justify-center w-full h-full gap-[1px] relative scale-[0.6]">
              <img src="/Group.svg" alt="Mindphor Circle" class="h-[80%] w-auto object-contain" />
              <img src="/Group-1.svg" alt="Mindphor Bar" class="h-full w-auto object-contain" />
            </div>
          </div>

          <!-- Content Area -->
          <div class="relative z-10 w-full text-center h-[130px] flex flex-col items-center justify-start mt-2">
            {#if isAnalyzing}
              <!-- Shimmer Text for Thinking State -->
              <div class="inline-flex mt-2">
                <span class="text-[15px] font-medium bg-gradient-to-r from-text-faint via-text-primary to-text-faint bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer py-1 px-1">
                  Mindphor engine is thinking...
                </span>
              </div>
            {:else if showAnalysisResult}
              <div transition:fade={{ duration: 400 }} class="flex flex-col gap-2.5 w-full max-w-[280px] mx-auto text-left relative z-20 translate-x-10 -translate-y-8">
                <div class="grid grid-cols-[130px_1fr] gap-2 pb-2 border-b border-border-default/50 min-h-[32px] w-full items-center">
                  <span class="text-text-muted font-medium">
                    <TypingAnimation text="Type" duration={40} />
                  </span>
                  <span class={`font-semibold text-left ${getTypeColor(mockReviews[activeReviewIndex].type)}`}>
                    <TypingAnimation text={mockReviews[activeReviewIndex].type} duration={40} />
                  </span>
                </div>
                <div class="grid grid-cols-[130px_1fr] gap-2 pb-2 border-b border-border-default/50 min-h-[32px] w-full items-center">
                  <span class="text-text-muted font-medium">
                    <TypingAnimation text="Summary" duration={40} />
                  </span>
                  <span class="text-text-primary font-medium truncate text-left" title={mockReviews[activeReviewIndex].summary}>
                    <TypingAnimation text={mockReviews[activeReviewIndex].summary} duration={25} />
                  </span>
                </div>
                <div class="grid grid-cols-[130px_1fr] gap-2 pb-2 border-b border-border-default/50 min-h-[32px] w-full items-center">
                  <span class="text-text-muted font-medium">
                    <TypingAnimation text="Confidence" duration={40} />
                  </span>
                  <span class="text-text-primary font-semibold font-mono text-left">
                    <TypingAnimation text={mockReviews[activeReviewIndex].confidence} duration={60} />
                  </span>
                </div>
                <div class="grid grid-cols-[130px_1fr] gap-2 min-h-[32px] w-full items-center">
                  <span class="text-text-muted font-medium">
                    <TypingAnimation text="Status" duration={40} />
                  </span>
                  <span class="text-text-primary font-medium text-left">
                    <TypingAnimation text={mockReviews[activeReviewIndex].status} duration={50} />
                  </span>
                </div>
              </div>
            {/if}
          </div>
        </div>

      </div>

    {:else if activeStep === 2}
      <!-- SIMULATION 3: COMPETITOR WATCH -->
      <div transition:fade={{ duration: 150 }} class="col-start-1 row-start-1 relative z-10 flex flex-col justify-between h-full w-full">
        <div class="mb-8 text-center px-4">
          <h4 class="text-[15px] font-medium text-text-primary mb-2">Competitor Intelligence Logs</h4>
          <p class="text-[13px] text-text-secondary leading-relaxed mb-6">Input rival package to track rating discrepancies:</p>
        </div>
        <!-- Centered Avatar Circles Visual -->
        <div class="mt-4 mb-auto flex flex-col items-center justify-start h-[160px]">
          <div class="flex flex-col items-center justify-center h-full w-full gap-5">
            {#if isTracking}
              <!-- Avatar Circles during sync -->
              <div class="flex -space-x-4 mb-2">
                <div class="w-12 h-12 rounded-full border-[3px] border-bg-base bg-black shadow-sm z-[0] flex items-center justify-center">
                  <Apple class="w-7 h-7 text-white" />
                </div>
                <div class="w-12 h-12 rounded-full border-[3px] border-bg-base bg-white shadow-sm z-[1] flex items-center justify-center">
                  <Github class="w-7 h-7 text-black" />
                </div>
                <div class="w-12 h-12 rounded-full border-[3px] border-bg-base bg-white shadow-sm z-[2] flex items-center justify-center">
                  <Slack class="w-7 h-7" />
                </div>
                <div class="w-12 h-12 rounded-full border-[3px] border-bg-base bg-white shadow-sm z-[3] flex items-center justify-center">
                  <Figma class="w-7 h-7" />
                </div>
                <div class="w-12 h-12 rounded-full border-[3px] border-bg-base bg-[#0f172a] text-white flex items-center justify-center text-[12px] font-bold shadow-sm z-[4]">
                  +99
                </div>
              </div>
              <span class="text-[15px] font-medium bg-gradient-to-r from-text-faint via-text-primary to-text-faint bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer py-1 px-1">
                Syncing competitor network...
              </span>
            {:else}
              <div class="relative">
                <!-- Static Bell Icon -->
                <IconBell class="w-10 h-10 text-text-primary opacity-80" stroke={1.5} />
                <!-- Red Alert Number Icon -->
                {#if step3Toasts.length > 0}
                  <div transition:scale={{ start: 0, duration: 300, delay: 100 }} class="absolute -top-1 -right-1.5 w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-bg-surface flex items-center justify-center text-[10px] font-bold text-white z-10 shadow-sm">
                    {step3Toasts.length}
                  </div>
                {/if}
              </div>
              
              <!-- Custom Sonner-style Stack using Native Svelte -->
              <div class="relative w-full max-w-[260px] h-[80px] mt-1" style="perspective: 1000px;">
                {#each step3Toasts as toast, i (toast.id)}
                  <div 
                    transition:fly={{ y: 20, duration: 400 }}
                    class="absolute top-0 left-0 w-full bg-white border border-border-default rounded-xl p-3.5 flex items-center justify-center shadow-sm origin-top transition-all duration-500 ease-out text-center"
                    style="
                      z-index: {10 - i};
                      transform: translateY({i * 14}px) scale({1 - i * 0.05});
                      opacity: {1 - i * 0.25};
                    "
                  >
                    <div class="flex flex-col text-center flex-1 overflow-hidden justify-center items-center w-full">
                      <span class="text-[13px] font-medium text-text-primary tracking-tight truncate w-full">{toast.title}</span>
                      <span class="text-[12px] text-text-secondary mt-0.5 truncate w-full">{toast.desc}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>
