"use client"

// npx shadcn-ui@latest add checkbox
// npm  i react-use-measure
import React, { useState } from "react"
import type { Dispatch, ReactNode, SetStateAction } from "react"
import { Trash, GripVertical } from "lucide-react"
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
} from "motion/react"
import useMeasure from "react-use-measure"

import { cn } from "@/lib/utils"

export type Item = {
  text: string
  checked: boolean
  id: number
  description: string
}

interface SortableListItemProps {
  item: Item
  order: number
  onCompleteItem: (id: number) => void
  onRemoveItem: (id: number) => void
  renderExtra?: (item: Item) => React.ReactNode
  isExpanded?: boolean
  className?: string
  handleDrag: () => void
  onChangeText?: (id: any, text: string) => void
  onItemKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, item: Item) => void
}

function SortableListItem({
  item,
  order,
  onCompleteItem,
  onRemoveItem,
  renderExtra,
  handleDrag,
  isExpanded,
  className,
  onChangeText,
  onItemKeyDown,
}: SortableListItemProps) {
  let [ref, bounds] = useMeasure()
  const [isDragging, setIsDragging] = useState(false)
  // const [isDraggable, setIsDraggable] = useState(true)
  const dragControls = useDragControls()

  const handleDragStart = (event: any) => {
    setIsDragging(true)
    dragControls.start(event, { snapToCursor: true })
    handleDrag()
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <motion.div className={cn("", className)} key={item.id}>
      <div className="flex w-full items-center">
        <Reorder.Item
          value={item}
          className={cn(
            "relative z-auto grow flex items-center justify-between w-full group",
            item.checked ? "cursor-not-allowed opacity-60" : "",
            isDragging ? "select-none" : ""
          )}
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            height: bounds.height > 0 ? bounds.height : undefined,
            transition: {
              type: "spring",
              bounce: 0,
              duration: 0.4,
            },
          }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.05,
              type: "spring",
              bounce: 0.1,
            },
          }}
          layout
          layoutId={`item-${item.id}`}
          dragListener={false}
          dragControls={dragControls}
          onDragEnd={handleDragEnd}
          style={
            isExpanded
              ? {
                  zIndex: 9999,
                  marginTop: 10,
                  marginBottom: 10,
                  position: "relative",
                  overflow: "hidden",
                }
              : {
                  position: "relative",
                  overflow: "hidden",
                }
          }
          whileDrag={{ zIndex: 9999 }}
        >
          <div ref={ref} className={cn(isExpanded ? "" : "", "z-20 flex-1 w-full", isDragging ? "pointer-events-none" : "")}>
            <motion.div
              layout="position"
              className="flex items-center justify-start w-full"
            >
              <AnimatePresence>
                {!isExpanded ? (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.001 }}
                    className="flex items-center space-x-3 w-full pl-1"
                  >
                    {/* List Order */}
                    <p className="text-xs text-text-muted/60 min-w-[1.2rem]">
                      {order + 1}
                    </p>

                    {/* List Title */}
                    <motion.div
                      className="flex-1 w-full pr-2"
                    >
                      <input
                        id={`task-input-${item.id}`}
                        value={item.text}
                        onChange={(e) => onChangeText?.(item.id, e.target.value)}
                        onKeyDown={(e) => onItemKeyDown?.(e, item)}
                        className="bg-transparent border-none focus:outline-none focus:ring-0 text-text-primary w-full text-[14px] placeholder-text-muted/50 p-0 m-0"
                        placeholder="Type a goal..."
                        autoComplete="off"
                      />
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* List Item Children */}
              {renderExtra && renderExtra(item)}
            </motion.div>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="select-none flex-shrink-0 p-1.5 cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              onPointerDown={handleDragStart}
              style={{ touchAction: "none" }}
            >
              <GripVertical className="h-4 w-4 text-text-muted/70" />
            </div>
            <button
              type="button"
              className="flex-shrink-0 p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors focus-visible:outline-none"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </Reorder.Item>
      </div>
    </motion.div>
  )
}

SortableListItem.displayName = "SortableListItem"

interface SortableListProps {
  items: Item[]
  setItems: Dispatch<SetStateAction<Item[]>>
  onCompleteItem: (id: any) => void
  onRemoveItem?: (id: any) => void
  renderItem: (
    item: Item,
    order: number,
    onCompleteItem: (id: any) => void,
    onRemoveItem: (id: any) => void,
    onChangeText?: (id: any, text: string) => void,
    onItemKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, item: Item) => void
  ) => ReactNode
}

function SortableList({
  items,
  setItems,
  onCompleteItem,
  onRemoveItem,
  renderItem,
}: SortableListProps) {
  if (items && items.length > 0) {
    return (
      <LayoutGroup>
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className="flex flex-col gap-3"
        >
          <AnimatePresence>
            {items?.map((item, index) =>
              renderItem(
                item, 
                index, 
                onCompleteItem, 
                onRemoveItem || ((id: any) => setItems((items) => items.filter((item) => item.id !== id))),
                (id: any, text: string) => {},
                (e: any, item: any) => {}
              )
            )}
          </AnimatePresence>
        </Reorder.Group>
      </LayoutGroup>
    )
  }
  return null
}

SortableList.displayName = "SortableList"

export { SortableList, SortableListItem }
export default SortableList
