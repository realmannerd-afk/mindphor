<script lang="ts">
  import { Avatar } from "bits-ui";

  export let name: string = "Anonymous User";
  export let imageUrl: string | null = null;
  export let className: string = "h-10 w-10 text-[13px]"; // default sizes
  
  // Calculate initials
  $: initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
</script>

<Avatar.Root class={`flex shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-subtle overflow-hidden ${className}`}>
  {#if imageUrl}
    <Avatar.Image src={imageUrl} alt={name} class="aspect-square h-full w-full object-cover" />
  {/if}
  <Avatar.Fallback class="font-medium text-text-primary">
    {initials}
  </Avatar.Fallback>
</Avatar.Root>
