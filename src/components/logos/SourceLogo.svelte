<script lang="ts">
  import { resolvePlatformDomain } from '../../lib/logos/LogoUtils';
  import CompanyLogo from './CompanyLogo.svelte';

  let {
    platform,
    size = 'md',
    shape = 'rounded',
    class: className = ''
  }: {
    platform: string;
    size?: 'sm' | 'md' | 'lg';
    shape?: 'rounded' | 'square';
    class?: string;
  } = $props();

  const domain = $derived(resolvePlatformDomain(platform));
  const friendlyName = $derived(platform.replace(/[\s-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
</script>

<CompanyLogo
  {domain}
  name={friendlyName}
  {size}
  {shape}
  class={className}
/>
