'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2 } from 'lucide-react';
import EmojiReactions from './EmojiReactions';
import VoteControls from './VoteControls';

interface CardProps {
  id: string;
  authorName: string;
  content: string;
  initialScore: number;
  isDragOverlay?: boolean;
  highlight?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Helper function to parse and render content with gifs
const renderContent = (content: string) => {
  // Regex to match markdown image syntax for gifs
  const gifRegex = /!\[gif\]\((https?:\/\/[^\)]+)\)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = gifRegex.exec(content)) !== null) {
    // Add text before the gif
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {textBefore}
          </span>,
        );
      }
    }

    // Add the gif
    parts.push(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`gif-${match.index}`}
        src={match[1]}
        alt="GIF image in card content"
        className="max-w-full h-auto rounded-md my-1 max-h-48 object-contain"
        loading="lazy"
      />,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last gif
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {remainingText}
        </span>,
      );
    }
  }

  // If no gifs found, return the original content
  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
};

const Card: React.FC<CardProps> = ({
  id,
  authorName,
  content,
  initialScore,
  isDragOverlay = false,
  highlight = false,
  onEdit,
  onDelete,
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
      /* Skip setNodeRef / drag props for overlay so it's NOT droppable */
      ref={isDragOverlay ? undefined : setNodeRef}
      style={wrapperStyle}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      className={[
        'relative select-none group',
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
        {/* Edit/Delete buttons - only show when not drag overlay */}
        {!isDragOverlay && (onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                className="p-1 bg-white rounded shadow-sm hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-colors"
                title="Edit card"
                aria-label="Edit card"
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
                title="Delete card"
                aria-label="Delete card"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}

        {/* content */}
        <div className="flex flex-col">
          <div className="text-xs text-gray-500 mb-1">{authorName}</div>
          <div className="text-sm text-gray-800 mb-2">{renderContent(content)}</div>
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
