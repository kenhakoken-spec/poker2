'use client';

import { PositionSelector } from './PositionSelector';
import type { Position } from '@/types/poker';

interface HeroPositionSelectorProps {
  onPositionSelect: (position: Position) => void;
}

export function HeroPositionSelector({ onPositionSelect }: HeroPositionSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">自分の位置を選択</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">
          ハンドを開始する前に、あなたの位置を選択してください
        </p>
        <PositionSelector
          selectedPosition={null}
          onSelect={onPositionSelect}
        />
      </div>
    </div>
  );
}
