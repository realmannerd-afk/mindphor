<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  export let initialDate: string | null = null;
  
  let isOpen = false;
  let selectedDate: Date | null = initialDate ? new Date(initialDate) : null;
  
  // View state for the calendar
  let viewDate = selectedDate ? new Date(selectedDate) : new Date();
  $: currentMonth = viewDate.getMonth();
  $: currentYear = viewDate.getFullYear();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  // Calculate days in month and starting day
  $: daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  $: firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Generate calendar grid
  $: calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    if (day > 0 && day <= daysInMonth) {
      return new Date(currentYear, currentMonth, day);
    }
    return null;
  });

  function prevYear() {
    viewDate = new Date(currentYear - 1, currentMonth, 1);
  }

  function prevMonth() {
    viewDate = new Date(currentYear, currentMonth - 1, 1);
  }

  function nextMonth() {
    viewDate = new Date(currentYear, currentMonth + 1, 1);
  }

  function nextYear() {
    viewDate = new Date(currentYear + 1, currentMonth, 1);
  }

  function selectDate(date: Date) {
    selectedDate = date;
    isOpen = false;
    
    // Convert to local YYYY-MM-DD
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 10);
    
    const url = new URL(window.location.href);
    url.searchParams.set('date', localISOTime);
    window.location.href = url.toString();
  }

  function clearDate(e: Event) {
    e.stopPropagation();
    selectedDate = null;
    const url = new URL(window.location.href);
    url.searchParams.delete('date');
    window.location.href = url.toString();
  }

  function isSameDay(d1: Date | null, d2: Date | null) {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  }

  function isToday(d: Date | null) {
    if (!d) return false;
    const today = new Date();
    return isSameDay(d, today);
  }

  // Handle click outside
  let dropdownRef: HTMLDivElement;
  function handleClickOutside(e: MouseEvent) {
    if (isOpen && dropdownRef && !dropdownRef.contains(e.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  $: displayText = selectedDate 
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<div class="relative" bind:this={dropdownRef}>
  <!-- Button Group Wrapper -->
  <div 
    class={`flex items-center h-8 rounded-full border transition-all focus-within:ring-2 focus-within:ring-border-strong/50 ${
      isOpen || selectedDate 
      ? 'bg-bg-elevated/70 border-border-default text-text-primary' 
      : 'bg-transparent border-border-default hover:bg-bg-elevated/70 text-text-secondary hover:text-text-primary'
    }`}
  >
    <button 
      type="button"
      on:click={(e) => { e.stopPropagation(); isOpen = !isOpen; }}
      class="flex items-center gap-2 h-full pl-3 pr-1.5 rounded-l-full focus:outline-none"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      <span class="text-[13px] font-medium whitespace-nowrap">{displayText}</span>
    </button>
    
    {#if selectedDate}
      <button 
        type="button"
        on:click={clearDate}
        aria-label="Clear date"
        class="h-full pr-2.5 pl-1 rounded-r-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors focus:outline-none group"
      >
        <div class="w-4 h-4 rounded-full flex items-center justify-center group-hover:bg-text-muted/20 transition-colors">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </div>
      </button>
    {:else}
      <button 
        type="button"
        on:click={(e) => { e.stopPropagation(); isOpen = !isOpen; }}
        class="h-full pr-2.5 pl-1 rounded-r-full flex items-center justify-center focus:outline-none text-text-muted"
        aria-label="Toggle calendar"
      >
        <svg class={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
    {/if}
  </div>

  <!-- Dropdown Popover -->
  {#if isOpen}
    <div class="absolute right-0 top-[calc(100%+8px)] w-[260px] bg-bg-surface border border-border-default rounded-[12px] shadow-lg z-50 p-4 font-sans animate-in fade-in slide-in-from-top-2 duration-200">
      
      <!-- Calendar Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <button type="button" aria-label="Previous year" on:click={prevYear} class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"></path></svg>
          </button>
          <button type="button" aria-label="Previous month" on:click={prevMonth} class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          </button>
        </div>
        
        <div class="text-[13px] font-medium text-text-primary">
          {monthNames[currentMonth]} {currentYear}
        </div>

        <div class="flex items-center">
          <button type="button" aria-label="Next month" on:click={nextMonth} class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </button>
          <button type="button" aria-label="Next year" on:click={nextYear} class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"></path></svg>
          </button>
        </div>
      </div>

      <!-- Days of week -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        {#each dayNames as day}
          <div class="text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider">{day}</div>
        {/each}
      </div>

      <!-- Dates Grid -->
      <div class="grid grid-cols-7 gap-1">
        {#each calendarDays as date}
          {#if date}
            {@const selected = isSameDay(date, selectedDate)}
            {@const today = isToday(date)}
            <button 
              on:click={() => selectDate(date)}
              class={`h-8 w-full rounded-full text-[13px] flex items-center justify-center transition-colors focus:outline-none
                ${selected ? 'bg-text-primary text-bg-base font-medium shadow-sm' : 
                  today ? 'bg-accent/10 text-accent font-semibold hover:bg-accent/20' : 
                  'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'}`
              }
            >
              {date.getDate()}
            </button>
          {:else}
            <div class="h-8 w-full"></div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
