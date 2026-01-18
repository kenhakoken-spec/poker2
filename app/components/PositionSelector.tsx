'use client';

import type { Position } from '@/types/poker';

const positions: Position[] = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

interface PositionSelectorProps {
  selectedPosition: Position | null;
  onSelect: (position: Position) => void;
}

export function PositionSelector({ selectedPosition, onSelect }: PositionSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {positions.map((position) => (
        <button
          key={position}
          onClick={() => onSelect(position)}
          className={`min-h-[44px] px-4 py-3 rounded-lg font-semibold text-sm transition-all touch-manipulation ${
            selectedPosition === position
              ? 'bg-green-600 text-white ring-2 ring-green-400'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'
          }`}
        >
          {position}
        </button>
      ))}
    </div>
  );
}
