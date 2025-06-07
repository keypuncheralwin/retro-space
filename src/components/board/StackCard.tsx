'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronUp, ChevronDown, Layers, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

import Card from './Card';
import type { CardItem } from '@/app/board/page';

/* ─── types ─── */
export interface StackItem {
  id: string;
  type: 'stack';
  cards: CardItem[];
}
interface StackProps {
  stack: StackItem;
  currentIndex: number;
  totalCards: number;
  onCycleNext: (id: string) => void;
  onCyclePrev: (id: string) => void;
  onUnstack: (id: string) => void;
  onEditCard?: (stackId: string, cardId: string) => void;
  onDeleteCard?: (stackId: string, cardId: string) => void;
  highlight?: boolean;
  isDragOverlay?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

/* ─── visual constants ─── */
const OFFSET_Y = 10;
const SCALE_STEP = 0.04;
const MAX_GHOSTS = 3;
const SHADOW = '0 3px 8px rgba(0 0 0 / .08)';

/* ─── Rolodex flip variants ─── */
const deckVariants: Variants = {
  enter: (dir: 1 | -1) => ({ rotateX: dir === 1 ? 90 : -90, y: dir === 1 ? -40 : 40, opacity: 0 }),
  center: { rotateX: 0, y: 0, opacity: 1 },
  exit: (dir: 1 | -1) => ({ rotateX: dir === 1 ? -90 : 90, y: dir === 1 ? 40 : -40, opacity: 0 }),
};

const StackCard: React.FC<StackProps> = ({
  stack,
  currentIndex,
  totalCards,
  onCycleNext,
  onCyclePrev,
  onUnstack,
  onEditCard,
  onDeleteCard,
  highlight = false,
  isDragOverlay = false,
  currentUserId,
  currentUserName,
}) => {
  /* dnd-kit */
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stack.id,
    disabled: isDragOverlay,
  });

  /* direction for framer (1 ▼, −1 ▲) */
  const [dir, setDir] = useState<1 | -1>(1);

  /* ghost sheets & spacing */
  const ghosts = Math.min(Math.max(stack.cards.length - 1, 0), MAX_GHOSTS);
  const gapBelow = ghosts * OFFSET_Y;
  const [top] = stack.cards;

  /* wrapper style */
  const wrapperStyle: React.CSSProperties = isDragOverlay
    ? { perspective: 900 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: gapBelow,
        perspective: 900,
      };

  /* click helpers */
  const handleNext = () => {
    setDir(1);
    onCycleNext(stack.id);
  };
  const handlePrev = () => {
    setDir(-1);
    onCyclePrev(stack.id);
  };

  const handleEditCard = () => {
    if (onEditCard && top) {
      onEditCard(stack.id, top.id);
    }
  };

  const handleDeleteCard = () => {
    if (onDeleteCard && top) {
      onDeleteCard(stack.id, top.id);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={wrapperStyle}
      layout
      {...attributes}
      {...listeners}
      className="relative touch-none select-none group cursor-grab active:cursor-grabbing"
    >
      {/* drop-hint */}
      {highlight && (
        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-blue-500 pointer-events-none z-[120]" />
      )}

      {/* ghost sheets */}
      {Array.from({ length: ghosts }).map((_, i) => {
        const d = ghosts - i;
        return (
          <div
            key={i}
            className="absolute inset-0 bg-white rounded-lg pointer-events-none"
            style={{
              transformOrigin: 'left top',
              transform: `translateY(${d * OFFSET_Y}px) scale(${1 - d * SCALE_STEP})`,
              boxShadow: SHADOW,
              zIndex: i,
            }}
          />
        );
      })}

      {/* animated top card */}
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={top.id}
          custom={dir}
          variants={deckVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative z-[100]"
        >
          <Card
            id={top.id}
            authorName={top.authorName}
            content={top.content}
            initialScore={top.initialScore}
            isDragOverlay
            highlight={highlight}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </motion.div>
      </AnimatePresence>

      {/* Edit/Delete buttons for current card - only show when not drag overlay */}
      {!isDragOverlay && (onEditCard || onDeleteCard) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-[110]">
          {onEditCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditCard();
              }}
              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-colors"
              title="Edit current card"
              aria-label="Edit current card"
            >
              <Edit2 size={12} />
            </button>
          )}
          {onDeleteCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCard();
              }}
              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50 text-gray-600 hover:text-red-600 transition-colors"
              title="Delete current card"
              aria-label="Delete current card"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      {/* ▲ ▼ Unstack buttons with counter */}
      {!isDragOverlay && (
        <div className="absolute -top-4 right-2 flex items-center gap-1 z-[110]">
          <div className="px-2 py-1 bg-white rounded-md shadow text-xs font-medium text-gray-600 border border-gray-200">
            {currentIndex}/{totalCards}
          </div>
          <button
            className="size-6 flex items-center justify-center rounded-md bg-white shadow hover:bg-gray-50 active:scale-95"
            onClick={handlePrev}
            title="Previous card"
          >
            <ChevronUp size={14} />
          </button>
          <button
            className="size-6 flex items-center justify-center rounded-md bg-white shadow hover:bg-gray-50 active:scale-95"
            onClick={handleNext}
            title="Next card"
          >
            <ChevronDown size={14} />
          </button>
          <button
            className="size-6 flex items-center justify-center rounded-md bg-white shadow hover:bg-gray-50 active:scale-95"
            onClick={() => onUnstack(stack.id)}
            title="Unstack"
          >
            <Layers size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default StackCard;
