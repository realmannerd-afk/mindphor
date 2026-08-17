<script lang="ts">
  import { onMount } from 'svelte';

  export let feedbackId: string;
  export let existingReply: string = '';
  
  let replyText = existingReply;
  let isSubmitting = false;
  let successMessage = '';
  let errorMessage = '';

  async function submitReply() {
    if (!replyText.trim()) return;
    
    isSubmitting = true;
    successMessage = '';
    errorMessage = '';

    try {
      const res = await fetch('/api/feedback/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId, reply_text: replyText })
      });

      if (res.ok) {
        successMessage = "Reply posted successfully!";
      } else {
        const errorData = await res.json().catch(() => ({}));
        errorMessage = errorData.error || "Failed to post reply. Please try again.";
      }
    } catch (e) {
      errorMessage = "An error occurred.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="bg-bg-surface border border-border-default rounded-[16px] p-6 flex flex-col">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
      <svg class="w-4 h-4 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
      Developer Reply
    </h3>
    {#if successMessage}
      <span class="text-[11px] font-medium text-emerald-500 animate-fade-in">{successMessage}</span>
    {/if}
    {#if errorMessage}
      <span class="text-[11px] font-medium text-red-500 animate-fade-in">{errorMessage}</span>
    {/if}
  </div>

  <textarea 
    bind:value={replyText} 
    placeholder="Write your reply here..." 
    class="w-full bg-bg-base border border-border-default rounded-xl p-4 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors min-h-[120px] resize-y"
  ></textarea>

  <div class="mt-4 flex justify-between items-center">
    <span class="text-[11px] text-text-secondary">
      This reply will be published directly to the App Store / Play Store.
    </span>
    <button 
      onclick={submitReply}
      disabled={isSubmitting || !replyText.trim() || replyText === existingReply}
      class="px-5 py-2 rounded-full bg-text-primary text-bg-base text-[13px] font-medium hover:bg-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {#if isSubmitting}
        <svg class="animate-spin h-4 w-4 text-bg-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Posting...
      {:else}
        Post Reply
      {/if}
    </button>
  </div>
</div>
