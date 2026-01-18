'use client';

import type { BetSizePercentage } from '@/types/poker';

const betSizes: BetSizePercentage[] = ['25%', '33%', '50%', '75%', '100%', 'All-in'];

interface BetSizeSelectorProps {
  potSize: number;
  selectedBetSize: BetSizePercentage | null;
  onSelect: (betSize: BetSizePercentage) => void;
}

export function BetSizeSelector({
  potSize,
  selectedBetSize,
  onSelect,
}: BetSizeSelectorProps) {
  const calculateBetSize = (percentage: BetSizePercentage): number => {
    if (percentage === 'All-in') {
      return 0; // All-inは特別扱い
    }
    const percent = parseFloat(percentage.replace('%', '')) / 100;
    return potSize * percent;
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {betSizes.map((size) => {
        const betAmount = calculateBetSize(size);
        const displayText = size === 'All-in' ? 'All-in' : `${size} (${betAmount.toFixed(1)}bb)`;

        return (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={`min-h-[44px] px-4 py-3 rounded-lg font-semibold text-xs transition-all touch-manipulation ${
              selectedBetSize === size
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'
            }`}
          >
            {displayText}
          </button>
        );
      })}
    </div>
  );
}
