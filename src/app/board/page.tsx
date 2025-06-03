'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
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
import Column from '@/components/board/Column';
import Card from '@/components/board/Card';
import Spacer from '@/components/board/Spacer';
import Board from '@/components/board/Board';

// Define simple types for our local data
interface CardItem {
  id: string;
  type: 'card';
  authorName: string;
  content: string;
  initialScore: number;
}

interface SpacerItem {
  id: string;
  type: 'spacer';
  name?: string;
  color?: string;
}

interface ColumnData {
  id: string;
  title: string;
  description: string;
  items: (CardItem | SpacerItem)[];
}

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

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const BoardPage: React.FC = () => {
  const [columns, setColumns] = React.useState<ColumnData[]>(initialBoardData);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find which column an item belongs to
  const findColumn = (id: string): ColumnData | undefined => {
    return columns.find(col => 
      col.id === id || (col.items && col.items.some(item => item && item.id === id))
    );
  };

  // Get the active item data
  const getActiveItem = () => {
    if (!activeId) return null;
    
    // Check if it's a column
    const column = columns.find(col => col.id === activeId);
    if (column) return column;
    
    // Otherwise, find the item in columns
    for (const col of columns) {
      const item = col.items.find(item => item && item.id === activeId);
      if (item) return item;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which columns the active and over items belong to
    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) return;

    // If the item is being moved to a different column
    if (activeColumn.id !== overColumn.id) {
      setColumns(prevColumns => {
        const activeColumnIndex = prevColumns.findIndex(col => col.id === activeColumn.id);
        const overColumnIndex = prevColumns.findIndex(col => col.id === overColumn.id);
        
        const activeItems = [...prevColumns[activeColumnIndex].items];
        const overItems = [...prevColumns[overColumnIndex].items];
        
        // Find the item being dragged
        const activeItemIndex = activeItems.findIndex(item => item && item.id === activeId);
        // Guard against not finding the item
        if (activeItemIndex === -1) return prevColumns;
        
        const activeItem = activeItems[activeItemIndex];
        
        // Remove from source column
        activeItems.splice(activeItemIndex, 1);
        
        // Add to destination column
        if (overId === overColumn.id) {
          // Dropped on the column itself, add to end
          overItems.push(activeItem);
        } else {
          // Dropped on another item, insert at that position
          const overItemIndex = overItems.findIndex(item => item && item.id === overId);
          if (overItemIndex !== -1) {
            overItems.splice(overItemIndex, 0, activeItem);
          } else {
            // If we can't find the specific item, append to the end of the column
            overItems.push(activeItem);
          }
        }
        
        // Update columns
        const newColumns = [...prevColumns];
        newColumns[activeColumnIndex] = {
          ...prevColumns[activeColumnIndex],
          items: activeItems
        };
        newColumns[overColumnIndex] = {
          ...prevColumns[overColumnIndex],
          items: overItems
        };
        
        return newColumns;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
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

    // Check if we're moving columns
    const activeColumn = columns.find(col => col.id === activeId);
    const overColumn = columns.find(col => col.id === overId);
    
    if (activeColumn && overColumn) {
      // Reordering columns
      setColumns(items => {
        const oldIndex = items.findIndex(item => item.id === activeId);
        const newIndex = items.findIndex(item => item.id === overId);
        return arrayMove(items, oldIndex, newIndex);
      });
    } else {
      // Reordering items within the same column
      const column = findColumn(activeId);
      if (!column) {
        setActiveId(null);
        return;
      }

      setColumns(prevColumns => {
        const columnIndex = prevColumns.findIndex(col => col.id === column.id);
        const items = [...prevColumns[columnIndex].items];
        
        const activeItemIndex = items.findIndex(item => item && item.id === activeId);
        const overItemIndex = items.findIndex(item => item && item.id === overId);
        
        if (activeItemIndex !== -1 && overItemIndex !== -1) {
          const newItems = arrayMove(items, activeItemIndex, overItemIndex);
          const newColumns = [...prevColumns];
          newColumns[columnIndex] = {
            ...prevColumns[columnIndex],
            items: newItems
          };
          return newColumns;
        }
        
        return prevColumns;
      });
    }
    
    setActiveId(null);
  };

  const activeItem = getActiveItem();

  return (
    <div className="h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <header className="mb-6 w-full max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">Sprint Retrospective Board</h1>
      </header>
      
      <div className="w-full max-w-7xl">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map(col => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <Board>
              {columns.map((column) => (
                <Column 
                  key={column.id} 
                  id={column.id}
                  title={column.title}
                  description={column.description}
                  items={column.items.filter(Boolean).map(item => item.id)}
                >
                  <div className="mt-4 space-y-3">
                    {column.items.filter(Boolean).map((item) => {
                      if (item.type === 'card') {
                        return (
                          <Card
                            key={item.id}
                            id={item.id}
                            authorName={item.authorName}
                            content={item.content}
                            initialScore={item.initialScore}
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
                      return null;
                    })}
                  </div>
                </Column>
              ))}
            </Board>
          </SortableContext>
          
          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem && 'title' in activeItem ? (
              // Dragging a column
              <Column 
                id={activeItem.id}
                title={activeItem.title} 
                description={activeItem.description}
                items={activeItem.items.filter(Boolean).map(item => item.id)}
                isDragOverlay={true}
              >
                <div className="mt-4 space-y-3">
                  {activeItem.items.filter(Boolean).map((item) => {
                    if (item.type === 'card') {
                      return (
                        <Card
                          key={item.id}
                          id={item.id}
                          authorName={item.authorName}
                          content={item.content}
                          initialScore={item.initialScore}
                          isDragOverlay={true}
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
                          isDragOverlay={true}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </Column>
            ) : activeItem && activeItem.type === 'card' ? (
              // Dragging a card
              <Card
                id={activeItem.id}
                authorName={activeItem.authorName}
                content={activeItem.content}
                initialScore={activeItem.initialScore}
                isDragOverlay={true}
              />
            ) : activeItem && activeItem.type === 'spacer' ? (
              // Dragging a spacer
              <Spacer
                id={activeItem.id}
                name={activeItem.name}
                color={activeItem.color}
                isDragOverlay={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default BoardPage;