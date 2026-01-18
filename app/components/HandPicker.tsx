'use client';

import { useState } from 'react';
import { X, Hand } from 'lucide-react';

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

interface HandPickerProps {
  hand?: [string, string];
  onHandChange: (hand: [string, string]) => void;
}

export function HandPicker({ hand, onHandChange }: HandPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>(hand ? [...hand] : []);

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

  const handleCardSelect = (card: string) => {
    if (selectedCards.includes(card)) {
      // すでに選択済みの場合は削除
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else if (selectedCards.length < 2) {
      // 2枚まで選択可能
      const newCards = [...selectedCards, card];
      setSelectedCards(newCards);
      if (newCards.length === 2) {
        onHandChange(newCards as [string, string]);
        setIsOpen(false);
        setSelectedCards([]);
      }
    }
  };

  const clearHand = () => {
    setSelectedCards([]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
          hand 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-red-900/50 hover:bg-red-800/50 border-2 border-red-500/50'
        }`}
      >
        {!hand && <Hand className="w-3.5 h-3.5" />}
        {hand ? (
          <span className="text-xs font-semibold">
            <span className={getSuitColor(hand[0])}>{hand[0]}</span>
            {' '}
            <span className={getSuitColor(hand[1])}>{hand[1]}</span>
          </span>
        ) : (
          <span className="text-xs font-semibold">Hand Input *</span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2">
          <div className="bg-gray-800 rounded-lg w-full max-w-[400px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h2 className="text-base font-semibold">Select Your Hand</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedCards([]);
                }}
                className="p-1.5 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* 選択中のカード表示 */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Selected Hand</h3>
                <div className="flex gap-2">
                  {[0, 1].map((idx) => (
                    <div
                      key={idx}
                      className={`w-14 h-20 flex items-center justify-center rounded-md border-2 ${
                        selectedCards[idx]
                          ? 'bg-white border-transparent'
                          : 'bg-gray-700 border-gray-600 text-gray-400'
                      } text-base font-bold`}
                    >
                      <span className={selectedCards[idx] ? getSuitColor(selectedCards[idx]) : ''}>
                        {selectedCards[idx] || '?'}
                      </span>
                    </div>
                  ))}
                  {selectedCards.length > 0 && (
                    <button
                      onClick={clearHand}
                      className="px-2 text-[10px] text-red-400 hover:text-red-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5">
                  Select 2 cards
                </p>
              </div>

              {/* カード選択グリッド - マトリックス形式（モバイル最適化） */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Card Selection</h3>
                <div className="overflow-x-auto">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="w-4"></th>
                        {ranks.map((rank) => (
                          <th key={rank} className="px-px py-px text-[8px] text-gray-400 font-semibold">
                            {rank}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {suits.map((suit) => (
                        <tr key={suit}>
                          <td className={`px-0.5 py-px text-center font-bold text-[11px] ${getSuitColorOnly(suit)}`}>
                            {suit}
                          </td>
                          {ranks.map((rank) => {
                            const card = `${rank}${suit}`;
                            const isSelected = selectedCards.includes(card);
                            return (
                              <td key={card} className="p-px">
                                <button
                                  onClick={() => handleCardSelect(card)}
                                  className={`w-5 h-5 rounded text-[9px] font-bold transition-colors ${
                                    isSelected
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-700 hover:bg-gray-600 active:scale-110'
                                  }`}
                                >
                                  <span className={getSuitColorOnly(suit)}>
                                    {rank}
                                  </span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
