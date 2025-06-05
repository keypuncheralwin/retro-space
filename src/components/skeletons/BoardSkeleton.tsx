'use client';

import React from 'react';
import Board from '@/components/board/Board';

const BoardSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl">
      <Board>
        {/* Create 3 skeleton columns with shimmer */}
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-gray-100 p-4 rounded-lg shadow-md w-80 flex-shrink-0 h-full max-h-[calc(100vh-180px)] animate-pulse"
          ></div>
        ))}
      </Board>
    </div>
  );
};

export default BoardSkeleton;
