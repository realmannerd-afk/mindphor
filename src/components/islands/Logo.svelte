<script lang="ts">
  import { LogoService } from '../../lib/logos/LogoService';
  export let domain: string;
  export let alt: string = '';
  export let title: string = '';
  export let className: string = 'w-5 h-5 object-contain';

  $: urls = LogoService.getLogoUrls(domain);
  let currentIdx = 0;

  $: {
    if (domain === 'Google Play' || domain === 'playstore' || domain === 'google_play') {
      console.log('Logo.svelte rendering:', domain, urls);
    }
  }

  function handleError(e: Event) {
    if (domain === 'Google Play' || domain === 'playstore' || domain === 'google_play') {
      console.error('Logo failed to load:', urls[currentIdx]);
    }
    if (currentIdx < urls.length - 1) {
      currentIdx++;
    } else {
      (e.currentTarget as HTMLImageElement).style.display = 'none';
    }
  }

  // Reset index if domain changes
  $: {
    domain;
    currentIdx = 0;
  }
</script>

<span class="logo-container w-full h-full" data-domain={domain?.toLowerCase().trim()}>
  <img 
    src={urls[currentIdx]} 
    {alt} 
    class={className} 
    onerror={handleError} 
  />
</span>

<style>
  .logo-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
