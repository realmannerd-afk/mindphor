<script lang="ts">
  export let appId: string;

  let playConsoleJson = '';
  let appleIssuerId = '';
  let appleKeyId = '';
  let applePrivateKey = '';
  
  let isSaving = false;
  let saveMessage = '';
  let saveError = '';

  async function saveCredentials() {
    isSaving = true;
    saveMessage = '';
    saveError = '';

    try {
      let parsedJson;
      if (playConsoleJson) {
        try {
          parsedJson = JSON.parse(playConsoleJson);
        } catch (e) {
          saveError = "Invalid JSON in Google Play Service Account";
          isSaving = false;
          return;
        }
      }

      const payload = {
        app_id: appId,
        play_console_json: parsedJson,
        apple_issuer_id: appleIssuerId || undefined,
        apple_key_id: appleKeyId || undefined,
        apple_private_key: applePrivateKey || undefined
      };

      const res = await fetch('/api/apps/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        saveMessage = 'Credentials saved successfully!';
        playConsoleJson = '';
        applePrivateKey = '';
        appleIssuerId = '';
        appleKeyId = '';
      } else {
        const err = await res.json();
        saveError = err.error || 'Failed to save credentials';
      }
    } catch (e) {
      saveError = 'An unexpected error occurred';
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden flex flex-col">
  <div class="px-5 py-4 border-b border-border-default">
    <h3 class="text-[14px] font-medium text-text-primary">Developer API Credentials</h3>
    <p class="text-[13px] text-text-secondary mt-1">Configure your API keys to enable Mindphor to reply to reviews directly on your behalf.</p>
  </div>
  
  <div class="p-6 space-y-6">
    <!-- Google Play -->
    <div>
      <h4 class="text-[13px] font-semibold text-text-primary mb-2 flex items-center gap-2">
        <svg class="w-4 h-4 text-[#3DDC84]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.3414C17.523 15.3414 16.0375 14.129 13.914 12.8718L10.3705 16.4278L16.2736 19.8242C16.897 20.1797 17.523 19.8665 17.523 19.8665V15.3414Z"/><path d="M2.3862 4.4578C2.1706 4.7077 2.0527 5.068 2.0527 5.5036V18.7397C2.0527 19.1729 2.1673 19.5316 2.3787 19.7828L10.0219 12.1121L2.3862 4.4578Z"/><path d="M16.2731 4.4172L10.3705 7.8142L13.9135 11.3701C16.0375 10.1124 17.5225 8.9004 17.5225 8.9004V4.3753C17.5225 4.3753 16.897 4.0622 16.2731 4.4172Z"/><path d="M10.0216 12.112L2.7303 4.7953C3.0786 4.5029 3.5936 4.413 4.1953 4.757L10.0216 8.165L10.0216 12.112Z"/></svg>
        Google Play Console
      </h4>
      <p class="text-[12px] text-text-secondary mb-3">Paste the contents of your Google Cloud Service Account JSON file with `androidpublisher` API access.</p>
      <textarea bind:value={playConsoleJson} placeholder="Paste your Service Account JSON here..." class="w-full h-32 bg-bg-base border border-border-default rounded-lg p-3 text-[12px] font-mono text-text-primary focus:outline-none focus:border-border-strong"></textarea>
    </div>

    <!-- Apple App Store -->
    <div class="pt-4 border-t border-border-faint">
      <h4 class="text-[13px] font-semibold text-text-primary mb-2 flex items-center gap-2">
        <svg class="w-4 h-4 text-text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 2.6.09 4.13 1.25 4.67 1.63-2.92 1.67-2.4 5.45.31 6.53-.78 1.95-1.99 3.96-3.65 4.77zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.38-1.92 4.42-3.74 4.25z"/></svg>
        Apple App Store Connect
      </h4>
      <p class="text-[12px] text-text-secondary mb-3">Create an API Key in App Store Connect with 'Customer Support' role.</p>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-[11px] font-medium text-text-muted mb-1">Issuer ID</label>
          <input bind:value={appleIssuerId} type="text" placeholder="e.g. 69a6de7a-..." class="w-full bg-bg-base border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong" />
        </div>
        <div>
          <label class="block text-[11px] font-medium text-text-muted mb-1">Key ID</label>
          <input bind:value={appleKeyId} type="text" placeholder="e.g. 2BXXXXXXXT" class="w-full bg-bg-base border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-strong" />
        </div>
      </div>
      <div>
        <label class="block text-[11px] font-medium text-text-muted mb-1">Private Key (.p8 file contents)</label>
        <textarea bind:value={applePrivateKey} placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" class="w-full h-32 bg-bg-base border border-border-default rounded-lg p-3 text-[12px] font-mono text-text-primary focus:outline-none focus:border-border-strong"></textarea>
      </div>
    </div>

    <!-- Actions -->
    <div class="pt-4 flex items-center justify-between border-t border-border-faint">
      <div class="flex items-center gap-3">
        {#if saveMessage}
          <span class="text-[12px] font-medium text-emerald-500">{saveMessage}</span>
        {/if}
        {#if saveError}
          <span class="text-[12px] font-medium text-red-500">{saveError}</span>
        {/if}
      </div>
      <button 
        onclick={saveCredentials}
        disabled={isSaving}
        class="px-5 py-2 rounded-full bg-text-primary text-bg-base text-[13px] font-medium hover:bg-text-secondary transition-colors disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save API Keys'}
      </button>
    </div>
  </div>
</div>
