<script lang="ts">
  import { onMount } from 'svelte';

  interface Task {
    id: string;
    text: string;
    completed: boolean;
  }

  let tasks: Task[] = [];
  
  const defaultTasks: Task[] = [
    { id: '1', text: 'Review customer request overlap data', completed: false },
    { id: '2', text: 'Analyze latest pricing changes', completed: true },
  ];

  function saveTasks() {
    localStorage.setItem('mindphor_todos', JSON.stringify(tasks));
  }

  let newTaskText = '';

  onMount(() => {
    // Load existing tasks
    const saved = localStorage.getItem('mindphor_todos');
    if (saved) {
      try {
        tasks = JSON.parse(saved);
      } catch (e) {
        tasks = [...defaultTasks];
      }
    } else {
      tasks = [...defaultTasks];
    }

    const urlParams = new URLSearchParams(window.location.search);
    const taskParam = urlParams.get('task');
    if (taskParam) {
      const exists = tasks.some(t => t.text === taskParam);
      if (!exists) {
        tasks = [...tasks, { id: Date.now().toString(), text: taskParam, completed: false }];
        saveTasks();
      }
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  });

  function addTask(e?: KeyboardEvent) {
    if (e && e.key !== 'Enter') return;
    if (!newTaskText.trim()) return;
    
    tasks = [...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }];
    saveTasks();
    newTaskText = '';
  }

  function toggleTask(id: string) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
  }

  function removeTask(id: string) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
  }
</script>

<div class="flex flex-col gap-8 pb-20 w-full max-w-[800px]">
  
  <!-- Header -->
  <div class="flex flex-col gap-2 mb-2">
    <h1 class="text-[22px] font-bold text-text-primary">Action Plan</h1>
    <p class="text-[15px] text-text-secondary">Track strategic initiatives and execute recommended actions.</p>
  </div>

  <div class="flex flex-col gap-4 w-full">
    
    <!-- Input Field (Flat) -->
    <div class="flex items-center gap-3 bg-transparent border-b border-border-default pb-4">
      <div class="w-5 h-5 rounded-[6px] border border-border-strong flex items-center justify-center flex-shrink-0 text-text-muted">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </div>
      <input 
        type="text" 
        bind:value={newTaskText}
        on:keydown={addTask}
        placeholder="Add a new task..."
        class="flex-1 bg-transparent border-none outline-none text-[15px] text-text-primary placeholder-text-muted"
      />
    </div>

    <!-- Task List (Flat) -->
    <div class="flex flex-col gap-1 w-full mt-2">
      {#each tasks as task (task.id)}
        <div class="group flex items-center justify-between py-3 px-2 -mx-2 rounded-[8px] hover:bg-black/[0.03] transition-colors">
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <button 
              aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              class="w-[22px] h-[22px] rounded-[6px] border {task.completed ? 'bg-accent border-accent text-white' : 'border-border-strong bg-transparent text-transparent hover:border-accent'} flex items-center justify-center flex-shrink-0 transition-colors"
              on:click={() => toggleTask(task.id)}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <span class="text-[15px] {task.completed ? 'text-text-muted line-through' : 'text-text-primary'} truncate">
              {task.text}
            </span>
          </div>
          
          <button 
            aria-label="Delete task"
            class="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            on:click={() => removeTask(task.id)}
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
          </button>
        </div>
      {/each}
      
      {#if tasks.length === 0}
        <div class="py-12 flex flex-col items-start justify-center text-left opacity-60">
          <p class="text-[15px] font-medium text-text-primary">No tasks yet</p>
          <p class="text-[14px] text-text-muted mt-1">Add a recommended action from a competitor profile or type a new task above.</p>
        </div>
      {/if}
    </div>
  </div>

</div>
