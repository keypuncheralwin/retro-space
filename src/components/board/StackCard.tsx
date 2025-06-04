'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronUp,
  ChevronDown,
  GripVertical,
  Layers,
} from 'lucide-react';

import Card from './Card';
import type { CardItem } from '@/app/board/page';

/* types */
export interface StackItem {
  id: string;
  type: 'stack';
  cards: CardItem[];
}

interface StackProps {
  stack: StackItem;
  onCycleNext: (id: string) => void;
  onCyclePrev: (id: string) => void;
  onUnstack:   (id: string) => void;
  highlight?: boolean;
  isDragOverlay?: boolean;
}

/* style constants */
const OFFSET_Y   = 10;
const SCALE_STEP = 0.04;
const MAX_GHOSTS = 3;
const SHADOW     = '0 3px 8px rgba(0 0 0 / .08)';

const StackCard: React.FC<StackProps> = ({
  stack,
  onCycleNext,
  onCyclePrev,
  onUnstack,
  highlight = false,
  isDragOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stack.id, disabled: isDragOverlay });

  const ghosts = Math.min(Math.max(stack.cards.length - 1, 0), MAX_GHOSTS);
  const bottomGap = ghosts * OFFSET_Y;
  const [top] = stack.cards;

  const wrapperStyle: React.CSSProperties = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: bottomGap,
      };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      {...attributes}
      {...listeners}
      className="relative touch-none select-none"
    >
      {/* dashed drop-hint */}
      {highlight && (
        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-blue-500 pointer-events-none z-[120]" />
      )}

      {/* ghost sheets */}
      {Array.from({ length: ghosts }).map((_, i) => {
        const d   = ghosts - i;
        const y   = d * OFFSET_Y;
        const s   = 1 - d * SCALE_STEP;
        return (
          <div
            key={i}
            className="absolute inset-0 bg-white rounded-lg pointer-events-none"
            style={{
              transformOrigin: 'left top',
              transform: `translateY(${y}px) scale(${s})`,
              boxShadow: SHADOW,
              zIndex: i,
            }}
          />
        );
      })}

      {/* top card */}
      <div className="relative z-[100]">
        <Card
          id={top.id}
          authorName={top.authorName}
          content={top.content}
          initialScore={top.initialScore}
          isDragOverlay
          /* hide its own grey border while highlight */
          highlight={highlight}
        />
      </div>

      {/* drag handle */}
      {!isDragOverlay && (
        <div className="absolute top-2 left-2 z-[110] opacity-0 group-hover:opacity-100 cursor-grab text-gray-400">
          <GripVertical size={16} />
        </div>
      )}

      {/* ▲ ▼ Unstack */}
      {!isDragOverlay && (
        <div className="absolute -top-4 right-2 flex gap-1 z-[110]">
          <button
            className="size-6 flex items-center justify-center rounded-md bg-white shadow hover:bg-gray-50 active:scale-95"
            title="Show previous"
            onClick={() => onCyclePrev(stack.id)}
          >
            <ChevronUp size={14} />
          </button>
          <button
            className="size-6 flex items-center justify-center rounded-md bg-white shadow hover:bg-gray-50 active:scale-95"
            title="Show next"
            onClick={() => onCycleNext(stack.id)}
          >
            <ChevronDown size={14} />
          </button>
          <button
            className="size-6 flex items-center justify-center rounded-md bg-white shadow hover:bg-gray-50 active:scale-95"
            title="Unstack"
            onClick={() => onUnstack(stack.id)}
          >
            <Layers size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StackCard;
