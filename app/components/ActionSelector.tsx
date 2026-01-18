'use client';

import type { ActionType } from '@/types/poker';

const actions: ActionType[] = ['Fold', 'Check', 'Call', 'Bet', 'Raise'];

interface ActionSelectorProps {
  selectedAction: ActionType | null;
  onSelect: (action: ActionType) => void;
}

export function ActionSelector({ selectedAction, onSelect }: ActionSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          className={`min-h-[44px] px-4 py-3 rounded-lg font-semibold text-sm transition-all touch-manipulation ${
            selectedAction === action
              ? action === 'Fold'
                ? 'bg-red-700 text-white ring-2 ring-red-400'
                : action === 'Bet' || action === 'Raise'
                ? 'bg-yellow-700 text-white ring-2 ring-yellow-400'
                : 'bg-blue-600 text-white ring-2 ring-blue-400'
              : action === 'Fold'
              ? 'bg-red-700 text-gray-200 hover:bg-red-600 active:bg-red-500'
              : action === 'Bet' || action === 'Raise'
              ? 'bg-yellow-700 text-gray-200 hover:bg-yellow-600 active:bg-yellow-500'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'
          }`}
        >
          {action}
        </button>
      ))}
    </div>
  );
}
