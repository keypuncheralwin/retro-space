'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuid } from 'uuid';

import Board from '@/components/board/Board';
import Column from '@/components/board/Column';
import Card from '@/components/board/Card';
import StackCard, { StackItem } from '@/components/board/StackCard';
import Spacer from '@/components/board/Spacer';
import BoardSkeleton from '@/components/skeletons/BoardSkeleton';
import ClientOnly from '@/components/wrappers/ClientOnly';

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

export interface CardItem {
  id: string;
  type: 'card';
  authorName: string;
  content: string;
  initialScore: number;
}

export interface SpacerItem {
  id: string;
  type: 'spacer';
  name?: string;
  color?: string;
}

export type BoardItem = CardItem | SpacerItem | StackItem;

interface ColumnData {
  id: string;
  title: string;
  description: string;
  items: BoardItem[];
}

/* ------------------------------------------------------------------ */
/* SAMPLE DATA */
/* ------------------------------------------------------------------ */

const initialBoardData: ColumnData[] = [
  {
    id: 'col1',
    title: 'What Went Well',
    description: 'Things that made us happy or productive.',
    items: [
      {
        id: 'card1',
        type: 'card',
        authorName: 'Alex P.',
        content: 'Successful feature launch!',
        initialScore: 5,
      },
      { id: 'spacer1', type: 'spacer', name: 'Team Wins' },
      {
        id: 'card2',
        type: 'card',
        authorName: 'Jamie S.',
        content: 'Great collaboration on the new API.',
        initialScore: 3,
      },
    ],
  },
  {
    id: 'col2',
    title: "What Didn't Go So Well",
    description: 'Obstacles or areas for improvement.',
    items: [
      {
        id: 'card3',
        type: 'card',
        authorName: 'Casey L.',
        content: 'Unexpected bugs in staging.',
        initialScore: 0,
      },
      {
        id: 'card4',
        type: 'card',
        authorName: 'Morgan R.',
        content: 'Meeting overload this sprint.',
        initialScore: 2,
      },
      { id: 'spacer2', type: 'spacer', color: 'bg-yellow-200' },
      {
        id: 'card5',
        type: 'card',
        authorName: 'Riley B.',
        content: 'Documentation needs updating.',
        initialScore: 1,
      },
    ],
  },
  {
    id: 'col3',
    title: 'How Can We Improve',
    description: 'Actionable ideas for the next sprint.',
    items: [
      {
        id: 'card6',
        type: 'card',
        authorName: 'Taylor K.',
        content: 'Dedicate time for tech debt.',
        initialScore: 4,
      },
      { id: 'spacer3', type: 'spacer', name: 'Process Ideas', color: 'bg-blue-200' },
      {
        id: 'card7',
        type: 'card',
        authorName: 'Jordan M.',
        content: 'More pair programming sessions.',
        initialScore: 2,
      },
      {
        id: 'card8',
        type: 'card',
        authorName: 'Dev Team',
        content: 'Improve CI/CD pipeline speed.',
        initialScore: 0,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* DROP ANIMATION */
/* ------------------------------------------------------------------ */

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: {} },
  }),
};

/* ------------------------------------------------------------------ */
/* PAGE */
/*
 * Drag & Drop Behavior:
 * - Cards can be reordered by quick drag & drop
 * - Cards stack only after hovering over another card/stack for STACK_DELAY ms
 * - Blue highlight appears when stacking mode is active
 * - Columns can be reordered by dragging
 */
/* ------------------------------------------------------------------ */

const BoardPage: React.FC = () => {
  const [columns, setColumns] = React.useState<ColumnData[]>(initialBoardData);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [stackingEnabled, setStackingEnabled] = React.useState(false);
  const [stackIndices, setStackIndices] = React.useState<Record<string, number>>({});
  const stackTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const STACK_DELAY = 600; // ms

  // used inside handleDragOver:
  // ‣ rafRef   → stores the current requestAnimationFrame handle so we can cancel it
  //              (throttles setColumns to max-1 per frame, preventing update-storms on mobile)
  const rafRef = React.useRef<number | null>(null);
  // ‣ lastPreviewRef → remembers the last {column, overId} slot we showed the
  //                    “gap preview” for; if the pointer is still over the same slot
  //                    we skip the expensive state update entirely
  const lastPreviewRef = React.useRef<{ colId: string; overId: string } | null>(null);

  /* sensors */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* cleanup timeout on unmount */
  React.useEffect(() => {
    return () => {
      if (stackTimeoutRef.current) {
        clearTimeout(stackTimeoutRef.current);
      }
    };
  }, []);

  /* helpers */
  const findColumn = (id: string) =>
    columns.find((col) => col.id === id || col.items.some((item) => item && item.id === id));

  const getItem = (id: string): BoardItem | ColumnData | null => {
    for (const col of columns) {
      if (col.id === id) return col;
      const itm = col.items.find((i) => i && i.id === id);
      if (itm) return itm;
    }
    return null;
  };

  /* dnd handlers */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setStackingEnabled(false);

    // Clear any existing timeout
    if (stackTimeoutRef.current) {
      clearTimeout(stackTimeoutRef.current);
      stackTimeoutRef.current = null;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const newOverId = over ? (over.id as string) : null;

    /* ── STACK_DELAY ms stacking-timer block ─────────────────────────── */
    if (stackTimeoutRef.current) clearTimeout(stackTimeoutRef.current);
    setStackingEnabled(false);
    setOverId(newOverId);

    if (!active || !over || active.id === over.id || !activeId || !newOverId) {
      return;
    }

    const activeItem = getItem(activeId) as BoardItem;
    const overItem = getItem(newOverId) as BoardItem;
    const activeCol = findColumn(activeId);
    const overCol = findColumn(newOverId);

    /* potential stacking */
    const canPotentiallyStack =
      activeItem?.type === 'card' && (overItem?.type === 'card' || overItem?.type === 'stack');

    if (canPotentiallyStack) {
      stackTimeoutRef.current = setTimeout(() => setStackingEnabled(true), STACK_DELAY);
    }

    /* ---------------- live preview --------------------------------- */

    if (!stackingEnabled && activeCol && overCol) {
      // 1️⃣ Skip if preview is already correct
      if (
        lastPreviewRef.current &&
        lastPreviewRef.current.colId === overCol.id &&
        lastPreviewRef.current.overId === newOverId
      ) {
        return;
      }
      lastPreviewRef.current = { colId: overCol.id, overId: newOverId };

      // 2️⃣ Only one state change per frame on mobile
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setColumns((prev) => {
          const next = structuredClone(prev) as ColumnData[];

          const src = next.find((c) => c.id === activeCol.id)!;
          const dst = next.find((c) => c.id === overCol.id)!;

          /* remove from source */
          const movingIdx = src.items.findIndex((i) => i && i.id === activeId);
          if (movingIdx === -1) return prev; // safety
          const [moving] = src.items.splice(movingIdx, 1);

          /* insert into destination */
          const overIdx = dst.items.findIndex((i) => i && i.id === newOverId);
          dst.items.splice(overIdx === -1 ? dst.items.length : overIdx, 0, moving);

          return next;
        });
        rafRef.current = null;
      });
    }
  };

  /* cleanup the RAF on unmount */
  React.useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setOverId(null);
    setStackingEnabled(false);

    // Clear timeout
    if (stackTimeoutRef.current) {
      clearTimeout(stackTimeoutRef.current);
      stackTimeoutRef.current = null;
    }

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) {
      setActiveId(null);
      return;
    }

    // Check if we're dragging columns
    const activeIsColumn = columns.some((col) => col.id === activeId);
    const overIsColumn = columns.some((col) => col.id === overId);

    if (activeIsColumn && overIsColumn) {
      /* ---------- column reordering logic ---------- */
      setColumns((prev) => {
        const oldIndex = prev.findIndex((col) => col.id === activeId);
        const newIndex = prev.findIndex((col) => col.id === overId);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setActiveId(null);
      return;
    }

    // If not column reordering, proceed with item logic
    const activeCol = findColumn(activeId);
    const overCol = findColumn(overId);
    if (!activeCol || !overCol) {
      setActiveId(null);
      return;
    }

    /* ---------- stacking logic (only if stacking is enabled after hover delay) ---------- */
    const activeItem = getItem(activeId) as BoardItem;
    const overItem = getItem(overId) as BoardItem;

    // Add safety check to ensure items exist (only for non-column operations)
    if (!activeItem || !overItem) {
      setActiveId(null);
      return;
    }

    const canStack =
      stackingEnabled && // Only stack if we've hovered long enough
      activeItem.type === 'card' &&
      (overItem.type === 'card' || overItem.type === 'stack');

    if (canStack) {
      setColumns((prev) => {
        const next = structuredClone(prev) as ColumnData[];

        /* remove active card from its column */
        const src = next.find((c) => c.id === activeCol.id)!;
        src.items = src.items.filter((i) => i && i.id !== activeId);

        /* destination column */
        const dst = next.find((c) => c.id === overCol.id)!;

        if (overItem.type === 'card') {
          /* make new stack */
          const newStackId = uuid();
          const newStack: StackItem = {
            id: newStackId,
            type: 'stack',
            cards: [overItem, activeItem],
          };
          dst.items = dst.items.map((i) => (i && i.id === overId ? newStack : i));

          // Initialize stack index to 0 (first card)
          setStackIndices((prev) => ({ ...prev, [newStackId]: 0 }));
        } else {
          /* push into existing stack */
          const stack = dst.items.find((i) => i && i.id === overId) as StackItem;
          if (stack) {
            stack.cards.push(activeItem);
          }
        }

        // Filter out any undefined items as a safety measure
        return next.map((col) => ({
          ...col,
          items: col.items.filter((item) => item != null),
        }));
      });
      setActiveId(null);
      return;
    }

    /* ---------- regular re-ordering logic ---------- */
    if (activeCol.id !== overCol.id) {
      /* moving across columns */
      setColumns((prev) => {
        const next = structuredClone(prev) as ColumnData[];
        const src = next.find((c) => c.id === activeCol.id)!;
        const moving = src.items.find((i) => i && i.id === activeId)!;

        if (!moving) {
          return prev; // Safety check: if item not found, return unchanged state
        }

        src.items = src.items.filter((i) => i && i.id !== activeId);

        const dst = next.find((c) => c.id === overCol.id)!;
        const overIdx = dst.items.findIndex((i) => i && i.id === overId);

        if (overIdx !== -1) {
          dst.items.splice(overIdx, 0, moving);
        } else {
          // If overIdx not found, add to end
          dst.items.push(moving);
        }

        // Filter out any undefined items as a safety measure
        return next.map((col) => ({
          ...col,
          items: col.items.filter((item) => item != null),
        }));
      });
    } else {
      /* re-ordering inside column */
      setColumns((prev) => {
        const next = structuredClone(prev) as ColumnData[];
        const col = next.find((c) => c.id === activeCol.id)!;
        const oldIdx = col.items.findIndex((i) => i && i.id === activeId);
        const newIdx = col.items.findIndex((i) => i && i.id === overId);

        if (oldIdx !== -1 && newIdx !== -1) {
          col.items = arrayMove(col.items, oldIdx, newIdx);
        }

        // Filter out any undefined items as a safety measure
        return next.map((c) => ({
          ...c,
          items: c.items.filter((item) => item != null),
        }));
      });
    }

    setActiveId(null);
  };

  const unstack = (stackId: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        const idx = col.items.findIndex((i) => i && i.id === stackId && i.type === 'stack');
        if (idx === -1) return col;

        const stack = col.items[idx] as StackItem;
        const newItems = [...col.items];
        newItems.splice(idx, 1, ...stack.cards);
        return {
          ...col,
          items: newItems.filter((item) => item != null), // Safety filter
        };
      }),
    );

    // Remove the stack index when unstacking
    setStackIndices((prev) => {
      const next = { ...prev };
      delete next[stackId];
      return next;
    });
  };

  /* stack cycling helpers */
  const cycleStackNext = (id: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items
          .map((it) => {
            if (it && it.type === 'stack' && it.id === id) {
              const [first, ...rest] = it.cards;
              return { ...it, cards: [...rest, first] };
            }
            return it;
          })
          .filter((item) => item != null), // Safety filter
      })),
    );

    // Update the stack index
    setStackIndices((prev) => {
      const stack = getItem(id) as StackItem;
      if (!stack || stack.type !== 'stack') return prev;

      const currentIndex = prev[id] || 0;
      const nextIndex = (currentIndex + 1) % stack.cards.length;
      return { ...prev, [id]: nextIndex };
    });
  };

  const cycleStackPrev = (id: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items
          .map((it) => {
            if (it && it.type === 'stack' && it.id === id) {
              const last = it.cards[it.cards.length - 1];
              const rest = it.cards.slice(0, -1);
              return { ...it, cards: [last, ...rest] };
            }
            return it;
          })
          .filter((item) => item != null), // Safety filter
      })),
    );

    // Update the stack index
    setStackIndices((prev) => {
      const stack = getItem(id) as StackItem;
      if (!stack || stack.type !== 'stack') return prev;

      const currentIndex = prev[id] || 0;
      const nextIndex = currentIndex === 0 ? stack.cards.length - 1 : currentIndex - 1;
      return { ...prev, [id]: nextIndex };
    });
  };

  /* active overlay item */
  const activeEntity = activeId ? getItem(activeId) : null;

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  return (
    <div className="h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <header className="mb-6 w-full max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">Sprint Retrospective Board</h1>
      </header>

      <ClientOnly fallback={<BoardSkeleton />}>
        <div className="w-full max-w-7xl">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((c) => c.id)}
              strategy={horizontalListSortingStrategy}
            >
              <Board>
                {columns.map((column) => (
                  <Column
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    description={column.description}
                    items={column.items.filter((i) => i != null).map((i) => i.id)}
                  >
                    <div className="mt-4 space-y-3">
                      {column.items
                        .filter((item) => item != null)
                        .map((item) => {
                          // Get the active item being dragged
                          const activeItem = activeId ? (getItem(activeId) as BoardItem) : null;

                          // Check if we're in stacking mode
                          const isStackingCandidate =
                            activeItem?.type === 'card' &&
                            (item.type === 'card' || item.type === 'stack');

                          // Only show stacking highlight if stacking is enabled and this is the target
                          const highlight =
                            overId === item.id &&
                            activeId !== null &&
                            activeId !== item.id &&
                            isStackingCandidate &&
                            stackingEnabled; // Only highlight when stacking is actually enabled

                          if (item.type === 'card') {
                            return (
                              <Card
                                key={item.id}
                                id={item.id}
                                authorName={item.authorName}
                                content={item.content}
                                initialScore={item.initialScore}
                                highlight={highlight}
                              />
                            );
                          }
                          if (item.type === 'spacer') {
                            return (
                              <Spacer
                                key={item.id}
                                id={item.id}
                                name={item.name}
                                color={item.color}
                              />
                            );
                          }
                          if (item.type === 'stack') {
                            return (
                              <StackCard
                                key={item.id}
                                stack={item}
                                currentIndex={(stackIndices[item.id] || 0) + 1}
                                totalCards={item.cards.length}
                                onCycleNext={cycleStackNext}
                                onCyclePrev={cycleStackPrev}
                                onUnstack={unstack}
                                highlight={highlight}
                              />
                            );
                          }
                          return null;
                        })}
                    </div>
                  </Column>
                ))}
              </Board>
            </SortableContext>

            {/* overlay */}
            <DragOverlay dropAnimation={dropAnimation}>
              {activeEntity && 'title' in activeEntity ? (
                <Column
                  id={activeEntity.id}
                  title={activeEntity.title}
                  description={activeEntity.description}
                  items={activeEntity.items.filter((i) => i != null).map((i) => i.id)}
                  isDragOverlay
                >
                  <div className="mt-4 space-y-3" />
                </Column>
              ) : activeEntity && (activeEntity as BoardItem).type === 'card' ? (
                <Card
                  id={activeEntity.id}
                  authorName={(activeEntity as CardItem).authorName}
                  content={(activeEntity as CardItem).content}
                  initialScore={(activeEntity as CardItem).initialScore}
                  isDragOverlay
                />
              ) : activeEntity && (activeEntity as BoardItem).type === 'stack' ? (
                <StackCard
                  stack={activeEntity as StackItem}
                  currentIndex={1}
                  totalCards={(activeEntity as StackItem).cards.length}
                  onCycleNext={cycleStackNext}
                  onCyclePrev={cycleStackPrev}
                  onUnstack={() => {}}
                  isDragOverlay
                />
              ) : activeEntity && (activeEntity as BoardItem).type === 'spacer' ? (
                <Spacer id={activeEntity.id} isDragOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </ClientOnly>
    </div>
  );
};

export default BoardPage;
