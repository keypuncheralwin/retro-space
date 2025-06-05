'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EmojiReactions from './EmojiReactions';
import VoteControls from './VoteControls';

interface CardProps {
  id: string;
  authorName: string;
  content: string;
  initialScore: number;
  isDragOverlay?: boolean;
  /** True while another item is hovering & this card is the drop-target */
  highlight?: boolean;
}

const Card: React.FC<CardProps> = ({
  id,
  authorName,
  content,
  initialScore,
  isDragOverlay = false,
  highlight = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isDragOverlay,
  });

  const wrapperStyle: React.CSSProperties = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      {...attributes}
      {...listeners}
      className="relative touch-none group"
    >
      {highlight && (
        <div className="absolute inset-0 rounded-md border-2 border-dashed border-blue-500 pointer-events-none z-[120]" />
      )}

      <div
        className={[
          'bg-white p-3 rounded-md shadow-sm',
          highlight ? 'border-transparent' : 'border border-gray-200',
          // the cursor change makes it clear the whole card is draggable
          'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        ].join(' ')}
      >
        {/* content */}
        <div className="flex flex-col">
          {/* author */}
          <div className="text-xs text-gray-500 mb-1">{authorName}</div>

          {/* main text */}
          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{content}</p>

          {/* footer */}
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <EmojiReactions />
            <VoteControls initialScore={initialScore} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
