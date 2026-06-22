<script lang="ts">
  import { LogoService } from '../../lib/logos/LogoService';
  import { getInitials, getBrandColor } from '../../lib/logos/LogoUtils';

  let {
    domain,
    name = '',
    size = 'md',
    shape = 'rounded',
    class: className = ''
  }: {
    domain: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    shape?: 'rounded' | 'square';
    class?: string;
  } = $props();

  let isLoading = $state(true);
  let isError = $state(false);

  // Map size classes
  const sizeMap = {
    sm: { box: 'w-6 h-6 text-xs', px: 24 },
    md: { box: 'w-10 h-10 text-sm font-semibold', px: 64 },
    lg: { box: 'w-16 h-16 text-lg font-bold', px: 128 }
  };

  const currentSize = $derived(sizeMap[size] || sizeMap.md);
  
  // Resolve Logo URL
  const logoUrl = $derived(domain ? LogoService.getLogoUrl(domain, currentSize.px) : '');
  
  // Fallback properties
  const initials = $derived(getInitials(name || domain || '?'));
  const fallbackBg = $derived(getBrandColor(name || domain || '?'));

  // Handle onload and onerror
  function handleLoad() {
    isLoading = false;
  }

  function handleError() {
    isError = true;
    isLoading = false;
  }
</script>

<div 
  class="relative flex-shrink-0 flex items-center justify-center select-none overflow-hidden border border-border-default bg-bg-subtle {currentSize.box} {shape === 'rounded' ? 'rounded-full' : 'rounded-lg'} {className}"
  title={name || domain}
>
  <!-- Loading skeleton -->
  {#if isLoading && !isError && logoUrl}
    <div class="absolute inset-0 bg-border-faint animate-pulse"></div>
  {/if}

  <!-- Actual Image -->
  {#if logoUrl && !isError}
    <img
      src={logoUrl}
      alt={name || domain}
      loading="lazy"
      class="w-full h-full object-cover transition-opacity duration-200 {isLoading ? 'opacity-0' : 'opacity-100'}"
      onload={handleLoad}
      onerror={handleError}
    />
  {:else}
    <!-- Initials Fallback -->
    <div 
      class="w-full h-full flex items-center justify-center text-white font-medium"
      style="background-color: {fallbackBg};"
    >
      {initials}
    </div>
  {/if}
</div>
