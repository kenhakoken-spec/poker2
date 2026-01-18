'use client';

import { useState } from 'react';
import { PositionSelector } from './PositionSelector';
import { PreflopActionSelector } from './PreflopActionSelector';
import { PostflopActionSelector } from './PostflopActionSelector';
import type {
  Position,
  ActionType,
  PokerHand,
  PokerHandAction,
} from '@/types/poker';

// UUID生成ヘルパー（ブラウザ互換）
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック: シンプルなUUID v4風の生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ActionPanelProps {
  hand: PokerHand;
  dispatch: React.Dispatch<PokerHandAction>;
}

type ActionStep = 'position' | 'action';

export function ActionPanel({ hand, dispatch }: ActionPanelProps) {
  const [step, setStep] = useState<ActionStep>('position');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  // アクション記録後のリセット
  const resetSelection = () => {
    setStep('position');
    setSelectedPosition(null);
  };

  // Step 1: ポジション選択
  const handlePositionSelect = (position: Position) => {
    setSelectedPosition(position);
    setStep('action');
  };

  // Step 2: アクション選択（フェーズに応じて処理）
  const handleActionSelect = (action: 'Fold' | 'Check' | 'Call' | 'Raise' | 'Bet', betSize?: number) => {
    if (!selectedPosition) return;

    // ベットサイズの計算
    let finalBetSize: number | undefined = betSize;
    let newPotSize = hand.potSize;

    if (action === 'Bet' || action === 'Raise') {
      if (finalBetSize !== undefined) {
        // All-inの場合（999として受け取る）
        if (finalBetSize === 999) {
          finalBetSize = hand.stackSize;
        }
        newPotSize = hand.potSize + finalBetSize;
      }
    } else if (action === 'Call') {
      // Callは通常1BBと仮定（簡易実装）
      newPotSize += 1;
    }

    const newAction = {
      id: generateUUID(),
      position: selectedPosition,
      action: action as ActionType,
      betSize: finalBetSize,
      potSize: newPotSize,
      timestamp: Date.now(),
      phase: hand.currentPhase,
      opponentType: hand.currentOpponentType,
    };

    dispatch({ type: 'ADD_ACTION', payload: newAction });
    resetSelection();
  };

  return (
    <div className="space-y-4 bg-gray-900">
      {step === 'position' && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">相手のポジション選択</h3>
          <PositionSelector
            selectedPosition={selectedPosition}
            onSelect={handlePositionSelect}
          />
        </div>
      )}

      {step === 'action' && selectedPosition && (
        <div>
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-400">
                {selectedPosition} のアクション
              </h3>
              <button
                onClick={resetSelection}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                位置を変更
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              フェーズ: <span className="text-blue-400">{hand.currentPhase}</span>
            </p>
          </div>

          {hand.currentPhase === 'Preflop' ? (
            <PreflopActionSelector
              potSize={hand.potSize}
              onActionSelect={handleActionSelect}
            />
          ) : (
            <PostflopActionSelector
              potSize={hand.potSize}
              onActionSelect={handleActionSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}
