import React, { useRef } from 'react';
import { SmilePlus } from 'lucide-react';
import { EmojiPicker, type Emoji } from 'frimousse';
import { useOnClickOutside } from '@/hooks/useOnClickOutside'; // Assuming hooks are in src/hooks

interface EmojiReactionsProps {
  // Props can be added here if needed
}

const EmojiReactions: React.FC<EmojiReactionsProps> = () => {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [reactions, setReactions] = React.useState<Record<string, number>>({});
  const pickerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(pickerRef, () => { if (showEmojiPicker) setShowEmojiPicker(false); });

  const handleEmojiSelect = (emojiData: Emoji) => {
    setReactions(prevReactions => ({
      ...prevReactions,
      [emojiData.emoji]: (prevReactions[emojiData.emoji] || 0) + 1,
    }));
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Object.entries(reactions).map(([emoji, count]) => (
        <div key={emoji} className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-1.5 py-0.5 rounded-full flex items-center">
          <span className="text-sm mr-0.5">{emoji}</span>
          <span className="text-xs">{count}</span>
        </div>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(prev => !prev)} // Toggle visibility
          className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Add reaction"
        >
          <SmilePlus size={16} />
        </button>
        {showEmojiPicker && (
          // Container for click outside detection
          <div ref={pickerRef} className="absolute bottom-full left-0 mb-1 z-30 shadow-lg rounded-md overflow-hidden">
            <EmojiPicker.Root 
              onEmojiSelect={handleEmojiSelect}
              // Adjusted size and background to use CSS variables, with fallbacks or theme-consistent grays
              className="isolate flex h-80 w-72 flex-col bg-[var(--background)] dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md"
            >
              <EmojiPicker.Search 
                placeholder="Search emoji..." 
                // Adjusted search bar style
                className="z-10 mx-2 mt-2 appearance-none rounded-md bg-gray-100 dark:bg-gray-700 px-2.5 py-2 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {/* Added scrollbar styling */}
              <EmojiPicker.Viewport className="relative flex-1 overflow-y-auto p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-md hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
                <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  Loading…
                </EmojiPicker.Loading>
                <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  No emoji found.
                </EmojiPicker.Empty>
                <EmojiPicker.List
                  className="select-none pb-1.5"
                  components={{
                    CategoryHeader: ({ category, ...props }) => (
                      <div
                        // Adjusted category header style
                        className="bg-[var(--background)] dark:bg-neutral-800 px-3 pt-3 pb-1.5 font-medium text-gray-600 dark:text-gray-400 text-xs sticky top-0 z-10"
                        {...props}
                      >
                        {category.label}
                      </div>
                    ),
                    Row: ({ children, ...props }: { children?: React.ReactNode, [key: string]: any }) => (
                      <div className="scroll-my-1.5 px-1.5" {...props}>
                        {children}
                      </div>
                    ),
                    Emoji: ({ emoji, ...props }: { emoji: Emoji, [key: string]: any }) => (
                      <button
                        // Adjusted emoji button style
                        className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-gray-100 dark:hover:bg-gray-700 data-[active]:bg-blue-100 dark:data-[active]:bg-blue-700"
                        {...props}
                      >
                        {emoji.emoji}
                      </button>
                    ),
                  }}
                />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiReactions;

