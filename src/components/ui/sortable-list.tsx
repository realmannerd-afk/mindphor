"use client"

import React, { useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
} from "motion/react"
import useMeasure from "react-use-measure"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export type Item = {
  text: string
  checked: boolean
  id: string
  description?: string
}

interface SortableListItemProps {
  item: Item
  order: number
  onCompleteItem: (id: string) => void
  onRemoveItem: (id: string) => void
  onClickItem?: (item: Item) => void
  renderExtra?: (item: Item) => React.ReactNode
  isExpanded?: boolean
  className?: string
  handleDrag: () => void
}

function SortableListItem({
  item,
  order,
  onCompleteItem,
  onRemoveItem,
  onClickItem,
  renderExtra,
  handleDrag,
  isExpanded,
  className,
}: SortableListItemProps) {
  let [ref, bounds] = useMeasure()
  const [isDragging, setIsDragging] = useState(false)
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
            "relative z-auto grow",
            "h-full bg-transparent",
            item.checked ? "cursor-not-allowed opacity-50" : "cursor-grab",
            item.checked && !isDragging ? "w-7/10" : "w-full"
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
          dragListener={!item.checked}
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
          <div ref={ref} className={cn(isExpanded ? "" : "", "z-20 ")}>
            <motion.div
              layout="position"
              className="flex items-center justify-center "
            >
              <AnimatePresence>
                {!isExpanded ? (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.001 }}
                    className="flex w-full items-center space-x-3 p-3"
                  >
                    {/* List Remove Actions */}
                    <div className="flex-shrink-0 flex items-center">
                      <Checkbox
                        checked={item.checked}
                        id={`checkbox-${item.id}`}
                        aria-label="Mark to delete"
                        onCheckedChange={() => onCompleteItem(item.id)}
                        className="h-5 w-5 rounded-full border-border-default checked:bg-emerald-500 checked:border-emerald-500 m-0"
                      />
                    </div>
                    {/* List Order */}
                    <div className="flex-shrink-0 flex items-center justify-center w-4">
                      <p className="font-mono text-xs text-text-muted leading-none m-0 pt-[1px]">
                        {order + 1}
                      </p>
                    </div>

                    {/* List Title */}
                    <motion.div
                      key={`${item.checked}`}
                      className="flex-1 min-w-0 flex items-center cursor-pointer"
                      onClick={() => onClickItem?.(item)}
                      initial={{
                        opacity: 0,
                        filter: "blur(4px)",
                      }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      transition={{
                        bounce: 0.2,
                        delay: item.checked ? 0.2 : 0,
                        type: "spring",
                      }}
                    >
                      <h4
                        className={cn(
                          "text-[14px] font-medium truncate leading-none m-0 hover:text-accent transition-colors",
                          item.checked ? "text-text-muted relative after:absolute after:left-0 after:right-0 after:top-1/2 after:h-[1px] after:bg-text-muted after:-translate-y-1/2" : "text-text-primary"
                        )}
                      >
                        {item.text}
                      </h4>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* List Item Children */}
              {renderExtra && renderExtra(item)}
            </motion.div>
          </div>
          <div
            onPointerDown={handleDragStart}
            style={{ touchAction: "none" }}
          />
        </Reorder.Item>
        {/* List Delete Action Animation */}
        <AnimatePresence mode="popLayout">
          {item.checked ? (
            <motion.div
              layout
              initial={{ opacity: 0, x: -5, filter: "blur(4px)" }}
              animate={{
                opacity: 1,
                x: 0,
                filter: "blur(0px)",
                transition: {
                  delay: 0.3,
                  duration: 0.15,
                  type: "spring",
                  bounce: 0.9,
                },
              }}
              exit={{
                opacity: 0,
                filter: "blur(4px)",
                x: -10,
                transition: { delay: 0, duration: 0.12 },
              }}
              className="ml-2 inset-0 z-0 rounded-lg"
            >
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                onClick={() => onRemoveItem(item.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-500">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

SortableListItem.displayName = "SortableListItem"

interface SortableListProps {
  items: Item[]
  setItems: Dispatch<SetStateAction<Item[]>>
  onCompleteItem: (id: string) => void
  onClickItem?: (item: Item) => void
  renderItem: (
    item: Item,
    order: number,
    onCompleteItem: (id: string) => void,
    onRemoveItem: (id: string) => void,
    onClickItem?: (item: Item) => void
  ) => ReactNode
}

function SortableList({
  items,
  setItems,
  onCompleteItem,
  onClickItem,
  renderItem,
}: SortableListProps) {
  if (items) {
    return (
      <LayoutGroup>
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className="flex flex-col gap-2 w-full"
        >
          <AnimatePresence>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderItem(item, index, onCompleteItem, (id: string) =>
                  setItems((items) => items.filter((item) => item.id !== id)), onClickItem)}
              </React.Fragment>
            ))}
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
