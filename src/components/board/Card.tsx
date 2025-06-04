'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import EmojiReactions from './EmojiReactions';
import VoteControls from './VoteControls';

interface CardProps {
  id: string;
  authorName: string;
  content: string;
  initialScore: number;
  isDragOverlay?: boolean; 
}

const Card: React.FC<CardProps> = ({ id, authorName, content, initialScore, isDragOverlay = false }) => {
  // Call useSortable unconditionally.
  // Disable its functionality if the card is being rendered as a drag overlay.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Directly use isDragging from the hook
  } = useSortable({
    id,
    disabled: isDragOverlay,
  });

  // Determine the style. If it's a drag overlay, style is minimal (empty object).
  // Otherwise, apply transformations and opacity changes for dragging.
  const style = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  const cardContent = (
    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div className="pt-1 text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>
        
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">{authorName}</div>
          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{content}</p>
          
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <EmojiReactions />
            <VoteControls initialScore={initialScore} />
          </div>
        </div>
      </div>
    </div>
  );

  // If rendering for a drag overlay, return only the content without the sortable wrapper div.
  // The useSortable hook was called with disabled: true, so its return values (setNodeRef, attributes, listeners)
  // are not applied to any DOM element in this case, which is correct for an overlay.
  if (isDragOverlay) {
    return cardContent;
  }

  // Otherwise (if not a drag overlay), return the content wrapped in a div with sortable properties.
  return (
    <div
      ref={setNodeRef} // Always provided by the hook
      style={style}    // Calculated above
      {...attributes}  // Provided by the hook (will be minimal if disabled, but that path isn't taken here)
      {...listeners}   // Provided by the hook
      className="touch-none"
    >
      {cardContent}
    </div>
  );
};

export default Card;