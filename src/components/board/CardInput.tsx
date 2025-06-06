'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Check, X, Smile } from 'lucide-react';
import { EmojiPicker, type Emoji } from 'frimousse';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface CardInputProps {
  onSave: (content: string) => void;
  onCancel: () => void;
  authorName: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const CardInput: React.FC<CardInputProps> = ({
  onSave,
  onCancel,
  authorName,
  placeholder = "What's on your mind?",
  autoFocus = true,
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
    }
  }, [content]);

  // Close emoji picker when clicking outside
  useOnClickOutside(pickerRef, (event) => {
    // Don't close if clicking on the emoji button
    if (emojiButtonRef.current && emojiButtonRef.current.contains(event.target as Node)) {
      return;
    }
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  });

  // Update cursor position when content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  // Track cursor position on selection change
  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart || 0);
  };

  // Calculate emoji picker position
  const calculatePickerPosition = () => {
    if (!emojiButtonRef.current) return;

    const rect = emojiButtonRef.current.getBoundingClientRect();
    const PICKER_HEIGHT = 320;
    const PICKER_WIDTH = 288; // w-72 = 18rem = 288px
    const MARGIN = 8;

    // Check if there's space above and to the right
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.left;

    let top: number;
    let left: number;

    // Prefer to show above if there's space
    if (spaceAbove >= PICKER_HEIGHT + MARGIN) {
      top = rect.top - PICKER_HEIGHT - MARGIN + window.scrollY;
    } else {
      top = rect.bottom + MARGIN + window.scrollY;
    }

    // Position horizontally (prefer right-aligned with button)
    if (spaceRight >= PICKER_WIDTH) {
      left = rect.right - PICKER_WIDTH + window.scrollX;
    } else {
      left = rect.left + window.scrollX;
    }

    setPickerPosition({ top, left });
  };

  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    if (!showEmojiPicker) {
      calculatePickerPosition();
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: Emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const newContent =
      content.slice(0, cursorPosition) + emojiData.emoji + content.slice(cursorPosition);

    setContent(newContent);
    setShowEmojiPicker(false);

    // Focus back to textarea and position cursor after emoji
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = cursorPosition + emojiData.emoji.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  // Update picker position when shown or window changes
  useEffect(() => {
    if (showEmojiPicker) {
      calculatePickerPosition();

      const handleResize = () => calculatePickerPosition();
      const handleScroll = () => calculatePickerPosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [showEmojiPicker]);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSave(trimmedContent);
    } else {
      // If empty, just cancel
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + Enter to save
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      // Escape to cancel
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="bg-white p-3 rounded-md shadow-sm border-2 border-blue-200 relative">
      {/* Author indicator */}
      <div className="text-xs text-gray-500 mb-2">{authorName}</div>

      {/* Content input */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        onSelect={handleSelectionChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full text-sm text-gray-800 placeholder-gray-400 border-none outline-none resize-none bg-transparent min-h-[60px] leading-relaxed"
        rows={3}
      />

      {/* Action buttons */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400">
            {content.length > 0 && `${content.length} characters`}
          </div>

          {/* Emoji button */}
          <button
            ref={emojiButtonRef}
            onClick={toggleEmojiPicker}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
            title="Add emoji"
            type="button"
          >
            <Smile size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            title="Cancel (Esc)"
          >
            <X size={12} />
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded transition-colors"
            title="Save (Cmd/Ctrl + Enter)"
          >
            <Check size={12} />
            Save
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
        <span className="bg-white px-1 rounded">⌘↵ to save • Esc to cancel • 😊 for emoji</span>
      </div>

      {/* Emoji Picker Portal */}
      {showEmojiPicker &&
        ReactDOM.createPortal(
          <div
            ref={pickerRef}
            style={{
              position: 'absolute',
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
              zIndex: 1050,
            }}
            className="shadow-lg rounded-lg"
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
                    Row: ({ children, ...props }: { children?: React.ReactNode }) => (
                      <div className="scroll-my-1.5 px-1.5" {...props}>
                        {children}
                      </div>
                    ),
                    Emoji: ({ emoji, ...props }: { emoji: Emoji }) => (
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
          document.body,
        )}
    </div>
  );
};

export default CardInput;
