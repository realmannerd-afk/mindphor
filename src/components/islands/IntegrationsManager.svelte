<script lang="ts">
  import { onMount } from "svelte";

  export let plan: string = "starter";

  let keys: any[] = [];
  let webhooks: any[] = [];
  
  let newKeyName = "";
  let newWebhookPlatform = "slack";
  let newWebhookUrl = "";
  let newKeyResult: string | null = null;
  
  let loadingKeys = true;
  let loadingWebhooks = true;
  
  let errorMsgKeys = "";
  let errorMsgWebhooks = "";
  let isDropdownOpen = false;

  let confirmModal = {
    isOpen: false,
    title: "",
    description: "",
    actionLabel: "Confirm",
    onConfirm: () => {}
  };

  let infoModal = {
    isOpen: false,
    title: "",
    description: "",
    isError: false
  };

  async function loadKeys() {
    if (plan !== 'pro') {
      loadingKeys = false;
      return;
    }
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (res.ok) keys = data.keys;
    } catch (e) {
      console.error(e);
    } finally {
      loadingKeys = false;
    }
  }

  async function loadWebhooks() {
    if (plan !== 'pro' && plan !== 'growth') {
      loadingWebhooks = false;
      return;
    }
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      if (res.ok) webhooks = data.webhooks;
    } catch (e) {
      console.error(e);
    } finally {
      loadingWebhooks = false;
    }
  }

  onMount(() => {
    loadKeys();
    loadWebhooks();
  });

  async function createKey() {
    errorMsgKeys = "";
    newKeyResult = null;
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName })
    });
    const data = await res.json();
    if (res.ok) {
      newKeyResult = data.rawKey;
      newKeyName = "";
      loadKeys();
    } else {
      errorMsgKeys = data.error || "Failed to create key";
    }
  }

  async function revokeKey(id: string) {
    confirmModal = {
      isOpen: true,
      title: "Revoke API Key",
      description: "Are you sure you want to revoke this key? Any integrations using it will instantly break. This action cannot be undone.",
      actionLabel: "Revoke Key",
      onConfirm: async () => {
        const res = await fetch("/api/keys", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        if (res.ok) loadKeys();
        confirmModal.isOpen = false;
      }
    };
  }

  async function addWebhook() {
    errorMsgWebhooks = "";
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: newWebhookPlatform, webhook_url: newWebhookUrl })
    });
    if (res.ok) {
      newWebhookUrl = "";
      loadWebhooks();
    } else {
      const data = await res.json();
      errorMsgWebhooks = data.error || "Failed to add webhook";
    }
  }

  async function toggleWebhook(id: string, enabled: boolean) {
    await fetch("/api/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled })
    });
    loadWebhooks();
  }

  async function deleteWebhook(id: string) {
    confirmModal = {
      isOpen: true,
      title: "Delete Webhook",
      description: "Are you sure you want to remove this alert integration? You will no longer receive notifications.",
      actionLabel: "Delete Integration",
      onConfirm: async () => {
        await fetch("/api/webhooks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        loadWebhooks();
        confirmModal.isOpen = false;
      }
    };
  }

  async function testWebhook(webhook: any) {
    try {
      const btn = document.getElementById(`test-btn-${webhook.id}`);
      if (btn) btn.innerText = "Testing...";
      
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: webhook.id })
      });
      
      if (res.ok) {
        infoModal = {
          isOpen: true,
          title: "Test Sent Successfully",
          description: "A test alert payload has been fired to your <strong>webhook URL</strong>.<br><br>Please check your destination platform to verify the message arrived properly.",
          isError: false
        };
      } else {
        const data = await res.json();
        infoModal = {
          isOpen: true,
          title: "Test Failed",
          description: `The webhook test failed to send. Server responded with: ${data.error}`,
          isError: true
        };
      }
      if (btn) btn.innerText = "Test";
    } catch (e) {
      infoModal = {
        isOpen: true,
        title: "Test Failed",
        description: "An unexpected network error occurred while trying to send the test alert.",
        isError: true
      };
      const btn = document.getElementById(`test-btn-${webhook.id}`);
      if (btn) btn.innerText = "Test";
    }
  }
</script>

<div class="space-y-10">
  <!-- Webhooks -->
  <div>
    <div class="flex items-center gap-3 mb-1">
      <h3 class="text-[15px] font-medium text-text-primary">Alert Integrations</h3>
      {#if plan !== 'starter'}
        <span class="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold tracking-wide uppercase rounded">Enabled</span>
      {/if}
    </div>
    <p class="text-[13px] text-text-secondary mb-4">Send critical and warning alerts to Slack, Discord, or your custom webhooks.</p>
    
    {#if plan === 'starter'}
      <div class="bg-bg-surface border border-border-default rounded-[16px] p-6 flex items-center justify-between">
        <div>
          <h4 class="text-[14px] font-medium text-text-primary mb-1">Available on Growth & Pro</h4>
          <p class="text-[13px] text-text-secondary">Upgrade to connect your Slack and Discord channels.</p>
        </div>
        <a href="/dashboard/billing" class="h-[32px] px-4 bg-text-primary text-bg-base text-[13px] font-medium rounded-full hover:bg-text-secondary transition-colors inline-flex items-center justify-center">Upgrade</a>
      </div>
    {:else}
      {#if errorMsgWebhooks}
        <div class="bg-red-500/10 text-red-500 p-3 rounded-[12px] text-[13px] mb-4 border border-red-500/20">{errorMsgWebhooks}</div>
      {/if}

      <div class="bg-bg-surface border border-border-default rounded-[16px]">
        <div class="p-4 border-b border-border-default flex flex-col md:flex-row items-end gap-3 bg-bg-base/30">
          <div class="w-full md:w-auto shrink-0">
            <label class="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1.5">Platform</label>
            <div class="relative w-full md:w-[150px]">
              <button class="w-full appearance-none bg-bg-subtle border border-transparent rounded-md pl-4 pr-8 py-2 text-[13px] text-text-primary outline-none focus:bg-bg-muted hover:bg-bg-muted transition-all duration-200 cursor-pointer text-left flex items-center gap-2" on:click={() => isDropdownOpen = !isDropdownOpen}>
                {#if newWebhookPlatform === 'slack'}
                  <svg viewBox="0 0 2447.6 2452.5" class="w-4 h-4 shrink-0"><g clip-rule="evenodd" fill-rule="evenodd"><path d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z" fill="#36c5f0"/><path d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z" fill="#2eb67d"/><path d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z" fill="#ecb22e"/><path d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0" fill="#e01e5a"/></g></svg>
                  Slack
                {:else if newWebhookPlatform === 'discord'}
                  <svg viewBox="0 0 256 199" class="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" fill="#5865F2"/></svg>
                  Discord
                {:else}
                  <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  Custom
                {/if}
              </button>
              <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg class="w-3.5 h-3.5 text-text-secondary transition-transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>

              {#if isDropdownOpen}
                <div class="absolute z-50 top-full left-0 mt-1 w-full bg-bg-subtle border border-border-default rounded-md shadow-xl overflow-hidden py-1">
                  <button class="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-primary hover:bg-bg-base cursor-pointer text-left transition-colors" on:click={() => { newWebhookPlatform = 'slack'; isDropdownOpen = false; }}>
                    <svg viewBox="0 0 2447.6 2452.5" class="w-4 h-4 shrink-0"><g clip-rule="evenodd" fill-rule="evenodd"><path d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z" fill="#36c5f0"/><path d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z" fill="#2eb67d"/><path d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z" fill="#ecb22e"/><path d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0" fill="#e01e5a"/></g></svg>
                    Slack
                  </button>
                  <button class="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-primary hover:bg-bg-base cursor-pointer text-left transition-colors" on:click={() => { newWebhookPlatform = 'discord'; isDropdownOpen = false; }}>
                    <svg viewBox="0 0 256 199" class="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" fill="#5865F2"/></svg>
                    Discord
                  </button>
                  {#if plan === 'pro'}
                  <button class="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-primary hover:bg-bg-base cursor-pointer text-left transition-colors" on:click={() => { newWebhookPlatform = 'custom'; isDropdownOpen = false; }}>
                    <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    Custom
                  </button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
          <div class="flex-1 w-full">
            <label class="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1.5">Webhook URL</label>
            <input bind:value={newWebhookUrl} type="url" placeholder="https://..." class="w-full bg-bg-subtle border border-transparent rounded-md px-3 py-2 text-[13px] text-text-primary outline-none focus:bg-bg-muted hover:bg-bg-muted transition-all duration-200" />
          </div>
          <button on:click={addWebhook} class="w-full md:w-auto h-[36px] px-5 bg-text-primary text-bg-base text-[13px] font-medium rounded-full hover:bg-text-secondary transition-colors whitespace-nowrap cursor-pointer">
            Add
          </button>
        </div>

        {#if loadingWebhooks}
          <div class="p-6 text-center text-[13px] text-text-secondary">Loading...</div>
        {:else if webhooks.length === 0}
          <div class="p-6 text-center text-[13px] text-text-secondary">No integrations set up.</div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-default text-[11px] text-text-secondary uppercase tracking-wider bg-bg-subtle/50">
                  <th class="px-4 py-3 font-medium">Platform</th>
                  <th class="px-4 py-3 font-medium hidden sm:table-cell">URL</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each webhooks as wh}
                  <tr class="border-b border-border-faint last:border-none">
                    <td class="px-4 py-3 text-[13px] text-text-primary font-medium flex items-center gap-2">
                      {#if wh.platform === 'slack'}
                        <svg viewBox="0 0 2447.6 2452.5" class="w-4 h-4 shrink-0"><g clip-rule="evenodd" fill-rule="evenodd"><path d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z" fill="#36c5f0"/><path d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z" fill="#2eb67d"/><path d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z" fill="#ecb22e"/><path d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0" fill="#e01e5a"/></g></svg>
                        Slack
                      {:else if wh.platform === 'discord'}
                        <svg viewBox="0 0 256 199" class="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" fill="#5865F2"/></svg>
                        Discord
                      {:else}
                        <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                        Custom
                      {/if}
                    </td>
                    <td class="px-4 py-3 text-[13px] text-text-secondary truncate max-w-[200px] hidden sm:table-cell">{wh.webhook_url}</td>
                    <td class="px-4 py-3">
                      <button on:click={() => toggleWebhook(wh.id, wh.enabled)} class="w-8 h-4 rounded-full relative transition-colors cursor-pointer {wh.enabled ? 'bg-text-primary' : 'bg-border-strong'}">
                        <div class="absolute top-[2px] left-[2px] w-3 h-3 bg-bg-base rounded-full transition-transform {wh.enabled ? 'translate-x-4' : ''}"></div>
                      </button>
                    </td>
                    <td class="px-4 py-3 text-right space-x-3">
                      <button id="test-btn-{wh.id}" on:click={() => testWebhook(wh)} disabled={!wh.enabled} class="inline-block min-w-[55px] text-center text-[12px] {wh.enabled ? 'text-text-secondary hover:text-text-primary cursor-pointer' : 'text-text-muted opacity-50 cursor-not-allowed'} transition-colors">Test</button>
                      <button on:click={() => deleteWebhook(wh.id)} class="text-[12px] text-red-500 hover:text-red-400 cursor-pointer">Delete</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- API Keys -->
  <div>
    <div class="flex items-center gap-3 mb-1">
      <h3 class="text-[15px] font-medium text-text-primary">API Keys</h3>
      {#if plan === 'pro'}
        <span class="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold tracking-wide uppercase rounded">Enabled</span>
      {/if}
    </div>
    <p class="text-[13px] text-text-secondary mb-4">Generate keys to programmatically access your data via the v1 API.</p>
    
    {#if plan !== 'pro'}
      <div class="bg-bg-surface border border-border-default rounded-[16px] p-6 flex items-center justify-between">
        <div>
          <h4 class="text-[14px] font-medium text-text-primary mb-1">Available on Pro</h4>
          <p class="text-[13px] text-text-secondary">Upgrade to generate API keys and build custom integrations.</p>
        </div>
        <a href="/dashboard/billing" class="h-[32px] px-4 bg-text-primary text-bg-base text-[13px] font-medium rounded-full hover:bg-text-secondary transition-colors inline-flex items-center justify-center">Upgrade</a>
      </div>
    {:else}
      {#if errorMsgKeys}
        <div class="bg-red-500/10 text-red-500 p-3 rounded-[12px] text-[13px] mb-4 border border-red-500/20">{errorMsgKeys}</div>
      {/if}

      {#if newKeyResult}
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div class="bg-bg-base border border-border-default rounded-[16px] p-6 w-[440px] shadow-2xl relative">
            <h3 class="text-[16px] font-medium text-text-primary mb-2">API Key Generated</h3>
            <p class="text-[13px] text-text-secondary mb-5">Please copy this key now. For security reasons, you won't be able to see it again.</p>
            
            <div class="relative mb-6">
              <input type="text" readonly value={newKeyResult} class="w-full bg-bg-subtle border border-border-default rounded-[8px] pl-3 pr-10 py-2.5 text-[13px] text-text-primary font-mono focus:outline-none selection:bg-text-primary selection:text-bg-base" />
              <button on:click={(e) => { 
                navigator.clipboard.writeText(newKeyResult as string);
                const svg = e.currentTarget.querySelector('svg');
                if (svg) {
                  const originalPath = svg.innerHTML;
                  svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>`;
                  svg.classList.add('text-green-500');
                  setTimeout(() => { 
                    svg.innerHTML = originalPath; 
                    svg.classList.remove('text-green-500');
                  }, 2000);
                }
              }} class="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded-md hover:bg-border-faint">
                <svg class="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
            </div>
            
            <div class="flex justify-end">
              <button on:click={() => newKeyResult = null} class="px-5 py-2 bg-text-primary text-bg-base text-[13px] font-medium rounded-full hover:opacity-90 transition-opacity cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      {/if}

      <div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden">
        <div class="p-4 border-b border-border-default flex flex-col sm:flex-row items-end gap-3 bg-bg-base/30">
          <div class="flex-1 w-full">
            <label class="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1.5">Key Name</label>
            <input bind:value={newKeyName} type="text" placeholder="e.g. Zapier Integration" class="w-full bg-bg-subtle border border-transparent rounded-md px-3 py-2 text-[13px] text-text-primary outline-none focus:bg-bg-muted hover:bg-bg-muted transition-all duration-200" />
          </div>
          <button on:click={createKey} disabled={!newKeyName.trim()} class="w-full sm:w-auto h-[36px] px-5 bg-text-primary text-bg-base text-[13px] font-medium rounded-full hover:bg-text-secondary transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            Generate Key
          </button>
        </div>

        {#if loadingKeys}
          <div class="p-6 text-center text-[13px] text-text-secondary">Loading...</div>
        {:else if keys.length === 0}
          <div class="p-6 text-center text-[13px] text-text-secondary">No API keys generated.</div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-default text-[11px] text-text-secondary uppercase tracking-wider bg-bg-subtle/50">
                  <th class="px-4 py-3 font-medium">Name</th>
                  <th class="px-4 py-3 font-medium">Prefix</th>
                  <th class="px-4 py-3 font-medium hidden sm:table-cell">Created</th>
                  <th class="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each keys as key}
                  <tr class="border-b border-border-faint last:border-none {key.revoked ? 'opacity-50 bg-bg-subtle/50' : ''}">
                    <td class="px-4 py-3 text-[13px] text-text-primary">{key.name || 'Default Key'}</td>
                    <td class="px-4 py-3 text-[13px] text-text-secondary font-mono bg-bg-base/50 rounded inline-block my-2 px-1.5">{key.key_prefix}•••••</td>
                    <td class="px-4 py-3 text-[13px] text-text-secondary hidden sm:table-cell">{new Date(key.created_at).toLocaleDateString()}</td>
                    <td class="px-4 py-3 text-right">
                      {#if !key.revoked}
                        <button on:click={() => revokeKey(key.id)} class="text-[12px] text-red-500 hover:text-red-400 cursor-pointer">Revoke</button>
                      {:else}
                        <span class="text-[11px] text-text-muted uppercase tracking-wider font-medium">Revoked</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

{#if infoModal.isOpen}
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-bg-base border border-border-default rounded-[16px] p-6 w-[400px] shadow-2xl relative">
      <div class="flex items-center gap-3 mb-2">
        {#if infoModal.isError}
          <div class="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
        {:else}
          <div class="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
        {/if}
        <h3 class="text-[16px] font-medium text-text-primary">{infoModal.title}</h3>
      </div>
      
      <p class="text-[13px] text-text-secondary mb-6 pl-11 leading-relaxed">{@html infoModal.description}</p>
      
      <div class="flex justify-end">
        <button on:click={() => infoModal.isOpen = false} class="px-5 py-2 bg-text-primary text-bg-base text-[13px] font-medium rounded-full hover:opacity-90 transition-opacity cursor-pointer">
          Done
        </button>
      </div>
    </div>
  </div>
{/if}
      </div>
    {/if}
  </div>
</div>

{#if confirmModal.isOpen}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-bg-base border border-border-default rounded-[16px] p-6 w-[400px] shadow-2xl relative">
      <h3 class="text-[16px] font-medium text-text-primary mb-2">{confirmModal.title}</h3>
      <p class="text-[13px] text-text-secondary mb-6">{confirmModal.description}</p>
      
      <div class="flex justify-end gap-3">
        <button on:click={() => confirmModal.isOpen = false} class="px-5 py-2 border border-border-default text-text-secondary text-[13px] font-medium rounded-full hover:bg-bg-subtle hover:text-text-primary transition-colors cursor-pointer">
          Cancel
        </button>
        <button on:click={confirmModal.onConfirm} class="px-5 py-2 bg-red-500 text-white text-[13px] font-medium rounded-full hover:bg-red-600 transition-colors cursor-pointer shadow-sm shadow-red-500/20">
          {confirmModal.actionLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
