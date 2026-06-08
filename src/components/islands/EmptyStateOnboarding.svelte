<script lang="ts">
  export let apiKey: string;
  export let projectId: string;

  let copied = false;
  let snippetCopied = false;
  let activeTab = 'curl'; // 'curl', 'node', 'python'

  let tabs = [
    { id: 'curl', label: 'cURL' },
    { id: 'node', label: 'Node.js' },
    { id: 'python', label: 'Python' }
  ];
  let tabElements: HTMLButtonElement[] = [];
  let sliderStyle = '';

  $: {
    const index = tabs.findIndex(t => t.id === activeTab);
    const el = tabElements[index];
    if (el) {
      sliderStyle = `left: ${el.offsetLeft}px; width: ${el.offsetWidth}px;`;
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(apiKey);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function skipOnboarding() {
    document.cookie = "skipped_onboarding=true; path=/; max-age=31536000";
    window.location.reload();
  }

  $: curlSnippet = `curl -X POST http://localhost:4321/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${apiKey}",
    "input": "What is the capital of France?",
    "output": "The capital of France is Paris.",
    "model": "gpt-4o",
    "user_id": "user_123",
    "latency_ms": 450
  }'`;

  $: nodeSnippet = `const response = await fetch("http://localhost:4321/api/ingest", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: "${apiKey}",
    input: "What is the capital of France?",
    output: "The capital of France is Paris.",
    model: "gpt-4o",
    user_id: "user_123",
    latency_ms: 450
  })
});

const data = await response.json();
console.log(data);`;

  $: pythonSnippet = `import requests

response = requests.post(
    "http://localhost:4321/api/ingest",
    json={
        "api_key": "${apiKey}",
        "input": "What is the capital of France?",
        "output": "The capital of France is Paris.",
        "model": "gpt-4o",
        "user_id": "user_123",
        "latency_ms": 450
    }
)

print(response.json())`;

  function copyCodeSnippet() {
    const textToCopy = activeTab === 'curl' ? curlSnippet : (activeTab === 'node' ? nodeSnippet : pythonSnippet);
    navigator.clipboard.writeText(textToCopy);
    snippetCopied = true;
    setTimeout(() => snippetCopied = false, 2000);
  }
</script>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #121212;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333333;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #444444;
  }
</style>

<div class="max-w-4xl mx-auto mt-2 px-6">
  <!-- Top: What is this? -->
  <div class="mb-6 text-center">
    <div class="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
    </div>
    
    <h1 class="text-[28px] font-medium text-text-primary tracking-tight mb-2">Integrate Mindphor</h1>
    <p class="text-[15px] leading-relaxed text-text-secondary max-w-2xl mx-auto mb-5">
      Mindphor acts as the observation and evaluation layer for your AI. To get started, you just need to send your first generation trace to our ingestion API. We'll automatically evaluate it and populate your dashboard.
    </p>

    <!-- API Key Display -->
    <div class="max-w-md mx-auto bg-bg-surface border border-border-default rounded-xl p-3 flex items-center justify-between gap-4">
      <div class="text-left overflow-hidden">
        <div class="text-[11px] uppercase tracking-wider text-text-muted mb-0.5 font-medium">Your API Key</div>
        <div class="font-mono text-[14px] text-text-primary truncate">{apiKey}</div>
      </div>
      <button 
        on:click={copyKey}
        class="shrink-0 px-4 py-1.5 bg-bg-elevated border border-border-default hover:bg-bg-subtle text-text-primary text-[12px] rounded-lg transition-colors font-medium cursor-pointer"
      >
        {copied ? 'Copied!' : 'Copy Key'}
      </button>
    </div>
  </div>

  <!-- Bottom: Platform Tabs -->
  <div class="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
    <div class="relative flex border-b border-border-faint px-2 pt-2 bg-bg-elevated">
      {#each tabs as tab, i}
        <button 
          bind:this={tabElements[i]}
          on:click={() => activeTab = tab.id}
          class={`px-4 py-2 text-[12px] font-medium border-b-2 border-transparent transition-colors ${activeTab === tab.id ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
        >
          {tab.label}
        </button>
      {/each}
      <div 
        class="absolute bottom-[-1px] h-[2px] bg-accent transition-all duration-300 ease-out"
        style={sliderStyle}
      ></div>
    </div>

    <div class="relative p-4 bg-[#121212]">
      <!-- Code Snippet Copy Button -->
      <button 
        on:click={copyCodeSnippet}
        class="absolute top-4 right-4 z-10 px-2 py-1.5 rounded-md bg-[#2A2A2A] hover:bg-[#3A3A3A] text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 border border-[#333333] cursor-pointer"
        title="Copy code snippet"
      >
        {#if snippetCopied}
          <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span class="text-[11px] font-medium text-emerald-400">Copied</span>
        {:else}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          <span class="text-[11px] font-medium">Copy</span>
        {/if}
      </button>

      {#if activeTab === 'curl'}
        <div class="text-[#D4D4D4] font-mono text-[13px] overflow-x-auto whitespace-pre leading-relaxed custom-scrollbar pb-2 pr-24">
<span class="text-emerald-400">curl</span> -X POST http://localhost:4321/api/ingest \
  -H <span class="text-amber-300">"Content-Type: application/json"</span> \
  -d <span class="text-amber-300">{`'{
    "api_key": "${apiKey}",
    "input": "What is the capital of France?",
    "output": "The capital of France is Paris.",
    "model": "gpt-4o",
    "user_id": "user_123",
    "latency_ms": 450
  }'`}</span>
        </div>
      {:else if activeTab === 'node'}
        <div class="text-[#D4D4D4] font-mono text-[13px] overflow-x-auto whitespace-pre leading-relaxed custom-scrollbar pb-2 pr-24">
<span class="text-[#569CD6]">const</span> response = <span class="text-[#C586C0]">await</span> <span class="text-emerald-400">fetch</span>(<span class="text-amber-300">"http://localhost:4321/api/ingest"</span>, &lbrace;
  method: <span class="text-amber-300">"POST"</span>,
  headers: &lbrace; <span class="text-amber-300">"Content-Type"</span>: <span class="text-amber-300">"application/json"</span> &rbrace;,
  body: JSON.stringify(&lbrace;
    api_key: <span class="text-amber-300">{`"${apiKey}"`}</span>,
    input: <span class="text-amber-300">"What is the capital of France?"</span>,
    output: <span class="text-amber-300">"The capital of France is Paris."</span>,
    model: <span class="text-amber-300">"gpt-4o"</span>,
    user_id: <span class="text-amber-300">"user_123"</span>,
    latency_ms: <span class="text-[#B5CEA8]">450</span>
  &rbrace;)
&rbrace;);

<span class="text-[#569CD6]">const</span> data = <span class="text-[#C586C0]">await</span> response.json();
console.log(data);
        </div>
      {:else if activeTab === 'python'}
        <div class="text-[#D4D4D4] font-mono text-[13px] overflow-x-auto whitespace-pre leading-relaxed custom-scrollbar pb-2 pr-24">
<span class="text-[#C586C0]">import</span> requests

response = requests.post(
    <span class="text-amber-300">"http://localhost:4321/api/ingest"</span>,
    json=&lbrace;
        <span class="text-amber-300">"api_key"</span>: <span class="text-amber-300">{`"${apiKey}"`}</span>,
        <span class="text-amber-300">"input"</span>: <span class="text-amber-300">"What is the capital of France?"</span>,
        <span class="text-amber-300">"output"</span>: <span class="text-amber-300">"The capital of France is Paris."</span>,
        <span class="text-amber-300">"model"</span>: <span class="text-amber-300">"gpt-4o"</span>,
        <span class="text-amber-300">"user_id"</span>: <span class="text-amber-300">"user_123"</span>,
        <span class="text-amber-300">"latency_ms"</span>: <span class="text-[#B5CEA8]">450</span>
    &rbrace;
)

<span class="text-[#DCDCAA]">print</span>(response.json())
        </div>
      {/if}
    </div>
  </div>

  <!-- Skip Button -->
  <div class="mt-8 text-center">
    <button on:click={skipOnboarding} class="text-text-muted hover:text-text-primary text-[13px] underline transition-colors cursor-pointer">
      Skip for now and go to dashboard
    </button>
  </div>
</div>
