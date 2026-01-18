'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Edit3 } from 'lucide-react';
import type { BoardState } from '@/types/poker';

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

// スートのみの色を返す（スート列用）
function getSuitColorOnly(suit: string): string {
  if (suit === '♦') return 'text-blue-500'; // ダイヤは青
  if (suit === '♣') return 'text-green-500'; // クラブは緑
  if (suit === '♠') return 'text-gray-200'; // スペードは明るいグレー（ダークモード対応）
  if (suit === '♥') return 'text-red-500'; // ハートは赤
  return 'text-white';
}

// カードのスートに応じた色を返す
function getSuitColor(card: string): string {
  if (card.includes('♦')) return 'text-blue-500'; // ダイヤは青
  if (card.includes('♣')) return 'text-green-500'; // クラブは緑
  if (card.includes('♠')) return 'text-gray-200'; // スペードは明るいグレー（ダークモード対応）
  if (card.includes('♥')) return 'text-red-500'; // ハートは赤
  return 'text-white';
}

interface BoardPickerProps {
  board: BoardState;
  onBoardChange: (board: BoardState) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentPhase?: 'Preflop' | 'Flop' | 'Turn' | 'River';
  heroHand?: [string, string];
}

export function BoardPicker({ board, onBoardChange, isOpen: externalIsOpen, onOpenChange, currentPhase, heroHand }: BoardPickerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // ローカル状態でボードカードを管理
  const [localBoardCards, setLocalBoardCards] = useState<(string | null)[]>([null, null, null, null, null]);
  
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  // boardが変更されたらlocalBoardCardsを更新（モーダルが閉じているときのみ）
  useEffect(() => {
    if (!isOpen) {
      const syncedCards = [
        board.flop?.[0] || null,
        board.flop?.[1] || null,
        board.flop?.[2] || null,
        board.turn || null,
        board.river || null,
      ];
      setLocalBoardCards(syncedCards);
    }
  }, [board, isOpen]);
  
  // モーダルが開いたときにboardから同期
  useEffect(() => {
    if (isOpen) {
      const syncedCards = [
        board.flop?.[0] || null,
        board.flop?.[1] || null,
        board.flop?.[2] || null,
        board.turn || null,
        board.river || null,
      ];
      setLocalBoardCards(syncedCards);
    }
  }, [isOpen]); // isOpenが変わったときだけ

  // モーダルが開いたら自動的に最初の未入力カードを編集対象にする
  useEffect(() => {
    if (isOpen) {
      // 最初の未入力カードを見つける
      const firstEmptyIndex = localBoardCards.findIndex((card, idx) => {
        if (!card) {
          // 順序チェック: フロップは順番、ターンはフロップ後、リバーはターン後
          if (idx === 0) return true;
          if (idx === 1) return localBoardCards[0] !== null;
          if (idx === 2) return localBoardCards[0] !== null && localBoardCards[1] !== null;
          if (idx === 3) return localBoardCards[0] !== null && localBoardCards[1] !== null && localBoardCards[2] !== null;
          if (idx === 4) return localBoardCards[3] !== null;
        }
        return false;
      });
      
      if (firstEmptyIndex !== -1) {
        setEditingIndex(firstEmptyIndex);
      } else {
        // 全て入力済みなら最初のカードを編集対象に
        setEditingIndex(0);
      }
    } else {
      setEditingIndex(null);
    }
  }, [isOpen, localBoardCards]);

  const generateCards = () => {
    const cards: string[] = [];
    for (const rank of ranks) {
      for (const suit of suits) {
        cards.push(`${rank}${suit}`);
      }
    }
    return cards;
  };

  const allCards = generateCards();

  // カード選択時の処理
  const handleCardSelect = (card: string) => {
    if (editingIndex === null) {
      return;
    }

    const newBoardCards = [...localBoardCards];
    newBoardCards[editingIndex] = card;
    
    // ローカル状態を更新
    setLocalBoardCards(newBoardCards);

    // BoardStateに変換
    const newBoard: BoardState = {};
    
    // フロップは3枚揃ったら設定
    if (newBoardCards[0] && newBoardCards[1] && newBoardCards[2]) {
      newBoard.flop = [newBoardCards[0], newBoardCards[1], newBoardCards[2]] as [string, string, string];
    }
    
    if (newBoardCards[3]) {
      newBoard.turn = newBoardCards[3];
    }
    if (newBoardCards[4]) {
      newBoard.river = newBoardCards[4];
    }

    onBoardChange(newBoard);
    
    // 次のカードに自動で移動
    const nextIndex = editingIndex + 1;
    if (nextIndex < 5) {
      // 次のカードが選択可能かチェック
      const canSelectNext = 
        (nextIndex === 1 && newBoardCards[0]) ||
        (nextIndex === 2 && newBoardCards[0] && newBoardCards[1]) ||
        (nextIndex === 3 && newBoardCards[0] && newBoardCards[1] && newBoardCards[2]) ||
        (nextIndex === 4 && newBoardCards[3]);
      
      if (canSelectNext) {
        setEditingIndex(nextIndex);
      } else {
        setEditingIndex(null);
      }
    } else {
      setEditingIndex(null);
    }
    
    // フロップの3枚目、ターン、リバーを入力したら自動で閉じる
    if (editingIndex === 2 || editingIndex === 3 || editingIndex === 4) {
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  // カードクリアハンドラー
  const handleClearCard = (index: number) => {
    const newBoardCards = [...localBoardCards];
    newBoardCards[index] = null;

    // 後続のカードも削除
    for (let i = index + 1; i < 5; i++) {
      newBoardCards[i] = null;
    }

    // BoardStateに変換
    const newBoard: BoardState = {};
    if (newBoardCards[0] && newBoardCards[1] && newBoardCards[2]) {
      newBoard.flop = [newBoardCards[0], newBoardCards[1], newBoardCards[2]] as [string, string, string];
    }
    if (newBoardCards[3]) {
      newBoard.turn = newBoardCards[3];
    }
    if (newBoardCards[4]) {
      newBoard.river = newBoardCards[4];
    }

    onBoardChange(newBoard);
    setEditingIndex(index);
  };

  // カードをクリックして編集
  const handleCardClick = (index: number) => {
    // 選択可能かチェック
    const canSelect = 
      index === 0 ||
      (index === 1 && localBoardCards[0]) ||
      (index === 2 && localBoardCards[0] && localBoardCards[1]) ||
      (index === 3 && localBoardCards[0] && localBoardCards[1] && localBoardCards[2]) ||
      (index === 4 && localBoardCards[3]);

    if (canSelect) {
      setEditingIndex(index);
    }
  };

  const getCardLabel = (index: number): string => {
    if (index < 3) return 'Flop';
    if (index === 3) return 'Turn';
    // index === 4の場合は、リバーカードが入力されていれば「Showdown」、なければ「River」
    if (index === 4 && localBoardCards[4]) {
      return 'Showdown';
    }
    return 'River';
  };

  // プリフロップでは表示しない
  if (currentPhase === 'Preflop' || !currentPhase) {
    return null;
  }

  // ここに到達した時点で、currentPhaseは'Flop' | 'Turn' | 'River'のみ
  return (
    <>
      {/* Board Change button - only show after flop */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-xs"
        title="Change board cards"
      >
        <Edit3 className="w-4 h-4" />
        <span>Board Change</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2">
          <div className="bg-gray-800 rounded-lg w-full max-w-[400px] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h2 className="text-base font-semibold">Board Cards</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {/* 5枚のカードを横並び表示 - モバイル対応で縮小 */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Board (5 cards)</h3>
                <div className="flex gap-1.5 items-end justify-center flex-wrap">
                  {localBoardCards.map((card, index) => {
                    const canSelect = 
                      index === 0 ||
                      (index === 1 && localBoardCards[0]) ||
                      (index === 2 && localBoardCards[0] && localBoardCards[1]) ||
                      (index === 3 && localBoardCards[0] && localBoardCards[1] && localBoardCards[2]) ||
                      (index === 4 && localBoardCards[3]);

                    return (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleCardClick(index)}
                          disabled={!canSelect}
                          className={`w-12 h-16 rounded-lg border-2 flex items-center justify-center font-bold text-base transition-all ${
                            editingIndex === index
                              ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105'
                              : card
                              ? 'bg-white border-gray-600 hover:border-blue-400'
                              : canSelect
                              ? 'bg-gray-700 border-gray-600 text-gray-500 hover:border-blue-400'
                              : 'bg-gray-900 border-gray-700 text-gray-700 cursor-not-allowed'
                          }`}
                        >
                          <span className={card ? getSuitColor(card) : ''}>
                            {card || '?'}
                          </span>
                        </button>
                        {card && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearCard(index);
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300"
                          >
                            Clear
                          </button>
                        )}
                        <span className="text-[10px] text-gray-500">{getCardLabel(index)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* カード選択グリッド - CSS Grid形式（モバイル最適化） */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-1.5">
                  {editingIndex !== null ? `Select ${getCardLabel(editingIndex)} Card` : 'Select a card position above'}
                </h3>
                
                {/* ランクヘッダー */}
                <div className="flex gap-px mb-px">
                  <div className="w-5"></div>
                  {ranks.map((rank) => (
                    <div key={rank} className="w-5 text-center text-[8px] text-gray-400 font-semibold">
                      {rank}
                    </div>
                  ))}
                </div>
                
                {/* カードグリッド */}
                {suits.map((suit) => (
                  <div key={suit} className="flex gap-px mb-px">
                    {/* スート列 */}
                    <div className={`w-5 flex items-center justify-center font-bold text-[11px] ${getSuitColorOnly(suit)}`}>
                      {suit}
                    </div>
                    
                    {/* カード行 */}
                    {ranks.map((rank) => {
                      const card = `${rank}${suit}`;
                      const isUsed = localBoardCards.some((c, idx) => c === card && idx !== editingIndex);
                      const isHeroCard = heroHand?.includes(card);
                      const isSelected = editingIndex !== null && localBoardCards[editingIndex] === card;
                      const canClick = editingIndex !== null && !isUsed && !isHeroCard;
                      
                      return (
                        <button
                          key={card}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (canClick) {
                              handleCardSelect(card);
                            }
                          }}
                          disabled={!canClick}
                          className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 ring-1 ring-blue-400 text-white'
                              : isUsed
                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed line-through'
                              : isHeroCard
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                              : canClick
                              ? 'bg-gray-700 hover:bg-gray-600 active:bg-blue-500 cursor-pointer'
                              : 'bg-gray-800 text-gray-600'
                          }`}
                        >
                          <span className={canClick || isSelected ? getSuitColorOnly(suit) : ''}>
                            {rank}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                
                <p className="text-[10px] text-gray-500 mt-1.5">
                  {editingIndex !== null ? 'Click a card to select' : 'Click a card position above to start'}
                  {heroHand && ' • Gray cards are in your hand'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
