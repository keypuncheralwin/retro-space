'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

// Initialize Giphy API
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'your-giphy-api-key-here');

interface GifPickerProps {
  isOpen: boolean;
  onGifSelect: (gif: unknown, e: React.SyntheticEvent) => void;
  onClose: () => void;
  position: { top: number; left: number };
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const GifPicker: React.FC<GifPickerProps> = ({
  isOpen,
  onGifSelect,
  onClose,
  position,
  triggerRef,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close gif picker when clicking outside
  useOnClickOutside(pickerRef, (event) => {
    if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
      return;
    }
    if (isOpen) {
      onClose();
    }
  });

  // Auto-focus search input when picker opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchRef.current) {
          searchRef.current.focus();
        }
      }, 100);
    } else {
      // Reset search when closing
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={pickerRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1050,
      }}
      className="shadow-xl rounded-lg bg-white border border-gray-200 overflow-hidden"
    >
      <div className="w-80 h-96 flex flex-col">
        {/* Header with search */}
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Choose a GIF</h3>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Scrollable gif grid */}
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full overflow-y-auto pr-1 custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#D1D5DB #F3F4F6',
            }}
          >
            <Grid
              width={310} // Slightly smaller to account for scrollbar
              columns={2}
              fetchGifs={(offset: number) =>
                searchTerm.trim()
                  ? gf.search(searchTerm, { offset, limit: 20 })
                  : gf.trending({ offset, limit: 20 })
              }
              onGifClick={onGifSelect}
              noResultsMessage={
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  No GIFs found
                </div>
              }
              className="p-2"
              key={searchTerm} // Force re-render when search term changes
            />
          </div>

          {/* Add custom scrollbar styles */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #F3F4F6;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #D1D5DB;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #9CA3AF;
              }
            `,
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default GifPicker;
