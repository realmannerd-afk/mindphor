<script lang="ts">
  export let content: string;
  
  let translatedContent = "";
  let isTranslating = false;
  let currentLanguage = 'en';

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' }
  ];

  async function translate() {
    if (!content) return;
    
    isTranslating = true;
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${currentLanguage}&dt=t&q=${encodeURIComponent(content)}`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json && json[0]) {
        translatedContent = json[0].map((x: any) => x[0]).join('');
      } else {
        translatedContent = "Translation failed. Please try again.";
      }
    } catch (e) {
      console.error("Translation error:", e);
      translatedContent = "Translation service unavailable.";
    }
    isTranslating = false;
  }
</script>

<div class="flex flex-col gap-4">
  <div class="text-[18px] md:text-[20px] leading-[1.6] text-text-primary font-medium">
    &quot;{translatedContent || content}&quot;
  </div>
  
  <div class="flex flex-wrap items-center gap-3 mt-2">
    <select bind:value={currentLanguage} class="text-[12px] bg-bg-surface border border-border-default text-text-primary rounded-full px-3 py-1.5 font-medium hover:border-border-strong hover:bg-bg-subtle focus:outline-none transition-all cursor-pointer appearance-none pr-7 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%23AAA9A5%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center] bg-[length:14px]">
      {#each languages as lang}
        <option value={lang.code}>{lang.name}</option>
      {/each}
    </select>
    
    <button on:click={translate} disabled={isTranslating} class="text-[12px] font-semibold bg-bg-surface border border-border-default text-text-primary px-3 py-1.5 rounded-full hover:bg-bg-subtle hover:border-border-strong transition-colors flex items-center gap-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
      {#if isTranslating}
        <svg class="animate-spin h-3.5 w-3.5 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Translating...
      {:else}
        <svg class="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
        Translate
      {/if}
    </button>
    
    {#if translatedContent}
      <button on:click={() => translatedContent = ""} class="text-[12px] font-medium text-text-muted hover:text-text-primary px-2 transition-colors focus:outline-none">
        Show Original
      </button>
    {/if}
  </div>
</div>
