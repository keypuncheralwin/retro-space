'use client';
import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SmilePlus } from 'lucide-react';
import { EmojiPicker, type Emoji } from 'frimousse';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

// Constants for picker dimensions and styling
const PICKER_HEIGHT = 320; // Corresponds to h-80 (20rem)
const PICKER_MARGIN = 4;   // Gap between button and picker (e.g., 0.25rem, was mb-1 or mt-1 equivalent)

const EmojiReactions: React.FC = () => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null); // Ref for the picker's content (for useOnClickOutside)

  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  useOnClickOutside(pickerRef, (event) => {
    // Don't close if clicking on the toggle button
    if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
      return;
    }
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  });

  const handleEmojiSelect = (emojiData: Emoji) => {
    setReactions(prevReactions => ({
      ...prevReactions,
      [emojiData.emoji]: (prevReactions[emojiData.emoji] || 0) + 1,
    }));
    setShowEmojiPicker(false);
  };

  // Function to calculate and set the optimal picker position
  const calculateAndSetPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    let newTop: number;
    const requiredVerticalSpace = PICKER_HEIGHT + PICKER_MARGIN;

    if (spaceAbove >= requiredVerticalSpace) {
      // Prefer to render above if enough space
      newTop = rect.top - PICKER_MARGIN - PICKER_HEIGHT + window.scrollY;
    } else if (spaceBelow >= requiredVerticalSpace) {
      // Otherwise, render below if enough space
      newTop = rect.bottom + PICKER_MARGIN + window.scrollY;
    } else {
      // Fallback: Not enough ideal space either way.
      // Choose the side with more relative space to minimize clipping by viewport.
      if (spaceAbove > spaceBelow) {
        newTop = rect.top - PICKER_MARGIN - PICKER_HEIGHT + window.scrollY;
      } else {
        newTop = rect.bottom + PICKER_MARGIN + window.scrollY;
      }
    }

    setPickerPosition({
      top: newTop,
      left: rect.left + window.scrollX,
    });
  };

  const toggleEmojiPicker = () => {
    if (!showEmojiPicker) { 
      // Calculate position just before showing
      requestAnimationFrame(() => {
        calculateAndSetPosition();
      });
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Effect to update position if window resizes or scrolls, or when picker visibility changes
  useEffect(() => {
    if (showEmojiPicker) {
      // Calculate position when picker becomes visible or dependencies change
      calculateAndSetPosition(); 

      window.addEventListener('resize', calculateAndSetPosition);
      window.addEventListener('scroll', calculateAndSetPosition, true); // true for capture phase
    }

    return () => {
      window.removeEventListener('resize', calculateAndSetPosition);
      window.removeEventListener('scroll', calculateAndSetPosition, true);
    };
  }, [showEmojiPicker]); // Re-calculate when showEmojiPicker changes

  const PickerComponent = showEmojiPicker ? ReactDOM.createPortal(
    <div
      ref={pickerRef} // Attach ref for click outside detection
      style={{
        position: 'absolute', // Use absolute positioning relative to document body
        top: `${pickerPosition.top}px`,
        left: `${pickerPosition.left}px`,
        zIndex: 1050, 
      }}
      className="shadow-lg rounded-lg" // Apply shadow and rounded corners
    >
      <EmojiPicker.Root
        onEmojiSelect={handleEmojiSelect}
        className="isolate flex h-80 w-72 flex-col bg-white border border-gray-200 rounded-lg overflow-hidden"
      >
        <EmojiPicker.Search
          placeholder="Search emoji..."
          className="z-10 mx-2 mt-2 appearance-none rounded-md bg-gray-50 px-2.5 py-2 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white border border-gray-200 outline-none transition-colors"
        />
        <EmojiPicker.Viewport className="relative flex-1 overflow-y-auto p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-md hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
          <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Loading…
          </EmojiPicker.Loading>
          <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No emoji found.
          </EmojiPicker.Empty>
          <EmojiPicker.List
            className="select-none pb-1.5"
            components={{
              CategoryHeader: ({ category, ...props }) => (
                <div
                  className="bg-white px-3 pt-3 pb-1.5 font-medium text-gray-600 text-xs sticky top-0 z-10"
                  {...props}
                >
                  {category.label}
                </div>
              ),
              Row: ({ children, ...props }: { children?: React.ReactNode}) => (
                <div className="scroll-my-1.5 px-1.5" {...props}>
                  {children}
                </div>
              ),
              Emoji: ({ emoji, ...props }: { emoji: Emoji}) => (
                <button
                  className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-gray-100 data-[active]:bg-gray-200 transition-colors"
                  {...props}
                >
                  {emoji.emoji}
                </button>
              ),
            }}
          />
        </EmojiPicker.Viewport>
      </EmojiPicker.Root>
    </div>,
    document.body 
  ) : null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Object.entries(reactions).map(([emoji, count]) => (
        <div key={emoji} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full flex items-center border border-gray-200">
          <span className="text-sm mr-0.5">{emoji}</span>
          <span className="text-xs font-medium">{count}</span>
        </div>
      ))}
      <div>
        <button
          ref={buttonRef} 
          onClick={toggleEmojiPicker}
          className="p-1.5 rounded-md transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Add reaction"
        >
          <SmilePlus size={16} />
        </button>
      </div>
      {PickerComponent}
    </div>
  );
};

export default EmojiReactions;