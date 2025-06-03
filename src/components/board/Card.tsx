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
  isDragOverlay?: boolean; // Optional prop to disable sortable functionality
}

const Card: React.FC<CardProps> = ({ id, authorName, content, initialScore, isDragOverlay = false }) => {
  // Only use sortable hook if not in drag overlay
  const sortable = isDragOverlay ? null : useSortable({ id });

  const style = isDragOverlay ? {} : sortable ? {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
  } : {};

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

  // If in drag overlay, return without sortable wrapper
  if (isDragOverlay) {
    return cardContent;
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
      {cardContent}
    </div>
  );
};

export default Card;