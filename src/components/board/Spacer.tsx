'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2 } from 'lucide-react';

interface SpacerProps {
  id: string;
  name?: string;
  color?: string; // Tailwind color class, e.g. 'bg-red-500'
  isDragOverlay?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const Spacer: React.FC<SpacerProps> = ({
  id,
  name,
  color,
  isDragOverlay = false,
  onEdit,
  onDelete,
}) => {
  /* --------------------------------------------------------------
   * Hook is always executed; it's simply disabled for overlays
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
      className={`my-2 py-1.5 rounded ${color || 'bg-gray-200'} cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group relative ${
        name ? 'py-2' : 'py-1'
      }`}
    >
      <div className="flex items-start gap-2 px-3">
        {name ? (
          <div className="text-xs font-medium text-gray-700 flex-1 leading-relaxed break-words py-0.5">
            {name}
          </div>
        ) : (
          <div className="h-1 flex-1" />
        )}

        {/* Edit/Delete buttons - only show when not drag overlay */}
        {!isDragOverlay && (onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                className="p-1 bg-white rounded shadow-sm hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-colors"
                title="Edit spacer"
                aria-label="Edit spacer"
              >
                <Edit2 size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="p-1 bg-white rounded shadow-sm hover:bg-gray-50 text-gray-600 hover:text-red-600 transition-colors"
                title="Delete spacer"
                aria-label="Delete spacer"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
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
