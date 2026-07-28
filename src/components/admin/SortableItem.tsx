'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0,
  };

  // We wrap the children and inject the drag listeners onto a handle.
  // The children should accept a handle. Actually, since we want to be flexible,
  // we can pass the listeners to the children via a context, or we can just apply 
  // the listeners to the whole item. Applying to the whole item is easiest for now.
  // If we want a specific drag handle, we'd need to use a React Context to pass `listeners` down.
  // For now, let's just apply it to a container div that wraps the children.
  // We'll pass listeners down as a prop if we want a specific handle.
  
  // To support a specific drag handle inside the renderItem, we can clone the child 
  // and inject listeners, or we can just apply listeners to the outer wrapper if they don't provide a handle.
  // Wait, the best way in React is to let the parent render a wrapper. 
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
