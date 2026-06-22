<script lang="ts">
  import { LogoService } from '../../lib/logos/LogoService';
  export let domain: string;
  export let alt: string = '';
  export let title: string = '';
  export let className: string = 'w-5 h-5 object-contain';

  $: urls = LogoService.getLogoUrls(domain);
  let currentIdx = 0;

  function handleError(e: Event) {
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

<span class={`logo-container ${domain?.toLowerCase().trim() === 'twitter' || domain?.toLowerCase().trim() === 'x' ? 'scale-75' : ''}`} data-domain={domain?.toLowerCase().trim()}>
  <img 
    src={urls[currentIdx]} 
    {alt} 
    title={title || alt}
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
