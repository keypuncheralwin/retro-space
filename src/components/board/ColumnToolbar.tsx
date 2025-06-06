'use client';

import React from 'react';
import { Plus, BetweenHorizontalStart } from 'lucide-react';

interface ColumnToolbarProps {
  onAddCard: () => void;
  onAddSpacer: () => void;
  // Future props can be added here:
  // onFilter?: () => void;
  // onSort?: () => void;
  // onAddTemplate?: () => void;
  // isCollaborative?: boolean;
  // participantCount?: number;
}

const ColumnToolbar: React.FC<ColumnToolbarProps> = ({ onAddCard, onAddSpacer }) => {
  return (
    <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200">
      <button
        onClick={onAddCard}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        title="Add a new card to this column"
      >
        <Plus size={14} />
        Add Card
      </button>

      <button
        onClick={onAddSpacer}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        title="Add a spacer to organize cards into sections"
      >
        <BetweenHorizontalStart size={14} />
        Add Spacer
      </button>

      {/* Future toolbar items can be added here:
      
      <div className="flex-1" /> {/* Spacer to push items to the right */}

      {/* Example future buttons:
      <button
        onClick={onFilter}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
        title="Filter cards"
      >
        <Filter size={14} />
      </button>
      
      <button
        onClick={onSort}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
        title="Sort cards"
      >
        <ArrowUpDown size={14} />
      </button>
      */}
    </div>
  );
};

export default ColumnToolbar;
