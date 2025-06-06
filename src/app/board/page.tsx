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
  participantId: string;
  createdAt: Date;
}

export interface SpacerItem {
  id: string;
  type: 'spacer';
  name?: string;
  color?: string;
  participantId: string;
  createdAt: Date;
}

export type BoardItem = CardItem | SpacerItem | StackItem;

interface ColumnData {
  id: string;
  title: string;
  description: string;
  items: BoardItem[];
}

interface EditingItem {
  id: string;
  type: 'card' | 'spacer';
  content: string;
  columnId: string;
  stackId?: string; // For editing cards within stacks
}

/* ------------------------------------------------------------------ */
/* MOCK PARTICIPANT DATA */
/* ------------------------------------------------------------------ */

const MOCK_PARTICIPANTS = [
  { id: 'user-1', name: 'Alex P.' },
  { id: 'user-2', name: 'Jamie S.' },
  { id: 'user-3', name: 'Casey L.' },
  { id: 'user-4', name: 'Morgan R.' },
  { id: 'user-5', name: 'Riley B.' },
  { id: 'user-6', name: 'Taylor K.' },
  { id: 'user-7', name: 'Jordan M.' },
];

// Mock current user - in real app this would come from auth/context
const CURRENT_USER = MOCK_PARTICIPANTS[0];

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
        participantId: 'user-1',
        createdAt: new Date('2025-01-01T10:00:00Z'),
      },
      {
        id: 'spacer1',
        type: 'spacer',
        name: 'Team Wins',
        participantId: 'user-1',
        createdAt: new Date('2025-01-01T10:05:00Z'),
      },
      {
        id: 'card2',
        type: 'card',
        authorName: 'Jamie S.',
        content: 'Great collaboration on the new API.',
        initialScore: 3,
        participantId: 'user-2',
        createdAt: new Date('2025-01-01T10:10:00Z'),
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
        participantId: 'user-3',
        createdAt: new Date('2025-01-01T10:15:00Z'),
      },
      {
        id: 'card4',
        type: 'card',
        authorName: 'Morgan R.',
        content: 'Meeting overload this sprint.',
        initialScore: 2,
        participantId: 'user-4',
        createdAt: new Date('2025-01-01T10:20:00Z'),
      },
      {
        id: 'spacer2',
        type: 'spacer',
        color: 'bg-yellow-200',
        participantId: 'user-4',
        createdAt: new Date('2025-01-01T10:25:00Z'),
      },
      {
        id: 'card5',
        type: 'card',
        authorName: 'Riley B.',
        content: 'Documentation needs updating.',
        initialScore: 1,
        participantId: 'user-5',
        createdAt: new Date('2025-01-01T10:30:00Z'),
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
        participantId: 'user-6',
        createdAt: new Date('2025-01-01T10:35:00Z'),
      },
      {
        id: 'spacer3',
        type: 'spacer',
        name: 'Process Ideas',
        color: 'bg-blue-200',
        participantId: 'user-6',
        createdAt: new Date('2025-01-01T10:40:00Z'),
      },
      {
        id: 'card7',
        type: 'card',
        authorName: 'Jordan M.',
        content: 'More pair programming sessions.',
        initialScore: 2,
        participantId: 'user-7',
        createdAt: new Date('2025-01-01T10:45:00Z'),
      },
      {
        id: 'card8',
        type: 'card',
        authorName: 'Dev Team',
        content: 'Improve CI/CD pipeline speed.',
        initialScore: 0,
        participantId: 'user-7',
        createdAt: new Date('2025-01-01T10:50:00Z'),
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
/* ------------------------------------------------------------------ */

const BoardPage: React.FC = () => {
  const [columns, setColumns] = React.useState<ColumnData[]>(initialBoardData);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [stackingEnabled, setStackingEnabled] = React.useState(false);
  const [stackIndices, setStackIndices] = React.useState<Record<string, number>>({});

  // Separate state for card and spacer inputs
  const [activeCardInputs, setActiveCardInputs] = React.useState<Set<string>>(new Set());
  const [activeSpacerInputs, setActiveSpacerInputs] = React.useState<Set<string>>(new Set());

  // Edit state
  const [editingItem, setEditingItem] = React.useState<EditingItem | null>(null);

  const stackTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const STACK_DELAY = 600; // ms

  const rafRef = React.useRef<number | null>(null);
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

  /* ------------------------------------------------------------------ */
  /* ADD ITEM HANDLERS */
  /* ------------------------------------------------------------------ */

  // Card handlers
  const addCard = (columnId: string) => {
    // Close any active inputs and editing
    setActiveSpacerInputs((prev) => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
    setEditingItem(null);

    setActiveCardInputs((prev) => new Set(prev).add(columnId));
  };

  const saveCardInput = (columnId: string, content: string) => {
    const newCard: CardItem = {
      id: uuid(),
      type: 'card',
      authorName: CURRENT_USER.name,
      content: content,
      initialScore: 0,
      participantId: CURRENT_USER.id,
      createdAt: new Date(),
    };

    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, items: [...col.items, newCard] } : col)),
    );

    // Remove the input
    setActiveCardInputs((prev) => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
  };

  const cancelCardInput = (columnId: string) => {
    setActiveCardInputs((prev) => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
  };

  // Spacer handlers
  const addSpacer = (columnId: string) => {
    // Close any active inputs and editing
    setActiveCardInputs((prev) => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
    setEditingItem(null);

    setActiveSpacerInputs((prev) => new Set(prev).add(columnId));
  };

  const saveSpacerInput = (columnId: string, content: string) => {
    const newSpacer: SpacerItem = {
      id: uuid(),
      type: 'spacer',
      name: content.trim() || 'New section',
      color: 'bg-gray-200',
      participantId: CURRENT_USER.id,
      createdAt: new Date(),
    };

    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, items: [...col.items, newSpacer] } : col)),
    );

    setActiveSpacerInputs((prev) => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
  };

  const cancelSpacerInput = (columnId: string) => {
    setActiveSpacerInputs((prev) => {
      const next = new Set(prev);
      next.delete(columnId);
      return next;
    });
  };

  /* ------------------------------------------------------------------ */
  /* EDIT/DELETE HANDLERS */
  /* ------------------------------------------------------------------ */

  const editCard = (cardId: string) => {
    // Close any active inputs
    setActiveCardInputs(new Set());
    setActiveSpacerInputs(new Set());

    // Find the card and its column
    const column = findColumn(cardId);
    if (!column) return;

    const item = getItem(cardId) as CardItem;
    if (!item || item.type !== 'card') return;

    setEditingItem({
      id: cardId,
      type: 'card',
      content: item.content,
      columnId: column.id,
    });
  };

  const editStackCard = (stackId: string, cardId: string) => {
    // Close any active inputs
    setActiveCardInputs(new Set());
    setActiveSpacerInputs(new Set());

    // Find the stack and its column
    const column = findColumn(stackId);
    if (!column) return;

    const stack = getItem(stackId) as StackItem;
    if (!stack || stack.type !== 'stack') return;

    const card = stack.cards.find((c) => c.id === cardId);
    if (!card) return;

    setEditingItem({
      id: cardId,
      type: 'card',
      content: card.content,
      columnId: column.id,
      stackId: stackId,
    });
  };

  const editSpacer = (spacerId: string) => {
    // Close any active inputs
    setActiveCardInputs(new Set());
    setActiveSpacerInputs(new Set());

    // Find the spacer and its column
    const column = findColumn(spacerId);
    if (!column) return;

    const item = getItem(spacerId) as SpacerItem;
    if (!item || item.type !== 'spacer') return;

    setEditingItem({
      id: spacerId,
      type: 'spacer',
      content: item.name || '',
      columnId: column.id,
    });
  };

  const saveEdit = (content: string) => {
    if (!editingItem) return;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id !== editingItem.columnId) return col;

        if (editingItem.stackId) {
          // Editing a card within a stack
          return {
            ...col,
            items: col.items.map((item) => {
              if (item && item.type === 'stack' && item.id === editingItem.stackId) {
                return {
                  ...item,
                  cards: item.cards.map((card) =>
                    card.id === editingItem.id ? { ...card, content } : card,
                  ),
                };
              }
              return item;
            }),
          };
        } else {
          // Editing a regular item
          return {
            ...col,
            items: col.items.map((item) => {
              if (item && item.id === editingItem.id) {
                if (editingItem.type === 'card') {
                  return { ...item, content } as CardItem;
                } else if (editingItem.type === 'spacer') {
                  return { ...item, name: content.trim() || 'New section' } as SpacerItem;
                }
              }
              return item;
            }),
          };
        }
      }),
    );

    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const deleteCard = (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items.filter((item) => item && item.id !== cardId),
      })),
    );
  };

  const deleteStackCard = (stackId: string, cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items
          .map((item) => {
            if (item && item.type === 'stack' && item.id === stackId) {
              const newCards = item.cards.filter((card) => card.id !== cardId);

              // If only one card left, unstack it
              if (newCards.length === 1) {
                return newCards[0];
              }

              // If no cards left, remove the stack entirely
              if (newCards.length === 0) {
                return null;
              }

              return { ...item, cards: newCards };
            }
            return item;
          })
          .filter((item) => item !== null),
      })),
    );

    // Clean up stack index if stack was removed
    setStackIndices((prev) => {
      const next = { ...prev };
      const stack = getItem(stackId) as StackItem;
      if (!stack || stack.type !== 'stack') {
        delete next[stackId];
      }
      return next;
    });
  };

  const deleteSpacer = (spacerId: string) => {
    if (!confirm('Are you sure you want to delete this spacer?')) return;

    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items.filter((item) => item && item.id !== spacerId),
      })),
    );
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
                    onAddCard={() => addCard(column.id)}
                    onAddSpacer={() => addSpacer(column.id)}
                    // Card input props
                    showCardInput={activeCardInputs.has(column.id)}
                    onSaveCard={(content) => saveCardInput(column.id, content)}
                    onCancelCard={() => cancelCardInput(column.id)}
                    // Spacer input props
                    showSpacerInput={activeSpacerInputs.has(column.id)}
                    onSaveSpacer={(content) => saveSpacerInput(column.id, content)}
                    onCancelSpacer={() => cancelSpacerInput(column.id)}
                    // Edit props
                    editingItem={editingItem?.columnId === column.id ? editingItem : null}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    currentUserName={CURRENT_USER.name}
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
                                onEdit={editCard}
                                onDelete={deleteCard}
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
                                onEdit={editSpacer}
                                onDelete={deleteSpacer}
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
                                onEditCard={editStackCard}
                                onDeleteCard={deleteStackCard}
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
                  onAddCard={() => {}}
                  onAddSpacer={() => {}}
                  showCardInput={false}
                  onSaveCard={() => {}}
                  onCancelCard={() => {}}
                  showSpacerInput={false}
                  onSaveSpacer={() => {}}
                  onCancelSpacer={() => {}}
                  currentUserName=""
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
