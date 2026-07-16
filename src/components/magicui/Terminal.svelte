<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  export let rawText: string = "";
  export let isAnalyzing: boolean = false;
  export let showAnalysisResult: boolean = false;
  export let category: string = "";
  export let sentiment: string = "";
  export let score: string = "";
  export let colorClass: string = "text-emerald-400";

  let typedCommand = "";
  const fullCommand = "echo $RAW_REVIEW | lumina-ai analyze --format json";
  let isTyping = true;
  
  $: if (isAnalyzing) {
    // Reset typing state when analysis starts again
    typedCommand = "";
    isTyping = true;
    typeCommand();
  }

  function typeCommand() {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullCommand.length) {
        typedCommand += fullCommand.charAt(i);
        i++;
      } else {
        clearInterval(interval);
        isTyping = false;
      }
    }, 40);
  }
  
  onMount(() => {
    typeCommand();
  });
</script>

<div class="relative w-full rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono text-[13px] min-h-[350px]">
  <!-- Cult UI Background Gradient -->
  <div class="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-fuchsia-600/30 to-indigo-950 pointer-events-none"></div>

  <!-- Terminal Window -->
  <div class="relative flex flex-col h-full bg-[#09090b]/80 backdrop-blur-sm mt-8 border-t border-white/10 rounded-t-xl flex-1">
    <div class="flex-1 px-6 py-6 sm:px-10 sm:py-8 overflow-y-auto">
      
      <!-- Command Line -->
      <div class="text-white/80">
        <span class="text-white">{typedCommand}</span>
        {#if isTyping}
          <span class="ml-0.5 inline-block h-[15px] w-[7px] translate-y-[2px] animate-pulse bg-white/70"></span>
        {/if}
      </div>

      <!-- Review Text Output -->
      {#if !isTyping}
        <div class="text-white/60 mt-4 mb-4" transition:fade>
          {rawText}
        </div>
      {/if}

      <!-- Analysis Process -->
      {#if isAnalyzing && !isTyping}
        <div class="text-[#b39aff] mt-4" transition:fade>
          Running inference model...
        </div>
      {:else if showAnalysisResult}
        <div class="text-[#b39aff] mt-4" transition:fade>
          ✓ Analysis complete in 241ms
        </div>
        
        <!-- Cult UI style line-by-line output rendering -->
        <div class="mt-4 text-[#a8b2d1]" transition:fade={{ duration: 400 }}>
          <span class="text-[#89ddff]">&#123;</span><br/>
          &nbsp;&nbsp;<span class="text-[#82aaff]">"category"</span>: <span class="{colorClass}">"{category}"</span>,<br/>
          &nbsp;&nbsp;<span class="text-[#82aaff]">"sentiment"</span>: <span class="{colorClass}">"{sentiment}"</span>,<br/>
          &nbsp;&nbsp;<span class="text-[#82aaff]">"confidence"</span>: <span class="text-[#f78c6c]">{score}</span><br/>
          <span class="text-[#89ddff]">&#125;</span>
        </div>

        <!-- Trailing Prompt -->
        <div class="mt-6" transition:fade>
          <span class="ml-0.5 inline-block h-[15px] w-[7px] translate-y-[2px] animate-pulse bg-white/70"></span>
        </div>
      {/if}
    </div>
  </div>
</div>
