<script lang="ts">
  import { onMount } from 'svelte';
  
  export let app: any;
  export let fallbackUrl: string;
  export let className: string = '';

  let iconUrl = fallbackUrl;

  onMount(async () => {
    if (app && app.play_store_url) {
      const cacheKey = `app_icon_${app.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        iconUrl = cached;
      } else {
        try {
          const res = await fetch(`/api/apps/playstore-info?url=${encodeURIComponent(app.play_store_url)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.icon) {
              iconUrl = data.icon;
              localStorage.setItem(cacheKey, data.icon);
            }
          }
        } catch (e) {
          console.error("Failed to fetch app icon", e);
        }
      }
    }
  });
</script>

<img src={iconUrl} alt={app ? app.name : 'App'} class={className} />
