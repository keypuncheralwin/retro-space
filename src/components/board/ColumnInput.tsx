/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Check, X, Smile, Image, Trash2 } from 'lucide-react';
import { EmojiPicker, type Emoji } from 'frimousse';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import GifPicker from './GifPicker';

interface ColumnInputProps {
  onSave: (content: string) => void;
  onCancel: () => void;
  authorName: string;
  inputType: 'card' | 'spacer';
  placeholder?: string;
  autoFocus?: boolean;
  initialContent?: string;
}

interface GifItem {
  id: string;
  url: string;
}

// Helper function to extract gifs from content
const extractGifsFromContent = (content: string): { textContent: string; gifs: GifItem[] } => {
  const gifRegex = /!\[gif\]\((https?:\/\/[^\)]+)\)/g;
  const gifs: GifItem[] = [];
  let textContent = content;
  let match;

  while ((match = gifRegex.exec(content)) !== null) {
    const gifItem: GifItem = {
      id: `gif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: match[1],
    };
    gifs.push(gifItem);
  }

  // Remove gif markdown from text content
  textContent = content.replace(gifRegex, '').replace(/\n\n+/g, '\n\n').trim();

  return { textContent, gifs };
};

const ColumnInput: React.FC<ColumnInputProps> = ({
  onSave,
  onCancel,
  authorName,
  inputType,
  placeholder,
  autoFocus = true,
  initialContent = '',
}) => {
  // Extract initial text and gifs if editing
  const { textContent: initialText, gifs: initialGifs } = extractGifsFromContent(initialContent);

  const [textContent, setTextContent] = useState(initialText);
  const [gifs, setGifs] = useState<GifItem[]>(initialGifs);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [gifPickerPosition, setGifPickerPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Determine default placeholder based on input type
  const defaultPlaceholder =
    inputType === 'card' ? "What's on your mind?" : 'Enter section name...';

  const actualPlaceholder = placeholder || defaultPlaceholder;

  // Auto-focus the textarea when component mounts and set cursor to end
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end of text
      const textLength = textContent.length;
      textareaRef.current.setSelectionRange(textLength, textLength);
      setCursorPosition(textLength);
    }
  }, [autoFocus, textContent.length]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
    }
  }, [textContent]);

  // Close emoji picker when clicking outside
  useOnClickOutside(emojiPickerRef, (event) => {
    if (emojiButtonRef.current && emojiButtonRef.current.contains(event.target as Node)) {
      return;
    }
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  });

  // Update cursor position when content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  // Track cursor position on selection change
  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart || 0);
  };

  // Add gif to the collection (only for cards)
  const addGif = (gifUrl: string) => {
    if (inputType !== 'card') return;

    const newGif: GifItem = {
      id: `gif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: gifUrl,
    };
    setGifs((prev) => [...prev, newGif]);
  };

  // Remove gif from collection
  const removeGif = (gifId: string) => {
    setGifs((prev) => prev.filter((gif) => gif.id !== gifId));
  };

  // Calculate picker positions
  const calculateEmojiPickerPosition = () => {
    if (!emojiButtonRef.current) return;

    const rect = emojiButtonRef.current.getBoundingClientRect();
    const PICKER_HEIGHT = 320;
    const PICKER_WIDTH = 288;
    const MARGIN = 8;

    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.left;

    let top: number;
    let left: number;

    if (spaceAbove >= PICKER_HEIGHT + MARGIN) {
      top = rect.top - PICKER_HEIGHT - MARGIN + window.scrollY;
    } else {
      top = rect.bottom + MARGIN + window.scrollY;
    }

    if (spaceRight >= PICKER_WIDTH) {
      left = rect.right - PICKER_WIDTH + window.scrollX;
    } else {
      left = rect.left + window.scrollX;
    }

    setEmojiPickerPosition({ top, left });
  };

  const calculateGifPickerPosition = () => {
    if (!gifButtonRef.current) return;

    const rect = gifButtonRef.current.getBoundingClientRect();
    const PICKER_HEIGHT = 400;
    const PICKER_WIDTH = 320;
    const MARGIN = 8;

    const spaceAbove = rect.top;

    let top: number;
    let left: number;

    if (spaceAbove >= PICKER_HEIGHT + MARGIN) {
      top = rect.top - PICKER_HEIGHT - MARGIN + window.scrollY;
    } else {
      top = rect.bottom + MARGIN + window.scrollY;
    }

    const spaceRight = window.innerWidth - rect.left;
    if (spaceRight >= PICKER_WIDTH) {
      left = rect.right - PICKER_WIDTH + window.scrollX;
    } else {
      left = rect.left + window.scrollX;
    }

    setGifPickerPosition({ top, left });
  };

  // Toggle pickers
  const toggleEmojiPicker = () => {
    if (showGifPicker) {
      setShowGifPicker(false);
    }
    if (!showEmojiPicker) {
      calculateEmojiPickerPosition();
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const toggleGifPicker = () => {
    if (inputType !== 'card') return; // Don't allow GIFs for spacers

    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
    if (!showGifPicker) {
      calculateGifPickerPosition();
    }
    setShowGifPicker(!showGifPicker);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: Emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const newContent =
      textContent.slice(0, cursorPosition) + emojiData.emoji + textContent.slice(cursorPosition);
    const newCursorPos = cursorPosition + emojiData.emoji.length;

    setTextContent(newContent);
    setShowEmojiPicker(false);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  // Handle gif selection (only for cards)
  const handleGifSelect = (gif: any, e: React.SyntheticEvent) => {
    e.preventDefault();
    if (inputType === 'card') {
      addGif(gif.images.fixed_height.url);
    }
    setShowGifPicker(false);

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Combine text and gifs for final content (cards only)
  const getFinalContent = () => {
    let finalContent = textContent.trim();

    // Add gifs at the end (only for cards)
    if (inputType === 'card' && gifs.length > 0) {
      const gifMarkdown = gifs.map((gif) => `![gif](${gif.url})`).join('\n');
      if (finalContent) {
        finalContent += '\n\n' + gifMarkdown;
      } else {
        finalContent = gifMarkdown;
      }
    }

    return finalContent;
  };

  // Update picker positions when shown
  useEffect(() => {
    if (showEmojiPicker) {
      calculateEmojiPickerPosition();
      const handleResize = () => calculateEmojiPickerPosition();
      const handleScroll = () => calculateEmojiPickerPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [showEmojiPicker]);

  useEffect(() => {
    if (showGifPicker && inputType === 'card') {
      calculateGifPickerPosition();
      const handleResize = () => calculateGifPickerPosition();
      const handleScroll = () => calculateGifPickerPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [showGifPicker, inputType]);

  const handleSave = () => {
    const finalContent = getFinalContent();
    if (finalContent) {
      onSave(finalContent);
    } else {
      onCancel();
    }
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showEmojiPicker || showGifPicker) {
        setShowEmojiPicker(false);
        setShowGifPicker(false);
      } else {
        onCancel();
      }
    }
  };

  // Determine border color based on input type
  const borderColor = inputType === 'card' ? 'border-blue-200' : 'border-green-200';

  return (
    <div className={`bg-white p-3 rounded-md shadow-sm border-2 ${borderColor} relative mb-4`}>
      {/* Author indicator - only show for cards */}
      {inputType === 'card' && <div className="text-xs text-gray-500 mb-2">{authorName}</div>}

      {/* Text input area */}
      <textarea
        ref={textareaRef}
        value={textContent}
        onChange={handleContentChange}
        onSelect={handleSelectionChange}
        onKeyDown={handleKeyDown}
        placeholder={actualPlaceholder}
        className="w-full text-sm text-gray-800 placeholder-gray-400 border-none outline-none resize-none bg-transparent min-h-[60px] leading-relaxed"
        rows={inputType === 'spacer' ? 2 : 3}
      />

      {/* Gif gallery section - only for cards */}
      {inputType === 'card' && gifs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {gifs.map((gif) => (
              <div key={gif.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.url}
                  alt="Selected GIF for card"
                  className="h-20 w-auto rounded-md object-cover border border-gray-200"
                  loading="lazy"
                />
                <button
                  onClick={() => removeGif(gif.id)}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                  title="Remove gif"
                  aria-label="Remove gif"
                >
                  <Trash2 size={10} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            ref={emojiButtonRef}
            onClick={toggleEmojiPicker}
            className={`p-1 rounded transition-colors ${
              showEmojiPicker
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title="Add emoji"
            type="button"
            aria-label="Add emoji"
          >
            <Smile size={16} aria-hidden="true" />
          </button>

          {/* GIF button - only show for cards */}
          {inputType === 'card' && (
            <button
              ref={gifButtonRef}
              onClick={toggleGifPicker}
              className={`p-1 rounded transition-colors ${
                showGifPicker
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title="Add gif"
              type="button"
              aria-label="Add gif"
            >
              <Image size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowEmojiPicker(false);
              setShowGifPicker(false);
              onCancel();
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            title="Cancel (Esc)"
            aria-label={`Cancel ${inputType} ${initialContent ? 'edit' : 'creation'}`}
          >
            <X size={12} aria-hidden="true" />
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!textContent.trim() && (inputType === 'spacer' || gifs.length === 0)}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded transition-colors ${
              inputType === 'card'
                ? 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'
                : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300'
            } disabled:cursor-not-allowed`}
            title="Save (Cmd/Ctrl + Enter)"
            aria-label={`Save ${inputType}`}
          >
            <Check size={12} aria-hidden="true" />
            Save
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
        <span className="bg-white px-1 rounded">⌘↵ to save • Esc to cancel</span>
      </div>

      {/* Emoji Picker Portal */}
      {showEmojiPicker &&
        ReactDOM.createPortal(
          <div
            ref={emojiPickerRef}
            style={{
              position: 'absolute',
              top: `${emojiPickerPosition.top}px`,
              left: `${emojiPickerPosition.left}px`,
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

      {/* Gif Picker - only for cards */}
      {inputType === 'card' && (
        <GifPicker
          isOpen={showGifPicker}
          onGifSelect={handleGifSelect}
          onClose={() => setShowGifPicker(false)}
          position={gifPickerPosition}
          triggerRef={gifButtonRef}
        />
      )}
    </div>
  );
};

export default ColumnInput;
