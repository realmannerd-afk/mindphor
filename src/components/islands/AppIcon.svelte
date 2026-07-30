<script lang="ts">
  import { onMount } from 'svelte';
  
  export let app: any;
  export let fallbackUrl: string;
  export let className: string = '';

  let iconUrl = fallbackUrl;

  onMount(async () => {
    let targetUrl = app?.play_store_url;
    let storeType = 'playstore';
    
    if (!targetUrl && app?.app_store_url) {
      targetUrl = app.app_store_url;
      storeType = 'appstore';
    }
    
    if (app && targetUrl) {
      if (targetUrl.includes('swiftbite')) {
        iconUrl = fallbackUrl;
        return;
      }

      const cacheKey = `app_icon_${app.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        iconUrl = cached;
      } else {
        try {
          const endpoint = storeType === 'playstore' ? '/api/apps/playstore-info' : '/api/apps/appstore-info';
          const res = await fetch(`${endpoint}?url=${encodeURIComponent(targetUrl)}`);
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

<img src={iconUrl} alt={app ? app.name : 'App'} class={className} on:error={() => { iconUrl = fallbackUrl; }} />
