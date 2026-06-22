import React, { useEffect, useState } from "react";
import SortableList, { type Item, SortableListItem } from "../ui/sortable-list";
import { motion } from "motion/react";

interface ActionTasksProps {
  appId: string;
}

export default function ActionTasks({ appId }: ActionTasksProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Item | null>(null);
  const [draftDescription, setDraftDescription] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [appId]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/action_tasks?app_id=${appId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.tasks) {
          const sorted = json.tasks.sort((a: any, b: any) => a.order_index - b.order_index);
          setItems(sorted.map((t: any) => ({ id: t.id, text: t.text, checked: t.completed, description: t.description })));
        }
      }
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTaskText.trim()) {
      const text = newTaskText.trim();
      setNewTaskText("");
      const order_index = items.length;
      
      const res = await fetch("/api/action_tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, text, completed: false, order_index }),
      });

      if (res.ok) {
        const { task } = await res.json();
        setItems((prev) => [...prev, { id: task.id, text: task.text, checked: task.completed, description: task.description }]);
      }
    }
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

  const handleUpdateDescription = (id: string, description: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, description } : item
    );
    setItems(updatedItems);
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
      description: item.description,
      app_id: appId
    }));
    await fetch("/api/action_tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: payload }),
    });
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-bg-base overflow-hidden border-border-default">
      <div className="flex items-center justify-between pl-8 pr-6 h-[88px] border-b border-border-default shrink-0">
        <h2 className="text-[20px] font-bold text-text-primary">Action Tasks</h2>
      </div>

      <div className="p-6">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleAddTask}
          placeholder="Add a new task... (Press Enter)"
          className="w-full bg-bg-surface border border-border-default text-text-primary text-[14px] rounded-[12px] px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-muted"
        />

        <div className="h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {loading ? (
            <div className="text-text-muted text-sm">Loading tasks...</div>
          ) : items.length === 0 ? (
            <div className="text-text-muted text-sm text-center py-10 border border-dashed border-border-default rounded-xl">
              No tasks yet. Create one above!
            </div>
          ) : (
            <SortableList
              items={items}
              setItems={handleReorder}
              onCompleteItem={handleCompleteItem}
              onClickItem={setSelectedTask}
              renderItem={(item, order, onCompleteItem, onRemoveItem, onClickItem) => (
                <SortableListItem
                  key={item.id}
                  item={item}
                  order={order}
                  isExpanded={selectedTask?.id === item.id}
                  onCompleteItem={onCompleteItem}
                  onRemoveItem={onRemoveItem}
                  onClickItem={(clickedItem) => {
                     setSelectedTask(prev => prev?.id === clickedItem.id ? null : clickedItem);
                     setDraftDescription(null);
                  }}
                  renderExtra={(expandedItem) => {
                    const isDirty = draftDescription !== null && draftDescription !== (expandedItem.description || "");
                    
                    return selectedTask?.id === expandedItem.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-4 flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <h3 className="text-[14px] font-medium text-text-primary flex-1">{expandedItem.text}</h3>
                          <div className="flex items-center gap-1 -mt-1 -mr-1">
                            {isDirty && !expandedItem.checked && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateDescription(expandedItem.id, draftDescription);
                                  setDraftDescription(null);
                                  setSelectedTask(null);
                                }} 
                                className="text-text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-bg-base transition-colors"
                                title="Save and Close"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDraftDescription(null);
                                setSelectedTask(null);
                              }} 
                              className="text-text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-bg-base transition-colors"
                              title="Close without saving"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col text-text-muted text-[13px] pl-2 border-l-2 border-border-default/50">
                          <textarea 
                            className="w-full bg-transparent resize-none outline-none text-text-secondary placeholder:text-text-muted/50 min-h-[100px]"
                            placeholder={expandedItem.checked ? "Task is completed." : "Add notes or details here..."}
                            value={draftDescription !== null ? draftDescription : (expandedItem.description || "")}
                            readOnly={expandedItem.checked}
                            onChange={(e) => {
                              if (!expandedItem.checked) {
                                setDraftDescription(e.target.value);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {isDirty && !expandedItem.checked && (
                            <div className="text-[11px] text-blue-500/80 mt-2 flex items-center gap-1.5 font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              Unsaved changes. Click the '✓' icon to save.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  }}
                  handleDrag={() => {}}
                />
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
