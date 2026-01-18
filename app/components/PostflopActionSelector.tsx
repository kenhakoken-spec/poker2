'use client';

import { useState } from 'react';
import { BetSizeSlider } from './BetSizeSlider';

interface PostflopActionSelectorProps {
  potSize: number;
  onActionSelect: (action: 'Fold' | 'Check' | 'Call' | 'Bet', betSize?: number) => void;
}

export function PostflopActionSelector({ potSize, onActionSelect }: PostflopActionSelectorProps) {
  const [customPercent, setCustomPercent] = useState(75);
  const [showSlider, setShowSlider] = useState(false);

  const handlePresetBet = (percentage: number) => {
    const betSize = (potSize * percentage) / 100;
    onActionSelect('Bet', betSize);
  };

  const handleCustomBet = () => {
    const betSize = (potSize * customPercent) / 100;
    onActionSelect('Bet', betSize);
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
          onClick={() => onActionSelect('Check')}
          className="px-4 py-3 rounded-lg font-semibold text-sm transition-all min-h-[44px] bg-blue-600 text-white hover:bg-blue-700"
        >
          Check
        </button>
        <button
          onClick={() => onActionSelect('Call')}
          className="px-4 py-3 rounded-lg font-semibold text-sm transition-all min-h-[44px] bg-blue-600 text-white hover:bg-blue-700"
        >
          Call
        </button>
      </div>

      {/* プリセットベットボタン */}
      <div className="grid grid-cols-4 gap-2 px-4">
        <button
          onClick={() => handlePresetBet(33)}
          className="px-3 py-3 rounded-lg font-semibold text-xs transition-all min-h-[44px] bg-yellow-600 text-white hover:bg-yellow-700"
        >
          33%
          <div className="text-xs font-normal">{((potSize * 33) / 100).toFixed(1)}bb</div>
        </button>
        <button
          onClick={() => handlePresetBet(50)}
          className="px-3 py-3 rounded-lg font-semibold text-xs transition-all min-h-[44px] bg-yellow-600 text-white hover:bg-yellow-700"
        >
          50%
          <div className="text-xs font-normal">{((potSize * 50) / 100).toFixed(1)}bb</div>
        </button>
        <button
          onClick={() => handlePresetBet(75)}
          className="px-3 py-3 rounded-lg font-semibold text-xs transition-all min-h-[44px] bg-yellow-600 text-white hover:bg-yellow-700"
        >
          75%
          <div className="text-xs font-normal">{((potSize * 75) / 100).toFixed(1)}bb</div>
        </button>
        <button
          onClick={() => handlePresetBet(100)}
          className="px-3 py-3 rounded-lg font-semibold text-xs transition-all min-h-[44px] bg-yellow-600 text-white hover:bg-yellow-700"
        >
          100%
          <div className="text-xs font-normal">{potSize.toFixed(1)}bb</div>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4">
        <button
          onClick={() => handlePresetBet(150)}
          className="px-3 py-3 rounded-lg font-semibold text-xs transition-all min-h-[44px] bg-orange-600 text-white hover:bg-orange-700"
        >
          150%
          <div className="text-xs font-normal">{((potSize * 150) / 100).toFixed(1)}bb</div>
        </button>
        <button
          onClick={() => onActionSelect('Bet', 999)}
          className="px-3 py-3 rounded-lg font-semibold text-xs transition-all min-h-[44px] bg-purple-600 text-white hover:bg-purple-700"
        >
          All-in
        </button>
        <button
          onClick={() => setShowSlider(!showSlider)}
          className="px-3 py-3 rounded-lg font-semibold text-xs transition-all min-h-[44px] bg-gray-700 text-white hover:bg-gray-600"
        >
          Custom
        </button>
      </div>

      {/* カスタムサイズスライダー */}
      {showSlider && (
        <div className="space-y-2">
          <BetSizeSlider
            min={10}
            max={300}
            step={5}
            value={customPercent}
            onChange={setCustomPercent}
            label={`ポットの ${customPercent}% (${((potSize * customPercent) / 100).toFixed(1)}bb)`}
            unit="%"
          />
          <div className="px-4">
            <button
              onClick={handleCustomBet}
              className="w-full px-4 py-2 rounded-lg font-semibold text-sm bg-green-600 text-white hover:bg-green-700"
            >
              ベット {((potSize * customPercent) / 100).toFixed(1)}bb ({customPercent}%)
            </button>
          </div>
        </div>
      )}

      {/* ポット情報表示 */}
      <div className="px-4 py-2 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          現在のポット: <span className="font-semibold text-green-400">{potSize.toFixed(1)}bb</span>
        </p>
      </div>
    </div>
  );
}
