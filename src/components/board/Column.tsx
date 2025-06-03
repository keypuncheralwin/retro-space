'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ColumnProps {
  id: string;
  title: string;
  description: string;
  items: string[]; // Array of item IDs for the sortable context
  children: React.ReactNode;
  isDragOverlay?: boolean; // Optional prop to disable sortable functionality
}

const Column: React.FC<ColumnProps> = ({ id, title, description, items, children, isDragOverlay = false }) => {
  // Only use sortable hook if not in drag overlay
  const sortable = isDragOverlay ? null : useSortable({ 
    id,
    data: {
      type: 'column',
    }
  });

  const style = isDragOverlay ? {} : sortable ? {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
  } : {};

  const columnContent = (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-80 flex-shrink-0 flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Only show drag handle if not in drag overlay */}
      {!isDragOverlay && sortable && (
        <div
          {...sortable.attributes}
          {...sortable.listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
          title="Drag to reorder column"
        >
          <GripVertical size={20} className="text-gray-400" />
        </div>
      )}
      
      {/* Column header with padding for drag handle */}
      <div className={!isDragOverlay ? "pr-8" : ""}>
        <h2 className="text-xl font-semibold mb-1 text-gray-800">{title}</h2>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>
      
      {/* Only wrap in SortableContext if not in drag overlay */}
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

  // If in drag overlay, return without sortable wrapper
  if (isDragOverlay) {
    return <div className="relative">{columnContent}</div>;
  }

  // Otherwise, return with sortable functionality
  return (
    <div ref={sortable?.setNodeRef} style={style} className="relative">
      {columnContent}
    </div>
  );
};

export default Column;