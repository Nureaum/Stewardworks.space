'use client';

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

export interface SortableListProps<T extends { id: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
}

export function SortableList<T extends { id: string }>({ items, onChange, renderItem }: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ['Space', 'Enter'],
        cancel: ['Escape'],
        end: ['Space', 'Enter'],
      },
    })
  );

  // Prevent keyboard sensor from activating when user is typing in an input
  const shouldHandleEvent = (element: Element | null) => {
    let cur = element;
    while (cur) {
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(cur.tagName) || (cur as HTMLElement).isContentEditable) {
        return false;
      }
      cur = cur.parentElement;
    }
    return true;
  };

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const activeItem = useMemo(() => items.find((item) => item.id === activeId), [activeId, items]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item, activeId === item.id)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.4',
              },
            },
          }),
        }}
      >
        {activeItem ? renderItem(activeItem, true) : null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragStart(event: DragStartEvent) {
    const focused = document.activeElement;
    if (!shouldHandleEvent(focused)) return;
    const { active } = event;
    setActiveId(active.id as string);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      onChange(arrayMove(items, oldIndex, newIndex));
    }

    setActiveId(null);
  }
}
