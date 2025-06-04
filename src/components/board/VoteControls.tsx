'use client';
import React from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';

interface VoteControlsProps {
  initialScore: number;
  // Props can be added here if needed, e.g., to save score externally
}

const VoteControls: React.FC<VoteControlsProps> = ({ initialScore }) => {
  const [score, setScore] = React.useState(initialScore);

  const handleUpvote = () => setScore(prevScore => prevScore + 1);
  const handleDownvote = () => setScore(prevScore => prevScore - 1);

  return (
    <div className="flex items-center">
      <button onClick={handleUpvote} className="p-1 hover:text-green-600" title="Upvote">
        <ArrowBigUp size={16} />
      </button>
      <span className="font-medium mx-1 w-5 text-center">{score}</span>
      <button onClick={handleDownvote} className="p-1 hover:text-red-600" title="Downvote">
        <ArrowBigDown size={16} />
      </button>
    </div>
  );
};

export default VoteControls;
