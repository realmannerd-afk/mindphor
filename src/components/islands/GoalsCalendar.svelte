<script lang="ts">
  import { onMount } from 'svelte';

  // --- CALENDAR LOGIC ---
  interface Goal {
    id: string;
    date: string; // YYYY-MM-DD
    text: string;
    color: string;
  }

  export let appId: string;

  let goals: Goal[] = [];
  
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  let showGoalModal = false;
  let selectedDate = '';
  let newGoalText = '';
  let isLoading = true;

  onMount(() => {
    fetchGoals();
  });

  async function fetchGoals() {
    try {
      const res = await fetch(`/api/goals?app_id=${appId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.goals) goals = json.goals;
      }
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  async function addGoal() {
    if (!newGoalText.trim()) return;
    const color = colors[goals.length % colors.length];
    const text = newGoalText;
    const date = selectedDate;
    
    // Optimistic UI
    const tempId = `temp_${Date.now()}`;
    goals = [...goals, { id: tempId, date, text, color }];
    showGoalModal = false;
    newGoalText = '';

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, text, date, color }),
      });
      if (res.ok) {
        const { goal } = await res.json();
        goals = goals.map(g => g.id === tempId ? { ...goal } : g);
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  async function removeGoal(e: Event, id: string) {
    e.stopPropagation();
    goals = goals.filter(g => g.id !== id);
    try {
      await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  }

  $: firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  $: daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  $: daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  $: calendarDays = Array.from({ length: 42 }, (_, i) => {
    if (i < firstDayOfMonth) {
      return { day: daysInPrevMonth - firstDayOfMonth + i + 1, isCurrentMonth: false, date: null };
    } else if (i < firstDayOfMonth + daysInMonth) {
      const day = i - firstDayOfMonth + 1;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { day, isCurrentMonth: true, date: dateStr };
    } else {
      return { day: i - firstDayOfMonth - daysInMonth + 1, isCurrentMonth: false, date: null };
    }
  });

  function prevMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }

  function openGoalModal(date: string) {
    if (!date) return;
    selectedDate = date;
    newGoalText = '';
    showGoalModal = true;
  }

  function isToday(dateStr: string) {
    if (!dateStr) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  }

</script>

<div class="flex-1 flex flex-col h-full overflow-hidden bg-bg-base border-l border-border-default">
  
  <!-- Header -->
  <div class="flex items-center justify-between pl-10 pr-6 h-[88px] border-b border-border-default bg-transparent shrink-0">
    <div class="flex items-center gap-4">
      <h2 class="text-[20px] font-bold text-text-primary">{monthNames[currentMonth]} {currentYear}</h2>
      <div class="flex items-center border border-border-default rounded-[8px] overflow-hidden">
        <button on:click={prevMonth} aria-label="Previous month" class="p-1.5 px-2 hover:bg-bg-elevated text-text-secondary transition-colors">
          <svg class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path></svg>
        </button>
        <div class="w-[1px] h-4 bg-border-faint"></div>
        <button on:click={nextMonth} aria-label="Next month" class="p-1.5 px-2 hover:bg-bg-elevated text-text-secondary transition-colors">
          <svg class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
        </button>
      </div>
    </div>
    <button class="px-3 py-1.5 text-[13px] font-semibold text-text-primary border border-border-default rounded-[8px] hover:bg-bg-elevated transition-colors" on:click={() => { currentMonth = new Date().getMonth(); currentYear = new Date().getFullYear(); }}>Today</button>
  </div>

  <!-- Calendar Grid -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Day Headers -->
    <div class="grid grid-cols-7 h-[64px] border-b border-border-default bg-transparent shrink-0">
      {#each dayNames as day}
        <div class="flex flex-col justify-center text-center text-[12px] font-bold text-text-muted uppercase tracking-wider border-r border-border-faint last:border-0 h-full">{day}</div>
      {/each}
    </div>
    <!-- Days Grid -->
    <div class="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
      {#each calendarDays as {day, isCurrentMonth, date}}
        <div 
          class="border-r border-b border-border-faint p-1 flex flex-col min-h-0 transition-colors {isCurrentMonth ? 'hover:bg-bg-elevated cursor-pointer' : 'text-text-muted cursor-default opacity-50'}"
          on:click={() => isCurrentMonth && openGoalModal(date || '')}
          aria-hidden="true"
        >
          <div class="flex justify-center mb-1">
            <span class="w-6 h-6 flex items-center justify-center text-[12px] font-medium rounded-full mt-0.5 {isToday(date || '') ? 'bg-accent text-white font-bold shadow-sm' : (isCurrentMonth ? 'text-text-primary' : '')}">
              {day}
            </span>
          </div>
          <div class="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar px-0.5">
              {#if isCurrentMonth}
                {#each goals.filter(g => g.date === date) as goal (goal.id)}
                  <div class="group relative px-2 py-1 text-[11px] font-semibold text-white rounded-[6px] truncate flex items-center justify-between shadow-sm cursor-default shrink-0" style="background-color: {goal.color};">
                    <span class="truncate pr-4">{goal.text}</span>
                    <button aria-label="Remove goal" class="absolute right-1 w-4 h-4 rounded-full bg-black/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/40 transition-all" on:click={(e) => removeGoal(e, goal.id)}>
                      <svg class="w-2.5 h-2.5" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
                    </button>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/each}
      </div>
  </div>
</div>

<!-- Goal Modal -->
{#if showGoalModal}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-bg-surface w-full max-w-[360px] p-6 rounded-[12px] shadow-xl border border-border-default transform transition-all">
      <h3 class="text-[16px] font-bold text-text-primary mb-1">Set Goal</h3>
      <p class="text-[13px] text-text-secondary mb-5">Scheduling for {selectedDate}</p>
      
      <div class="border-b border-border-default pb-2 mb-6">
        <input 
          type="text" 
          bind:value={newGoalText}
          placeholder="E.g., Launch V2 Pricing..."
          class="w-full bg-transparent border-none outline-none text-[14px] text-text-primary placeholder-text-muted"
          on:keydown={(e) => { if (e.key === 'Enter') addGoal() }}
        />
      </div>
      
      <div class="flex justify-end gap-2">
        <button on:click={() => showGoalModal = false} class="px-4 py-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
        <button on:click={addGoal} class="px-4 py-1.5 text-[13px] font-medium bg-text-primary text-bg-base rounded-md hover:opacity-90 transition-opacity">Save Goal</button>
      </div>
    </div>
  </div>
{/if}
