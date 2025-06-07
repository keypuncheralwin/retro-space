'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Check, X } from 'lucide-react';
import ColumnToolbar from './ColumnToolbar';
import ColumnInput from './ColumnInput';

interface ColumnProps {
  id: string;
  title: string;
  description: string;
  items: string[];
  children: React.ReactNode;
  onAddCard: () => void;
  onAddSpacer: () => void;

  // AI grouping props
  onAIGroup?: () => void;
  isAIGrouping?: boolean;
  hasCards?: boolean;

  // Card input props
  showCardInput?: boolean;
  onSaveCard?: (content: string) => void;
  onCancelCard?: () => void;

  // Spacer input props
  showSpacerInput?: boolean;
  onSaveSpacer?: (content: string) => void;
  onCancelSpacer?: () => void;

  // Edit props
  editingItem?: { id: string; type: 'card' | 'spacer'; content: string } | null;
  onSaveEdit?: (content: string) => void;
  onCancelEdit?: () => void;

  // Column edit props
  isEditingColumn?: boolean;
  onEditColumn?: () => void;
  onSaveColumn?: (title: string, description: string) => void;
  onCancelColumnEdit?: () => void;

  currentUserName?: string;
  isDragOverlay?: boolean;
}

const Column: React.FC<ColumnProps> = ({
  id,
  title,
  description,
  items,
  children,
  onAddCard,
  onAddSpacer,
  onAIGroup,
  isAIGrouping = false,
  hasCards = false,
  showCardInput = false,
  onSaveCard,
  onCancelCard,
  showSpacerInput = false,
  onSaveSpacer,
  onCancelSpacer,
  editingItem,
  onSaveEdit,
  onCancelEdit,
  isEditingColumn = false,
  onEditColumn,
  onSaveColumn,
  onCancelColumnEdit,
  currentUserName = 'User',
  isDragOverlay = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'column' },
    disabled: isDragOverlay,
  });

  // Local state for column editing
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when props change
  useEffect(() => {
    setEditTitle(title);
    setEditDescription(description);
  }, [title, description]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingColumn && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingColumn]);

  // Auto-resize description textarea
  useEffect(() => {
    if (isEditingColumn && descriptionInputRef.current) {
      const textarea = descriptionInputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(40, textarea.scrollHeight)}px`;
    }
  }, [isEditingColumn, editDescription]);

  const handleSaveColumn = () => {
    if (onSaveColumn && (editTitle.trim() || editDescription.trim())) {
      onSaveColumn(editTitle.trim() || 'Untitled Column', editDescription.trim());
    }
  };

  const handleCancelColumnEdit = () => {
    setEditTitle(title);
    setEditDescription(description);
    if (onCancelColumnEdit) {
      onCancelColumnEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveColumn();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelColumnEdit();
    }
  };

  // Compute style only when not in drag overlay
  const style = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  // Build the column's inner content once
  const columnContent = (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-80 flex-shrink-0 flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Show drag handle only when not in drag overlay */}
      {!isDragOverlay && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
          title="Drag to reorder column"
        >
          <GripVertical size={20} className="text-gray-400" />
        </div>
      )}

      {/* Column header with space reserved for the handle */}
      <div className={!isDragOverlay ? 'pr-8' : ''}>
        {isEditingColumn && !isDragOverlay ? (
          /* Editing mode */
          <div className="mb-4">
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-xl font-semibold mb-2 text-gray-800 bg-white border border-blue-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Column title..."
            />
            <textarea
              ref={descriptionInputRef}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm text-gray-600 bg-white border border-blue-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Column description..."
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveColumn}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                title="Save (Cmd/Ctrl + Enter)"
              >
                <Check size={12} />
                Save
              </button>
              <button
                onClick={handleCancelColumnEdit}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                title="Cancel (Esc)"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
            {/* Keyboard shortcuts hint */}
            <div className="text-xs text-gray-400 mt-1">⌘↵ to save • Esc to cancel</div>
          </div>
        ) : (
          /* Display mode */
          <div className="group relative">
            <h2 className="text-xl font-semibold mb-1 text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600 mb-4">{description}</p>

            {/* Edit button - only show when not in drag overlay */}
            {!isDragOverlay && onEditColumn && (
              <button
                onClick={onEditColumn}
                className="absolute top-0 right-0 p-1 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 text-gray-600 hover:text-blue-600 transition-all"
                title="Edit column"
                aria-label="Edit column"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar - only show when not in drag overlay */}
      {!isDragOverlay && (
        <ColumnToolbar
          onAddCard={onAddCard}
          onAddSpacer={onAddSpacer}
          onAIGroup={onAIGroup}
          isAIGrouping={isAIGrouping}
          hasCards={hasCards}
        />
      )}

      {/* Edit Input - show when editing an item */}
      {!isDragOverlay && editingItem && onSaveEdit && onCancelEdit && (
        <div className="mb-4">
          <ColumnInput
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            authorName={currentUserName}
            inputType={editingItem.type}
            placeholder={editingItem.type === 'card' ? 'Edit your card...' : 'Edit section name...'}
            initialContent={editingItem.content}
          />
        </div>
      )}

      {/* Card Input - show when active */}
      {!isDragOverlay && showCardInput && onSaveCard && onCancelCard && !editingItem && (
        <div className="mb-4">
          <ColumnInput
            onSave={onSaveCard}
            onCancel={onCancelCard}
            authorName={currentUserName}
            inputType="card"
            placeholder="Describe what happened..."
          />
        </div>
      )}

      {/* Spacer Input - show when active */}
      {!isDragOverlay && showSpacerInput && onSaveSpacer && onCancelSpacer && !editingItem && (
        <div className="mb-4">
          <ColumnInput
            onSave={onSaveSpacer}
            onCancel={onCancelSpacer}
            authorName={currentUserName}
            inputType="spacer"
            placeholder="Enter section name..."
          />
        </div>
      )}

      {/* Wrap items in SortableContext only when not a drag overlay */}
      {isDragOverlay ? (
        <div className="min-h-[100px] rounded-md pt-2 overflow-y-auto flex-grow custom-scrollbar">
          {children}
        </div>
      ) : (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="min-h-[100px] rounded-md pt-2 overflow-y-auto flex-grow custom-scrollbar">
            {children}
          </div>
        </SortableContext>
      )}
    </div>
  );

  // If this is a drag overlay, we skip attaching setNodeRef and style
  if (isDragOverlay) {
    return <div className="relative">{columnContent}</div>;
  }

  // Otherwise, attach the sortable refs and style
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {columnContent}
    </div>
  );
};

export default Column;
