import React, { useEffect, useState, useRef } from "react";
import SortableList, { type Item, SortableListItem } from "../ui/sortable-list";

interface ActionTasksProps {
  appId: string;
  initialTasks?: Item[];
}

export default function ActionTasks({ appId, initialTasks }: ActionTasksProps) {
  const [items, setItems] = useState<Item[]>(initialTasks || []);
  const [loading, setLoading] = useState(!initialTasks);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!initialTasks) {
      fetchTasks();
    }
  }, [appId]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/action_tasks?app_id=${appId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.tasks) {
          const sorted = json.tasks.sort((a: any, b: any) => a.order_index - b.order_index);
          setItems(sorted.map((t: any) => ({ 
            id: t.id, 
            text: t.text, 
            checked: t.completed 
          })));
        }
      }
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewTaskAtBottom = async () => {
    const order_index = items.length;
    const res = await fetch("/api/action_tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, text: "", completed: false, order_index }),
    });

    if (res.ok) {
      const { task } = await res.json();
      setItems((prev) => [...prev, { id: task.id, text: task.text || "", checked: task.completed || false }]);
      setTimeout(() => {
        const input = document.getElementById(`task-input-${task.id}`);
        if (input) input.focus();
      }, 50);
    } else {
      const errorText = await res.text();
      alert(`Failed to create task: ${errorText}`);
    }
  };

  const handleItemKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, item: Item, order: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (item.text.trim() === '') {
        return; // Don't allow creating a new block if the current one has no name!
      }

      const newOrder = order + 1;
      
      const res = await fetch("/api/action_tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, text: "", completed: false, order_index: newOrder }),
      });
      
      if (res.ok) {
        const { task } = await res.json();
        setItems(prev => {
          const newItems = [...prev];
          newItems.splice(newOrder, 0, { id: task.id, text: task.text, checked: task.completed });
          
          // Re-index remaining tasks
          const payload = newItems.map((item, index) => ({
            id: item.id,
            order_index: index,
            completed: item.checked,
            app_id: appId
          }));
          
          fetch("/api/action_tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tasks: payload }),
          });

          return newItems;
        });

        setTimeout(() => {
          const input = document.getElementById(`task-input-${task.id}`);
          if (input) input.focus();
        }, 50);
      }
    } else if (e.key === 'Backspace' && item.text === '') {
      e.preventDefault();
      handleRemoveItem(item.id);
      
      if (order > 0) {
        setTimeout(() => {
          const prevItem = items[order - 1];
          const input = document.getElementById(`task-input-${prevItem.id}`);
          if (input) input.focus();
        }, 50);
      }
    }
  };

  const handleItemTextChange = (id: string, text: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch("/api/action_tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: [{ id, text, app_id: appId }] }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.text();
          alert(`Failed to save goal: ${err}`);
        }
      });
    }, 500);
  };

  const handleCompleteItem = async (id: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    saveOrder(updatedItems);
  };

  const handleRemoveItem = async (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
    await fetch(`/api/action_tasks?id=${id}`, { method: "DELETE" });
    saveOrder(updatedItems);
  };

  const handleReorder: React.Dispatch<React.SetStateAction<Item[]>> = (value) => {
    const newItems = typeof value === 'function' ? value(items) : value;
    setItems(newItems);
    saveOrder(newItems);
  };

  const saveOrder = async (currentItems: Item[]) => {
    const payload = currentItems.map((item, index) => ({
      id: item.id,
      order_index: index,
      completed: item.checked,
      text: item.text,
      app_id: appId
    }));
    await fetch("/api/action_tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: payload }),
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full pb-20">
      {loading ? (
        <div className="text-text-muted text-sm py-4">Loading tasks...</div>
      ) : (
        <SortableList
          items={items}
          setItems={handleReorder}
          onCompleteItem={handleCompleteItem}
          onRemoveItem={handleRemoveItem}
          renderItem={(item, order, onCompleteItem, onRemoveItem, onChangeText, onItemKeyDown) => (
            <SortableListItem
              key={item.id}
              item={item}
              order={order}
              onCompleteItem={onCompleteItem}
              onRemoveItem={onRemoveItem}
              onChangeText={(id, text) => {
                handleItemTextChange(id, text);
                onChangeText?.(id, text);
              }}
              onItemKeyDown={(e, item) => {
                handleItemKeyDown(e, item, order);
                onItemKeyDown?.(e, item);
              }}
              handleDrag={() => {}}
            />
          )}
        />
      )}

      {!loading && (
        <button 
          onClick={handleAddNewTaskAtBottom}
          className="flex w-full items-center space-x-2.5 py-1.5 px-1 mt-2 -ml-2 text-text-muted/70 hover:text-text-primary transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="flex-shrink-0 flex items-center justify-center h-5 w-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
          <div className="flex-1 min-w-0 flex items-center">
            <span className="text-[14px] font-medium leading-none">New task</span>
          </div>
        </button>
      )}
    </div>
  );
}
