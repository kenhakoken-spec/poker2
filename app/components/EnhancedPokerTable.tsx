'use client';

import { useState, useEffect, useRef } from 'react';
import { EnhancedActionPanel } from './EnhancedActionPanel';
import { StackHeader } from './StackHeader';
import { ActionLog } from './ActionLog';
import { BoardPicker } from './BoardPicker';
import { HandResultModal } from './HandResultModal';
import { HandHistoryView } from './HandHistoryView';
import { usePokerEngineWithState } from '@/lib/usePokerEngine';
import { saveHand } from '@/lib/handStorage';
import type { HandResult } from '@/types/poker';

/**
 * エンジン統合版のポーカーテーブル
 */
export function EnhancedPokerTable() {
  const {
    state,
    setHeroPosition,
    setHeroHand,
    setBoard,
    setCurrentOpponentType,
    setStackSize,
    addAction,
    setHandResult,
    reset,
  } = usePokerEngineWithState();

  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [prevPhase, setPrevPhase] = useState<'Preflop' | 'Flop' | 'Turn' | 'River'>('Preflop');
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [showActionLogAfterFinish, setShowActionLogAfterFinish] = useState(false);
  const [completedHandState, setCompletedHandState] = useState<{
    actions: typeof state.actions;
    potSize: number;
    heroPosition: typeof state.heroPosition;
    heroHand: typeof state.heroHand;
    board: typeof state.board;
    currentPhase: typeof state.currentPhase;
    result: typeof state.result;
    stackSize: number;
  } | null>(null);
  
  // 二重保存防止のためのフラグ
  const savedHandRef = useRef<string | null>(null);

  // waitingForBoardを監視してボード入力モーダルを自動的に開く
  useEffect(() => {
    // waitingForBoard状態になったらモーダルを開く
    if (state.waitingForBoard && !boardModalOpen) {
      setBoardModalOpen(true);
    }
  }, [state.waitingForBoard, boardModalOpen]);

  // フェーズ変更を追跡
  useEffect(() => {
    if (state.currentPhase !== prevPhase) {
      setPrevPhase(state.currentPhase);
    }
  }, [state.currentPhase, prevPhase]);

  // ハンド完了を監視して結果入力モーダルを自動的に開く
  useEffect(() => {
    if (state.isReadyForResult && !resultModalOpen && !boardModalOpen) {
      setResultModalOpen(true);
    }
  }, [state.isReadyForResult, resultModalOpen, boardModalOpen]);

  // ハンド完了かつ結果が設定されたら自動保存
  useEffect(() => {
    if (state.isComplete && state.result && !savedHandRef.current) {
      // ハンドを保存
      saveHand(
        state.heroPosition,
        state.currentOpponentType,
        state.board,
        state.actions,
        state.potSize,
        state.heroHand
      );
      
      // 保存済みフラグを設定
      savedHandRef.current = `hand_${Date.now()}`;
    }
  }, [state.isComplete, state.result]); // 依存配列を最小限に（state.board/actionsは参照が変わりやすいため除外）

  // Get board cards for exclusion - useMemoを削除して直接計算
  const boardCards: string[] = [];
  if (state.board.flop) boardCards.push(...state.board.flop);
  if (state.board.turn) boardCards.push(state.board.turn);
  if (state.board.river) boardCards.push(state.board.river);

  // Get active players (not folded, excluding hero) - useMemoを削除して直接計算
  const activePlayers = state.players
    .filter(p => !p.folded && !p.isHero)
    .map(p => ({
      position: p.position,
      isHero: false, // Always false since we filtered hero out
    }));

  // Get all players (including folded) - useMemoを削除して直接計算
  const allPlayers = state.players.map(p => ({
    position: p.position,
    folded: p.folded,
    isHero: p.isHero,
  }));

  // Handle result submission
  const handleResultSubmit = (result: HandResult) => {
    // 結果を設定（useEffectで自動保存される）
    setHandResult(result);
    
    // モーダルを閉じる
    setResultModalOpen(false);
    
    // 現在のハンド状態を保存してアクションログ画面を表示
    setCompletedHandState({
      actions: state.actions,
      potSize: state.potSize,
      heroPosition: state.heroPosition,
      heroHand: state.heroHand,
      board: state.board,
      currentPhase: state.currentPhase,
      result: result,
      stackSize: state.stackSize,
    });
    setShowActionLogAfterFinish(true);
  };
  
  // BackボタンでTOP画面に戻る
  const handleBackToTop = () => {
    setShowActionLogAfterFinish(false);
    setCompletedHandState(null);
    // リセットして次のハンドに入力可能にする
    reset();
    savedHandRef.current = null;
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white min-w-[320px]">
      {/* タブナビゲーション */}
      <div className="flex border-b border-gray-800/50 backdrop-blur-sm bg-gray-950/30">
        <button
          onClick={() => setActiveTab('input')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'input'
              ? 'bg-gray-900/50 text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/30'
          }`}
        >
          Hand Input
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'history'
              ? 'bg-gray-900/50 text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/30'
          }`}
        >
          History
        </button>
      </div>

      {/* コンテンツエリア */}
      {activeTab === 'input' ? (
        (showActionLogAfterFinish && completedHandState) ? (
          // FINISH後のアクションログ画面
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with Back button */}
            <div className="px-4 py-3 border-b border-gray-800/50 backdrop-blur-sm bg-gray-950/30 flex-shrink-0">
              <button
                onClick={handleBackToTop}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                ← Back to Top
              </button>
            </div>
            
            {/* Full Action Log */}
            <div className="flex-1 overflow-y-auto p-4">
              <ActionLog 
                actions={completedHandState.actions} 
                potSize={completedHandState.potSize}
                heroPosition={completedHandState.heroPosition}
                heroHand={completedHandState.heroHand}
                stackSize={completedHandState.stackSize}
                board={completedHandState.board}
                currentPhase={completedHandState.currentPhase}
                result={completedHandState.result}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 上部10%: コンパクトなログ表示 */}
          <div className="h-[10vh] min-h-[50px] max-h-[80px] border-b border-gray-800/50 overflow-hidden backdrop-blur-sm bg-gray-950/30">
            <ActionLog 
              actions={state.actions} 
              potSize={state.potSize}
              heroPosition={state.heroPosition}
              heroHand={state.heroHand}
              stackSize={state.stackSize}
              board={state.board}
              currentPhase={state.currentPhase}
              result={state.result}
            />
          </div>

          {/* 下部90%: 操作パネル */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* ヘッダー: Stack + Hand Input */}
            <StackHeader
              stackSize={state.stackSize}
              heroPosition={state.heroPosition}
              heroHand={state.heroHand}
              onStackSizeChange={setStackSize}
              onHandChange={setHeroHand}
            />

            {/* アクション選択パネル（エンジン統合版） */}
            <div className="flex-1 overflow-y-auto relative">
              <EnhancedActionPanel
                state={state}
                onAddAction={addAction}
                onSetHeroPosition={setHeroPosition}
                onSetOpponentType={setCurrentOpponentType}
              />
              
              {/* リセットボタン - 右下に小さく配置 */}
              <button
                onClick={() => {
                  savedHandRef.current = null;
                  reset();
                }}
                className="fixed bottom-4 right-4 px-3 py-2 bg-gray-800/90 hover:bg-gray-700 rounded-full text-xs text-gray-400 hover:text-gray-200 transition-all shadow-lg border border-gray-700 z-40"
                title="Reset Hand"
              >
                ↻ Reset
              </button>
            </div>

            {/* ボード入力モーダル（自動オープン） */}
            <BoardPicker
              board={state.board}
              onBoardChange={setBoard}
              isOpen={boardModalOpen}
              onOpenChange={setBoardModalOpen}
              currentPhase={state.currentPhase}
              heroHand={state.heroHand}
            />

            {/* 結果入力モーダル（自動オープン） */}
            <HandResultModal
              isOpen={resultModalOpen}
              onClose={() => setResultModalOpen(false)}
              onSubmit={handleResultSubmit}
              activePlayers={activePlayers}
              allPlayers={allPlayers}
              heroPosition={state.heroPosition}
              potSize={state.potSize}
              completionType={state.completionType || 'showdown'}
              boardCards={boardCards}
              heroHand={state.heroHand}
              actions={state.actions}
            />
          </div>
          </div>
        )
      ) : (
        <div className="flex-1 overflow-hidden">
          <HandHistoryView />
        </div>
      )}
    </div>
  );
}
