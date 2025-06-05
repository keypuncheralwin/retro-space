import React from 'react';

interface BoardProps {
  children: React.ReactNode;
}

const Board: React.FC<BoardProps> = ({ children }) => {
  return (
    // Take up most of the available viewport height while allowing horizontal scrolling
    <div className="flex justify-center w-full h-full">
      <div className="flex flex-row space-x-6 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-x-auto max-w-full h-[calc(100vh-160px)]">
        {children}
      </div>
    </div>
  );
};

export default Board;
