<script lang="ts">
  import { resolveCompetitorDomain } from '../../lib/logos/LogoUtils';
  import CompanyLogo from './CompanyLogo.svelte';

  let {
    name,
    size = 'md',
    shape = 'square',
    class: className = ''
  }: {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    shape?: 'rounded' | 'square';
    class?: string;
  } = $props();

  const domain = $derived(resolveCompetitorDomain(name));
</script>

<CompanyLogo
  {domain}
  {name}
  {size}
  {shape}
  class={className}
/>
