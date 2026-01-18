'use client';

import { useState } from 'react';
import { BetSizeSlider } from './BetSizeSlider';

interface PreflopActionSelectorProps {
  potSize: number;
  currentBet?: number; // 現在のベットサイズ（3bet以降で必要）
  onActionSelect: (action: 'Fold' | 'Call' | 'Raise', betSize?: number) => void;
}

export function PreflopActionSelector({ potSize, currentBet = 1.0, onActionSelect }: PreflopActionSelectorProps) {
  const [customSize, setCustomSize] = useState(3.0);
  const [showSlider, setShowSlider] = useState(false);

  const handlePresetRaise = (multiplier: number) => {
    let raiseSize: number;
    if (currentBet === 1.0) {
      // Open Raise (currentBet = 1.0 = BB)
      // multiplierはBBに対する倍率
      raiseSize = multiplier; // 例: 3 = 3BB
    } else {
      // 3bet以降 (既にレイズがある)
      // multiplierは前のレイズサイズ（currentBet）の倍率
      // total = currentBet * multiplier
      raiseSize = currentBet * multiplier; // 例: currentBet=3BB, multiplier=3 → 9BB total
    }
    onActionSelect('Raise', raiseSize);
  };

  const handleCustomRaise = () => {
    onActionSelect('Raise', customSize);
    setShowSlider(false);
  };

  return (
    <div className="space-y-3">
      {/* 基本アクションボタン */}
      <div className="grid grid-cols-3 gap-2 px-4">
        <button
          onClick={() => onActionSelect('Fold')}
          className="px-4 py-3 rounded-lg font-semibold text-sm transition-all min-h-[44px] bg-red-600 text-white hover:bg-red-700"
        >
          Fold
        </button>
        <button
          onClick={() => onActionSelect('Call')}
          className="px-4 py-3 rounded-lg font-semibold text-sm transition-all min-h-[44px] bg-blue-600 text-white hover:bg-blue-700"
        >
          Call
        </button>
        <button
          onClick={() => setShowSlider(!showSlider)}
          className="px-4 py-3 rounded-lg font-semibold text-sm transition-all min-h-[44px] bg-gray-700 text-white hover:bg-gray-600"
        >
          Custom
        </button>
      </div>

      {/* プリセットレイズボタン */}
      <div className="grid grid-cols-2 gap-2 px-4">
        <button
          onClick={() => handlePresetRaise(2)}
          className="px-4 py-3 rounded-lg font-semibold text-sm transition-all min-h-[44px] bg-yellow-600 text-white hover:bg-yellow-700"
        >
          2x ({currentBet === 1.0 ? '2' : (currentBet * 2).toFixed(1)}bb)
        </button>
        <button
          onClick={() => handlePresetRaise(3)}
          className="px-4 py-3 rounded-lg font-semibold text-sm transition-all min-h-[44px] bg-yellow-600 text-white hover:bg-yellow-700"
        >
          3x ({currentBet === 1.0 ? '3' : (currentBet * 3).toFixed(1)}bb)
        </button>
      </div>

      {/* カスタムサイズスライダー */}
      {showSlider && (
        <div className="space-y-2">
          <BetSizeSlider
            min={1.5}
            max={10}
            step={0.5}
            value={customSize}
            onChange={setCustomSize}
            label="カスタムレイズサイズ"
            unit="bb"
          />
          <div className="px-4">
            <button
              onClick={handleCustomRaise}
              className="w-full px-4 py-2 rounded-lg font-semibold text-sm bg-green-600 text-white hover:bg-green-700"
            >
              レイズ {customSize.toFixed(1)}bb
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
