'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SpacerProps {
  id: string;
  name?: string;
  color?: string; // Tailwind color class, e.g. 'bg-red-500'
  isDragOverlay?: boolean;
}

const Spacer: React.FC<SpacerProps> = ({ id, name, color, isDragOverlay = false }) => {
  /* --------------------------------------------------------------
   * Hook is always executed; it’s simply disabled for overlays
   * -------------------------------------------------------------- */
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isDragOverlay,
  });

  /* -------------------------------------------------------------- */
  /* Styles – only apply drag transforms when hook is active        */
  /* -------------------------------------------------------------- */
  const style: React.CSSProperties = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform ?? null),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  /* -------------------------------------------------------------- */
  /* Inner content                                                   */
  /* -------------------------------------------------------------- */
  const spacerContent = (
    <div
      className={`my-2 py-2 rounded ${color || 'bg-gray-200'} cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-center gap-2 px-3">
        {/* Drag handle (purely visual) */}
        <div className="text-gray-600 opacity-0 hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>

        {name ? (
          <div className="text-xs font-medium text-gray-700 truncate flex-1">{name}</div>
        ) : (
          <div className="h-2 flex-1" />
        )}
      </div>
    </div>
  );

  /* -------------------------------------------------------------- */
  /* Render                                                          */
  /* -------------------------------------------------------------- */
  if (isDragOverlay) {
    // Overlay: no refs / listeners, just render the content
    return spacerContent;
  }

  // Normal sortable spacer
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      {spacerContent}
    </div>
  );
};

export default Spacer;
