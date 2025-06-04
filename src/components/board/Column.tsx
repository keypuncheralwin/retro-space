'use client';

import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface ColumnProps {
  id: string;
  title: string;
  description: string;
  items: string[];            
  children: React.ReactNode;
  isDragOverlay?: boolean; 
}

const Column: React.FC<ColumnProps> = ({
  id,
  title,
  description,
  items,
  children,
  isDragOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: 'column' },
    disabled: isDragOverlay,
  });

  // Compute style only when not in drag overlay
  const style = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  // Build the column’s inner content once
  const columnContent = (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-80 flex-shrink-0 flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Show drag handle only when not in drag overlay */}
      {!isDragOverlay && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
          title="Drag to reorder column"
        >
          <GripVertical size={20} className="text-gray-400" />
        </div>
      )}

      {/* Column header with space reserved for the handle */}
      <div className={!isDragOverlay ? 'pr-8' : ''}>
        <h2 className="text-xl font-semibold mb-1 text-gray-800">{title}</h2>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>

      {/* Wrap items in SortableContext only when not a drag overlay */}
      {isDragOverlay ? (
        <div className="min-h-[100px] rounded-md pt-2 overflow-y-auto flex-grow custom-scrollbar">
          {children}
        </div>
      ) : (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="min-h-[100px] rounded-md pt-2 overflow-y-auto flex-grow custom-scrollbar">
            {children}
          </div>
        </SortableContext>
      )}
    </div>
  );

  // If this is a drag overlay, we skip attaching setNodeRef and style
  if (isDragOverlay) {
    return <div className="relative">{columnContent}</div>;
  }

  // Otherwise, attach the sortable refs and style
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {columnContent}
    </div>
  );
};

export default Column;
