'use client';

import { useMemo } from 'react';

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

function getSuitColor(card: string): string {
  if (card.includes('♦')) return 'text-blue-500';
  if (card.includes('♣')) return 'text-green-500';
  if (card.includes('♠')) return 'text-gray-200';
  if (card.includes('♥')) return 'text-red-500';
  return 'text-white';
}

interface SimpleCardPickerProps {
  onCardSelect: (card: string) => void;
  excludedCards?: string[]; // Already selected cards to exclude
  selectedCards?: string[]; // Cards to highlight
}

export function SimpleCardPicker({ onCardSelect, excludedCards = [], selectedCards = [] }: SimpleCardPickerProps) {
  const allCards = useMemo(() => {
    const cards: string[] = [];
    for (const rank of ranks) {
      for (const suit of suits) {
        cards.push(`${rank}${suit}`);
      }
    }
    return cards;
  }, []);

  return (
    <div className="space-y-2">
      {ranks.map((rank) => (
        <div key={rank} className="flex gap-1">
          <div className="w-8 flex items-center justify-center text-xs text-gray-400 font-semibold">
            {rank}
          </div>
          <div className="flex gap-1 flex-wrap">
            {suits.map((suit) => {
              const card = `${rank}${suit}`;
              const isExcluded = excludedCards.includes(card);
              const isSelected = selectedCards.includes(card);
              
              return (
                <button
                  key={card}
                  onClick={() => !isExcluded && onCardSelect(card)}
                  disabled={isExcluded}
                  className={`
                    w-10 h-10 rounded border text-sm font-bold transition-all
                    ${isExcluded 
                      ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed opacity-40' 
                      : isSelected
                      ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/30 scale-105'
                      : 'bg-gray-900 border-gray-700 hover:border-purple-500 hover:bg-gray-800 hover:scale-105'
                    }
                    ${getSuitColor(card)}
                  `}
                >
                  {card}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
