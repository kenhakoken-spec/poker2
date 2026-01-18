'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { OpponentType } from '@/types/poker';

interface OpponentTypeToggleProps {
  currentType: OpponentType;
  onTypeChange: (type: OpponentType) => void;
}

const opponentTypes: OpponentType[] = ['Reg', 'Fish', 'Nit'];

const typeLabels: Record<OpponentType, string> = {
  Reg: 'Reg',
  Fish: 'Fish',
  Nit: 'Nit',
};

export function OpponentTypeToggle({ currentType, onTypeChange }: OpponentTypeToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      {/* 折りたたみヘッダー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">相手タイプ:</span>
          <span className="text-sm font-semibold text-blue-400">{currentType}</span>
          <span className="text-xs text-gray-500">(Optional)</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* 展開時の選択ボタン */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            {opponentTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  onTypeChange(type);
                  setIsExpanded(false);
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all min-h-[44px] ${
                  currentType === type
                    ? 'bg-green-600 text-white ring-2 ring-green-400'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
