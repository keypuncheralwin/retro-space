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
  /* ------------------------------------------------------------------ */
  /* Always call the hook; disable it for overlay cards                  */
  /* ------------------------------------------------------------------ */
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isDragOverlay, // ← not draggable when overlay
  });

  /* ------------------------------------------------------------------ */
  /* Style – apply drag transforms only when the hook is enabled        */
  /* ------------------------------------------------------------------ */
  const wrapperStyle: React.CSSProperties = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform ?? null),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div
      /* Skip setNodeRef / drag props for overlay so it’s NOT droppable */
      ref={isDragOverlay ? undefined : setNodeRef}
      style={wrapperStyle}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      className={[
        'relative select-none',
        isDragOverlay ? '' : 'touch-none cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      {highlight && (
        <div className="absolute inset-0 rounded-md border-2 border-dashed border-blue-500 pointer-events-none z-[120]" />
      )}

      <div
        className={[
          'bg-white p-3 rounded-md shadow-sm',
          highlight ? 'border-transparent' : 'border border-gray-200',
          'hover:shadow-md transition-shadow',
        ].join(' ')}
      >
        {/* content */}
        <div className="flex flex-col">
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
};

export default Card;
