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
      { id: 'card1', type: 'card', authorName: 'Alex P.', content: 'Successful feature launch!', initialScore: 5 },
      { id: 'spacer1', type: 'spacer', name: 'Team Wins' },
      { id: 'card2', type: 'card', authorName: 'Jamie S.', content: 'Great collaboration on the new API.', initialScore: 3 },
    ],
  },
  {
    id: 'col2',
    title: "What Didn't Go So Well",
    description: 'Obstacles or areas for improvement.',
    items: [
      { id: 'card3', type: 'card', authorName: 'Casey L.', content: 'Unexpected bugs in staging.', initialScore: 0 },
      { id: 'card4', type: 'card', authorName: 'Morgan R.', content: 'Meeting overload this sprint.', initialScore: 2 },
      { id: 'spacer2', type: 'spacer', color: 'bg-yellow-200' },
      { id: 'card5', type: 'card', authorName: 'Riley B.', content: 'Documentation needs updating.', initialScore: 1 },
    ],
  },
  {
    id: 'col3',
    title: 'How Can We Improve',
    description: 'Actionable ideas for the next sprint.',
    items: [
      { id: 'card6', type: 'card', authorName: 'Taylor K.', content: 'Dedicate time for tech debt.', initialScore: 4 },
      { id: 'spacer3', type: 'spacer', name: 'Process Ideas', color: 'bg-blue-200' },
      { id: 'card7', type: 'card', authorName: 'Jordan M.', content: 'More pair programming sessions.', initialScore: 2 },
      { id: 'card8', type: 'card', authorName: 'Dev Team', content: 'Improve CI/CD pipeline speed.', initialScore: 0 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* DROP ANIMATION */
/* ------------------------------------------------------------------ */

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
};

/* ------------------------------------------------------------------ */
/* PAGE */
/* ------------------------------------------------------------------ */

const BoardPage: React.FC = () => {
  const [columns, setColumns] = React.useState<ColumnData[]>(initialBoardData);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  /* sensors */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* helpers */
  const findColumn = (id: string) =>
    columns.find(col => col.id === id || col.items.some(item => item.id === id));

  const getItem = (id: string): BoardItem | ColumnData | null => {
    for (const col of columns) {
      if (col.id === id) return col;
      const itm = col.items.find(i => i.id === id);
      if (itm) return itm;
    }
    return null;
  };

  /* dnd handlers */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? (event.over.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setOverId(null);

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

    const activeCol = findColumn(activeId);
    const overCol = findColumn(overId);
    if (!activeCol || !overCol) {
      setActiveId(null);
      return;
    }

    /* ---------- stacking logic ---------- */
    const activeItem = getItem(activeId) as BoardItem;
    const overItem = getItem(overId) as BoardItem;
    const canStack =
      activeItem.type === 'card' &&
      (overItem.type === 'card' || overItem.type === 'stack');

    if (canStack) {
      setColumns(prev => {
        const next = structuredClone(prev) as ColumnData[];

        /* remove active card from its column */
        const src = next.find(c => c.id === activeCol.id)!;
        src.items = src.items.filter(i => i.id !== activeId);

        /* destination column */
        const dst = next.find(c => c.id === overCol.id)!;

        if (overItem.type === 'card') {
          /* make new stack */
          const newStack: StackItem = {
            id: uuid(),
            type: 'stack',
            cards: [overItem, activeItem],
          };
          dst.items = dst.items.map(i => (i.id === overId ? newStack : i));
        } else {
          /* push into existing stack */
          const stack = dst.items.find(i => i.id === overId) as StackItem;
          stack.cards.push(activeItem);
        }
        return next;
      });
      setActiveId(null);
      return;
    }

    /* ---------- regular re-ordering logic ---------- */
    if (activeCol.id !== overCol.id) {
      /* moving across columns */
      setColumns(prev => {
        const next = structuredClone(prev) as ColumnData[];
        const src = next.find(c => c.id === activeCol.id)!;
        const moving = src.items.find(i => i.id === activeId)!;
        src.items = src.items.filter(i => i.id !== activeId);

        const dst = next.find(c => c.id === overCol.id)!;
        const overIdx = dst.items.findIndex(i => i.id === overId);
        dst.items.splice(overIdx, 0, moving);
        return next;
      });
    } else {
      /* re-ordering inside column */
      setColumns(prev => {
        const next = structuredClone(prev) as ColumnData[];
        const col = next.find(c => c.id === activeCol.id)!;
        const oldIdx = col.items.findIndex(i => i.id === activeId);
        const newIdx = col.items.findIndex(i => i.id === overId);
        col.items = arrayMove(col.items, oldIdx, newIdx);
        return next;
      });
    }

    setActiveId(null);
  };

  const unstack = (stackId: string) => {
    setColumns(prev =>
      prev.map(col => {
        const idx = col.items.findIndex(i => i.id === stackId && i.type === 'stack');
        if (idx === -1) return col;

        const stack = col.items[idx] as StackItem;
        const newItems = [...col.items];
        newItems.splice(idx, 1, ...stack.cards);
        return { ...col, items: newItems };
      }),
    );
  };

  /* NEW helpers just under the other stack helpers */
const cycleStackNext = (id: string) => {
  setColumns(prev =>
    prev.map(col => ({
      ...col,
      items: col.items.map(it => {
        if (it.type === 'stack' && it.id === id) {
          const [first, ...rest] = it.cards;
          return { ...it, cards: [...rest, first] };
        }
        return it;
      }),
    })),
  );
};

const cycleStackPrev = (id: string) => {
  setColumns(prev =>
    prev.map(col => ({
      ...col,
      items: col.items.map(it => {
        if (it.type === 'stack' && it.id === id) {
          const last = it.cards[it.cards.length - 1];
          const rest = it.cards.slice(0, -1);
          return { ...it, cards: [last, ...rest] };
        }
        return it;
      }),
    })),
  );
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
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              <Board>
                {columns.map(column => (
                  <Column
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    description={column.description}
                    items={column.items.map(i => i.id)}
                  >
                    <div className="mt-4 space-y-3">
                      {column.items.map(item => {
                        /* highlight must be strictly boolean */
                        const highlight =
                          overId === item.id &&
                          activeId !== null &&
                          activeId !== item.id;

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
                  items={activeEntity.items.map(i => i.id)}
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
                  onCycleNext={cycleStackNext}
                  onCyclePrev={cycleStackPrev}
                  onUnstack={() => {}}
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
