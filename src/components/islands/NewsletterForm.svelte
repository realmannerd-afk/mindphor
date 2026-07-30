<script lang="ts">
  import { toast } from "svelte-sonner";

  let email = "";
  let loading = false;

  async function handleSubscribe(e: Event) {
    e.preventDefault();
    if (!email) return;

    loading = true;
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Thanks for subscribing!");
        email = "";
      } else {
        toast.error(data.error || "Failed to subscribe");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      loading = false;
    }
  }
</script>

<div class="relative overflow-hidden rounded-2xl border border-border-default bg-bg-base p-8 md:p-12 text-center max-w-4xl mx-auto w-full shadow-sm">
  <!-- Decorative background elements -->
  <div class="absolute -top-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
  <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

  <div class="relative z-10 max-w-2xl mx-auto">
    <h2 class="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary mb-4">
      Get Mindphor Updates
    </h2>
    <p class="text-[15px] text-text-secondary leading-relaxed mb-8">
      Join our newsletter to get early access to new AI models, competitive analysis strategies, and platform updates. No spam, ever.
    </p>

    <form on:submit={handleSubscribe} class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        bind:value={email}
        placeholder="Enter your email"
        required
        disabled={loading}
        class="flex-1 px-4 py-3 rounded-full bg-bg-subtle border border-border-default focus:border-text-primary focus:ring-1 focus:ring-text-primary outline-none text-[14px] text-text-primary placeholder:text-text-muted transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || !email}
        class="px-6 py-3 rounded-full bg-text-primary text-bg-base text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {#if loading}
          <div class="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin"></div>
          <span>Subscribing...</span>
        {:else}
          <span>Subscribe</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        {/if}
      </button>
    </form>
  </div>
</div>
