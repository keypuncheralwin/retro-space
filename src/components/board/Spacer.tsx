'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SpacerProps {
  id: string;
  name?: string;
  color?: string; // Expecting a Tailwind CSS color class e.g., 'bg-red-500'
  isDragOverlay?: boolean; // Optional prop to disable sortable functionality
}

const Spacer: React.FC<SpacerProps> = ({ id, name, color, isDragOverlay = false }) => {
  // Only use sortable hook if not in drag overlay
  const sortable = isDragOverlay ? null : useSortable({ id });

  const style = isDragOverlay
    ? {}
    : sortable
      ? {
          transform: CSS.Transform.toString(sortable.transform),
          transition: sortable.transition,
          opacity: sortable.isDragging ? 0.5 : 1,
        }
      : {};

  const spacerContent = (
    <div
      className={`my-2 py-2 rounded ${color || 'bg-gray-200'} cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-center gap-2 px-3">
        {/* Drag handle */}
        <div className="text-gray-600 opacity-0 hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>

        {name ? (
          <div className="text-xs font-medium text-gray-700 truncate flex-1">{name}</div>
        ) : (
          <div className="h-2 flex-1"></div>
        )}
      </div>
    </div>
  );

  // If in drag overlay, return without sortable wrapper
  if (isDragOverlay) {
    return spacerContent;
  }

  // Otherwise, return with sortable functionality
  return (
    <div
      ref={sortable?.setNodeRef}
      style={style}
      {...(sortable?.attributes || {})}
      {...(sortable?.listeners || {})}
      className="touch-none"
    >
      {spacerContent}
    </div>
  );
};

export default Spacer;
