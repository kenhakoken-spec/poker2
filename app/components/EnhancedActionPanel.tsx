'use client';

import { useState } from 'react';
import type { Position, ActionType } from '@/types/poker';
import type { EnhancedPokerState } from '@/lib/usePokerEngine';
import { POSITION_ORDER } from '@/lib/PokerHandEngine';

interface EnhancedActionPanelProps {
  state: EnhancedPokerState;
  onAddAction: (position: Position, actionType: ActionType, betSize?: number) => void;
  onSetHeroPosition: (position: Position | null) => void;
  onSetOpponentType: (type: 'Reg' | 'Fish' | 'Nit') => void;
}

/**
 * エンジン統合版アクションパネル
 * - プリフロップのスキップ機能
 * - 手番の明示
 * - ヒーローの強調表示
 * - テキサスホールデムのルールに準拠したアクション表示
 */
export function EnhancedActionPanel({ state, onAddAction, onSetHeroPosition, onSetOpponentType }: EnhancedActionPanelProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showBetInput, setShowBetInput] = useState(false);
  const [betAmount, setBetAmount] = useState<string>('3');
  const [isHeroForThisAction, setIsHeroForThisAction] = useState(false);
  const [opponentTypeForThisAction, setOpponentTypeForThisAction] = useState<'Reg' | 'Fish' | 'Nit'>('Reg');

  const { currentActor, currentPhase, potSize, heroPosition, availablePositions, availableActions, players, currentBet, waitingForBoard } = state;

  // プレイヤーがアクション済みかチェック
  const hasActed = (position: Position): boolean => {
    return state.actions.some(action => 
      action.position === position && action.phase === currentPhase
    );
  };

  // プレイヤーがフォールド済みかチェック
  const hasFolded = (position: Position): boolean => {
    const player = players.find(p => p.position === position);
    return player ? player.folded : false;
  };

  // プレイヤーが参加中かチェック（フロップ以降用）
  const isActive = (position: Position): boolean => {
    return !hasFolded(position);
  };

  // 選択されたポジションの利用可能なアクションを取得
  // エンジンのgetAvailableActionsを使用して正確なルールを適用
  const getActionsForPosition = (position: Position): ActionType[] => {
    // ポストフロップでは現在のアクターのみアクション可能
    if (currentPhase !== 'Preflop' && position !== currentActor) {
      return [];
    }
    
    // エンジンのgetAvailableActionsを使用（利用可能な場合）
    if (state.availableActions && state.currentActor === position) {
      return state.availableActions;
    }
    
    // フォールバック：手動で判定
    const player = players.find(p => p.position === position);
    if (!player || player.folded) return [];
    
    const actions: ActionType[] = [];
    
    // チェック可能か（ベットに対してマッチしている場合）
    const canCheck = player.contributed >= currentBet;
    
    if (canCheck) {
      // チェック可能な場合はフォールドを選択できない（テキサスホールデムのルール）
      actions.push('Check');
      
      // ベット/レイズを追加
      if (currentPhase !== 'Preflop' && currentBet === 0) {
        actions.push('Bet');
      } else {
        actions.push('Raise');
      }
    } else {
      // コールが必要な場合のみフォールド可能
      actions.push('Fold');
      actions.push('Call');
      actions.push('Raise');
    }
    
    return actions;
  };

  // ポジション選択
  const handlePositionSelect = (position: Position) => {
    // ポストフロップでは現在のアクターのみアクション可能
    if (currentPhase !== 'Preflop' && position !== currentActor) {
      return;
    }
    
    setSelectedPosition(position);
    setShowBetInput(false);
    setIsHeroForThisAction(position === heroPosition);
    setOpponentTypeForThisAction('Reg');
  };

  // アクション実行前の処理
  const handleActionWithMetadata = (actionType: ActionType, betSize?: number) => {
    if (!selectedPosition) return;
    
    // ヒーローとして設定
    if (isHeroForThisAction && selectedPosition !== heroPosition) {
      onSetHeroPosition(selectedPosition);
    }
    
    // 相手タイプを設定
    if (!isHeroForThisAction) {
      onSetOpponentType(opponentTypeForThisAction);
    }
    
    // アクションを記録
    onAddAction(selectedPosition, actionType, betSize);
    
    // リセット（次のアクションのために状態をクリア）
    setSelectedPosition(null);
    setShowBetInput(false);
    setIsHeroForThisAction(false);
    setOpponentTypeForThisAction('Reg');
  };

  // アクション実行
  const handleAction = (actionType: ActionType, betSize?: number) => {
    handleActionWithMetadata(actionType, betSize);
  };

  // ベット/レイズ
  const handleBetRaise = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    // 適切なアクションタイプを決定
    const positionActions = selectedPosition ? getActionsForPosition(selectedPosition) : [];
    const actionType = positionActions.includes('Bet') ? 'Bet' : 'Raise';
    handleAction(actionType, amount);
  };

  // プリセットベット
  const handlePresetBet = (percentage: number) => {
    const amount = (potSize * percentage) / 100;
    const positionActions = selectedPosition ? getActionsForPosition(selectedPosition) : [];
    const actionType = positionActions.includes('Bet') ? 'Bet' : 'Raise';
    handleAction(actionType, amount);
  };

  // プリセットレイズ
  const handlePresetRaise = (multiplier: number) => {
    let amount: number;
    
    if (currentPhase === 'Preflop') {
      // プリフロップ
      if (currentBet === 1.0) {
        // Open Raise (currentBet = 1.0 = BB)
        // multiplierはBBに対する倍率
        amount = multiplier; // 例: 3 = 3BB
      } else {
        // 3bet以降 (既にレイズがある)
        // multiplierは前のレイズサイズ（currentBet）の倍率
        // total = currentBet * multiplier
        amount = currentBet * multiplier; // 例: currentBet=3BB, multiplier=3 → 9BB total
      }
    } else {
      // ポストフロップ
      if (currentBet === 0) {
        // Bet (ベットがない)
        // multiplierはポットサイズの倍率
        amount = potSize * multiplier;
      } else {
        // Raise (既にベットがある)
        // multiplierは前のベットサイズ（currentBet）の倍率
        // total = currentBet * multiplier
        amount = currentBet * multiplier;
      }
    }
    
    handleAction('Raise', amount);
  };

  // ボード待ち状態の表示
  if (waitingForBoard) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-blue-400 mb-4">Waiting for Board</h2>
        <p className="text-gray-400">
          {currentPhase === 'Flop' && 'Please input the Flop cards'}
          {currentPhase === 'Turn' && 'Please input the Turn card'}
          {currentPhase === 'River' && 'Please input the River card'}
        </p>
      </div>
    );
  }

  if (state.isComplete) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-green-400 mb-4">Hand Complete</h2>
        <p className="text-gray-400">Final Pot: {potSize.toFixed(1)}bb</p>
      </div>
    );
  }

  // 選択されたポジションの利用可能なアクション
  const positionActions = selectedPosition ? getActionsForPosition(selectedPosition) : [];
  const canCheck = positionActions.includes('Check');
  const canFold = positionActions.includes('Fold');
  const canCall = positionActions.includes('Call');
  const canBet = positionActions.includes('Bet');
  const canRaise = positionActions.includes('Raise');

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950">
      {/* 現在の手番表示 */}
      <div className="px-3 py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400">Current Actor</p>
            <p className="text-sm font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              {currentActor || 'Waiting'}
              {currentActor === heroPosition && (
                <span className="ml-1.5 text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">(you)</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Phase</p>
            <p className="text-sm font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">{currentPhase}</p>
          </div>
        </div>
        <div className="mt-1.5">
          <p className="text-[10px] text-gray-500">
            <span className="text-green-400 font-semibold text-xs">Total: {state.potDetails.totalPot.toFixed(1)}bb</span>
            {' | '}
            Start: <span className="text-gray-400 font-semibold">{state.potDetails.startingPot.toFixed(1)}bb</span>
            {' + '}
            Added: <span className="text-green-400 font-semibold">{state.potDetails.addedThisStreet.toFixed(1)}bb</span>
            {currentBet > 0 && (
              <>
                {' | '}
                Bet: <span className="text-yellow-400 font-semibold">{currentBet.toFixed(1)}bb</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ポジション選択 */}
      {!selectedPosition && (
        <div className="p-3 space-y-2">
          <h3 className="text-xs font-semibold text-gray-300">Action Input</h3>
          
          {/* シンプルなグリッドレイアウト（2行×3列） */}
          <div className="space-y-1.5">
            {/* 上段：UTG, HJ, CO */}
            <div className="grid grid-cols-3 gap-1.5">
              {['UTG', 'HJ', 'CO'].map((pos) => {
                const position = pos as Position;
                const isAvailable = availablePositions.includes(position);
                const isHero = position === heroPosition;
                const acted = hasActed(position);
                const folded = hasFolded(position);
                const active = isActive(position);
                
                return (
                  <button
                    key={position}
                    onClick={() => isAvailable && handlePositionSelect(position)}
                    disabled={!isAvailable}
                    className={`
                      relative px-2.5 py-2 rounded-lg font-semibold text-xs transition-all shadow-lg min-h-[44px]
                      ${isAvailable 
                        ? isHero
                          ? 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white hover:from-yellow-500 hover:to-yellow-600 hover:shadow-xl active:scale-95'
                          : acted
                          ? 'bg-gradient-to-br from-green-700 to-green-800 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl active:scale-95'
                          : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700 hover:shadow-xl active:scale-95'
                        : folded
                        ? 'bg-gray-950 text-gray-700 cursor-not-allowed opacity-20 line-through'
                        : currentPhase !== 'Preflop' && !active
                        ? 'bg-gray-950 text-gray-700 cursor-not-allowed opacity-20'
                        : 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-30'
                      }
                    `}
                  >
                    {position}
                    {isHero && <span className="block text-[9px] mt-0.5 opacity-80">Hero</span>}
                    {acted && !folded && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-900"></span>
                    )}
                    {folded && currentPhase !== 'Preflop' && (
                      <span className="block text-[8px] text-red-500 opacity-60 mt-0.5">Fold</span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* 下段：BTN, SB, BB */}
            <div className="grid grid-cols-3 gap-1.5">
              {['BTN', 'SB', 'BB'].map((pos) => {
                const position = pos as Position;
                const isAvailable = availablePositions.includes(position);
                const isHero = position === heroPosition;
                const acted = hasActed(position);
                const folded = hasFolded(position);
                const active = isActive(position);
                
                return (
                  <button
                    key={position}
                    onClick={() => isAvailable && handlePositionSelect(position)}
                    disabled={!isAvailable}
                    className={`
                      relative px-2.5 py-2 rounded-lg font-semibold text-xs transition-all shadow-lg min-h-[44px]
                      ${isAvailable 
                        ? isHero
                          ? 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white hover:from-yellow-500 hover:to-yellow-600 hover:shadow-xl active:scale-95'
                          : acted
                          ? 'bg-gradient-to-br from-green-700 to-green-800 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl active:scale-95'
                          : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700 hover:shadow-xl active:scale-95'
                        : folded
                        ? 'bg-gray-950 text-gray-700 cursor-not-allowed opacity-20 line-through'
                        : currentPhase !== 'Preflop' && !active
                        ? 'bg-gray-950 text-gray-700 cursor-not-allowed opacity-20'
                        : 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-30'
                      }
                    `}
                  >
                    {position}
                    {isHero && <span className="block text-[9px] mt-0.5 opacity-80">Hero</span>}
                    {acted && !folded && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-900"></span>
                    )}
                    {folded && currentPhase !== 'Preflop' && (
                      <span className="block text-[8px] text-red-500 opacity-60 mt-0.5">Fold</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* アクション選択 */}
      {selectedPosition && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl w-full max-w-[400px] max-h-[85vh] flex flex-col shadow-2xl border border-gray-700">
            <div className="px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xs font-semibold text-gray-300">
                {selectedPosition} Action
                {canCheck && <span className="ml-2 text-green-400 text-[10px]">(can check)</span>}
                {canFold && !canCheck && <span className="ml-2 text-yellow-400 text-[10px]">(facing {currentBet.toFixed(1)}bb)</span>}
              </h3>
              <button
                onClick={() => setSelectedPosition(null)}
                className="px-2 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
              >
                Back
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {/* ヒーローチェックボックス & 相手タイプ */}
            <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg border border-gray-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHeroForThisAction}
                  onChange={(e) => setIsHeroForThisAction(e.target.checked)}
                  className="w-3.5 h-3.5 cursor-pointer accent-yellow-500"
                />
                <span className="text-xs text-gray-300">you?</span>
              </label>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400">Type:</span>
                <select
                  value={opponentTypeForThisAction}
                  onChange={(e) => setOpponentTypeForThisAction(e.target.value as 'Reg' | 'Fish' | 'Nit')}
                  disabled={isHeroForThisAction}
                  className={`px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-[10px] text-white focus:outline-none focus:border-blue-500 transition-all ${
                    isHeroForThisAction ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="Reg">Reg</option>
                  <option value="Fish">Fish</option>
                  <option value="Nit">Nit</option>
                </select>
              </div>
            </div>

            {/* 基本アクション - ルールに基づいて表示 */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* フォールド - ベットに直面している場合のみ表示 */}
              {canFold && (
                <button
                  onClick={() => handleAction('Fold')}
                  className="px-3 py-2.5 rounded-lg font-semibold text-xs bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 min-h-[44px] shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Fold
                </button>
              )}
              
              {/* チェック - チェック可能な場合のみ表示 */}
              {canCheck && (
                <button
                  onClick={() => handleAction('Check')}
                  className="px-3 py-2.5 rounded-lg font-semibold text-xs bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 min-h-[44px] shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Check
                </button>
              )}
              
              {/* コール - ベットに直面している場合のみ表示 */}
              {canCall && (
                <button
                  onClick={() => handleAction('Call')}
                  className="px-3 py-2.5 rounded-lg font-semibold text-xs bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 min-h-[44px] shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Call
                  <span className="block text-[10px] opacity-80">
                    {(() => {
                      const player = players.find(p => p.position === selectedPosition);
                      if (player) {
                        return `${(currentBet - player.contributed).toFixed(1)}bb`;
                      }
                      return '';
                    })()}
                  </span>
                </button>
              )}
            </div>

            {/* プリフロップのプリセットレイズ */}
            {currentPhase === 'Preflop' && canRaise && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400">Preset {state.raiseLabel}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handlePresetRaise(2)}
                    className="px-3 py-2.5 rounded-lg font-semibold text-xs bg-gradient-to-br from-yellow-600 to-yellow-700 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    2x
                    <span className="block text-[10px] font-normal">
                      {(() => {
                        let displayAmount: number;
                        if (currentPhase === 'Preflop') {
                          displayAmount = currentBet === 1.0 ? 2 : (currentBet * 2);
                        } else {
                          displayAmount = currentBet === 0 ? (potSize * 2) : (currentBet * 2);
                        }
                        return `(${displayAmount.toFixed(1)}bb)`;
                      })()}
                    </span>
                  </button>
                  <button
                    onClick={() => handlePresetRaise(3)}
                    className="px-3 py-2.5 rounded-lg font-semibold text-xs bg-gradient-to-br from-yellow-600 to-yellow-700 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    3x
                    <span className="block text-[10px] font-normal">
                      {(() => {
                        let displayAmount: number;
                        if (currentPhase === 'Preflop') {
                          displayAmount = currentBet === 1.0 ? 3 : (currentBet * 3);
                        } else {
                          displayAmount = currentBet === 0 ? (potSize * 3) : (currentBet * 3);
                        }
                        return `(${displayAmount.toFixed(1)}bb)`;
                      })()}
                    </span>
                  </button>
                </div>
                {/* プリフロップでもオールインボタンを表示 */}
                <button
                  onClick={() => handleAction('Raise', 999)}
                  className="w-full px-3 py-2.5 rounded-lg font-semibold text-xs bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  All-in
                </button>
              </div>
            )}

            {/* ポストフロップのプリセットベット/レイズ */}
            {currentPhase !== 'Preflop' && (canBet || canRaise) && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400">Preset {state.raiseLabel}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[33, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePresetBet(pct)}
                      className="px-1.5 py-2.5 rounded-lg font-semibold text-[10px] bg-gradient-to-br from-yellow-600 to-yellow-700 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      {pct}%
                      <span className="block text-[9px] font-normal">
                        {((potSize * pct) / 100).toFixed(1)}bb
                      </span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handlePresetBet(150)}
                    className="px-1.5 py-2.5 rounded-lg font-semibold text-[10px] bg-gradient-to-br from-orange-600 to-orange-700 text-white hover:from-orange-500 hover:to-orange-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    150%
                    <span className="block text-[9px] font-normal">
                      {((potSize * 150) / 100).toFixed(1)}bb
                    </span>
                  </button>
                  <button
                    onClick={() => handleAction(canBet ? 'Bet' : 'Raise', 999)}
                    className="px-1.5 py-2.5 rounded-lg font-semibold text-[10px] bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    All-in
                  </button>
                </div>
              </div>
            )}

            {/* カスタムベット/レイズ */}
            {(canBet || canRaise) && (
              <div className="space-y-1.5 border-t border-gray-700 pt-2.5">
                <button
                  onClick={() => setShowBetInput(!showBetInput)}
                  className="w-full px-3 py-2 rounded-lg font-semibold text-xs bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  {showBetInput ? 'Close Custom' : 'Custom Size'}
                </button>
                
                {showBetInput && (
                  <div className="space-y-1.5">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Bet size (BB)"
                      step="0.5"
                      min="0"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    />
                    <button
                      onClick={handleBetRaise}
                      className="w-full px-3 py-2 rounded-lg font-semibold text-xs bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      {state.raiseLabel} {betAmount}bb
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
