'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Trophy, XCircle } from 'lucide-react';
import type { Position, HandResult, PlayerHandInfo, CompletionType, HandAction } from '@/types/poker';
import { SimpleCardPicker } from './SimpleCardPicker';

interface HandResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: HandResult) => void;
  activePlayers: Array<{ position: Position; isHero: boolean }>; // Players who reached showdown (not folded)
  allPlayers: Array<{ position: Position; folded: boolean; isHero: boolean }>; // All players including folded
  heroPosition: Position | null;
  potSize: number;
  completionType: CompletionType;
  boardCards?: string[]; // For exclusion
  heroHand?: [string, string]; // For exclusion
  actions?: HandAction[]; // Add action history for accurate calculation
}

type PlayerHandState = {
  position: Position;
  hand: [string, string] | null;
  mucked: boolean;
  isWinner: boolean;
};

export function HandResultModal({
  isOpen,
  onClose,
  onSubmit,
  activePlayers,
  allPlayers,
  heroPosition,
  potSize,
  completionType,
  boardCards = [],
  heroHand,
  actions = [],
}: HandResultModalProps) {
  const [step, setStep] = useState<'winner' | 'hands'>('winner');
  const [heroWon, setHeroWon] = useState<boolean | null>(null);
  const [winnerPosition, setWinnerPosition] = useState<Position | null>(null);
  const [playerHands, setPlayerHands] = useState<Partial<Record<Position, PlayerHandState>>>({});
  const [heroHandLocal, setHeroHandLocal] = useState<[string, string] | null>(heroHand ? [...heroHand] as [string, string] : null);
  const [currentEditingPlayer, setCurrentEditingPlayer] = useState<Position | 'HERO' | null>(null);
  const [editingCardIndex, setEditingCardIndex] = useState<0 | 1>(0);

  // Hero folded case - check if hero position exists in active players
  // Since activePlayers now excludes hero, we check if list is empty or hero is missing
  const heroFolded = useMemo(() => {
    // If no active players passed, hero must have folded
    return activePlayers.length === 0;
  }, [activePlayers]);

  // activePlayers already has hero filtered out, so we can use it directly
  const opponentsOnly = activePlayers;

  // Initialize player hands state (only for opponents)
  useEffect(() => {
    setPlayerHands(prev => {
      const initialHands: Partial<Record<Position, PlayerHandState>> = {};
      let hasNewPlayers = false;
      
      opponentsOnly.forEach(player => {
        if (!prev[player.position]) {
          initialHands[player.position] = {
            position: player.position,
            hand: null,
            mucked: false,
            isWinner: false,
          };
          hasNewPlayers = true;
        }
      });
      
      let updated = prev;
      if (hasNewPlayers) {
        updated = { ...prev, ...initialHands };
      }
      
      // ヘッズアップ時（opponentsOnly.length === 1）の場合、不要なプレーヤーを削除
      if (opponentsOnly.length === 1) {
        const opponentPosition = opponentsOnly[0].position;
        const filtered: Partial<Record<Position, PlayerHandState>> = {};
        if (updated[opponentPosition]) {
          filtered[opponentPosition] = updated[opponentPosition];
        }
        return filtered;
      }
      
      return updated;
    });
  }, [opponentsOnly]);

  // Get excluded cards (board + hero hand + already selected hands)
  const getExcludedCards = (): string[] => {
    const excluded = [...boardCards];
    const currentHeroHand = heroHandLocal || heroHand;
    if (currentHeroHand) excluded.push(...currentHeroHand);
    
    // 全てのプレイヤーの手を除外
    Object.values(playerHands).forEach(p => {
      if (p.hand && p.hand[0] !== '' && p.hand[1] !== '') {
        excluded.push(...p.hand);
      }
    });
    
    // 編集中のプレイヤーの既に選択されたカードも除外
    if (currentEditingPlayer && currentEditingPlayer !== 'HERO') {
      const editingHand = playerHands[currentEditingPlayer]?.hand;
      if (editingHand) {
        editingHand.forEach(card => {
          if (card && card !== '' && !excluded.includes(card)) {
            excluded.push(card);
          }
        });
      }
    }
    
    return excluded;
  };

  // Get suit color for card display
  const getSuitColor = (card: string): string => {
    if (card.includes('♦')) return 'text-blue-500';
    if (card.includes('♣')) return 'text-green-500';
    if (card.includes('♠')) return 'text-gray-200';
    if (card.includes('♥')) return 'text-red-500';
    return 'text-white';
  };

  // Handle winner selection
  const handleWinnerSelect = (won: boolean, winner?: Position) => {
    setHeroWon(won);
    
    if (won) {
      // Hero won - set hero as winner and go to hands step
      setWinnerPosition(heroPosition || null);
      // Update player hands with winner info
      setPlayerHands(prev => {
        const updated = { ...prev };
        Object.entries(updated).forEach(([pos, playerState]) => {
          if (playerState) {
            playerState.isWinner = false; // All opponents lost
          }
        });
        return updated;
      });
    } else {
      // Hero lost - need to select winner
      if (winner) {
        setWinnerPosition(winner);
        // Update player hands with winner info
        setPlayerHands(prev => {
          const updated = { ...prev };
          Object.entries(updated).forEach(([pos, playerState]) => {
            if (playerState && pos === winner) {
              playerState.isWinner = true;
            } else if (playerState) {
              playerState.isWinner = false;
            }
          });
          return updated;
        });
      }
    }
    setStep('hands');
  };

  // Calculate hero's actual contribution from action history
  const calculateHeroContribution = (): number => {
    if (!heroPosition || actions.length === 0) {
      // Fallback to average if no actions
      return potSize / ((activePlayers.length || 0) + 1);
    }
    
    let contribution = 0;
    actions.forEach(action => {
      if (action.position === heroPosition && action.betSize) {
        contribution += action.betSize;
      }
    });
    
    // Add blinds if hero was SB or BB
    if (heroPosition === 'SB') contribution += 0.5;
    if (heroPosition === 'BB') contribution += 1.0;
    
    return contribution;
  };

  // Submit result

  // Handle card selection (limit to 2 cards per player or hero)
  const handleCardSelect = (card: string) => {
    // Check if editing hero hand
    if (currentEditingPlayer === 'HERO' && heroPosition) {
      if (!heroHandLocal || heroHandLocal[0] === '') {
        // First card
        setHeroHandLocal([card, ''] as [string, string]);
        setEditingCardIndex(1);
      } else if (editingCardIndex === 0) {
        // Editing first card
        setHeroHandLocal([card, heroHandLocal[1]] as [string, string]);
        if (heroHandLocal[1] !== '') {
          setCurrentEditingPlayer(null);
        } else {
          setEditingCardIndex(1);
        }
      } else if (editingCardIndex === 1 && heroHandLocal[0] !== '') {
        // Second card - complete the hand
        setHeroHandLocal([heroHandLocal[0], card] as [string, string]);
        // ヘッズアップ（相手1人）の場合は次のプレーヤーに移行しない
        if (opponentsOnly.length === 1) {
          setCurrentEditingPlayer(null);
        } else {
          // 次のプレーヤーがある場合は移行
          const playerPositions = Object.keys(playerHands) as Position[];
          if (playerPositions.length > 0) {
            setCurrentEditingPlayer(playerPositions[0]);
            setEditingCardIndex(0);
          } else {
            setCurrentEditingPlayer(null);
          }
        }
      }
      return;
    }

    if (!currentEditingPlayer || currentEditingPlayer === 'HERO') return;

    setPlayerHands(prev => {
      const updated = { ...prev };
      const position = currentEditingPlayer as Position;
      const playerState = updated[position] || {
        position,
        hand: null,
        mucked: false,
        isWinner: false,
      };
      updated[position] = playerState;
      
      if (!playerState.hand || playerState.hand[0] === '') {
        // First card
        playerState.hand = [card, ''] as [string, string];
        setEditingCardIndex(1);
      } else if (editingCardIndex === 0) {
        // Editing first card
        playerState.hand = [card, playerState.hand[1]] as [string, string];
        if (playerState.hand[1] !== '') {
          // Both cards filled
          // ヘッズアップ（相手1人）の場合は次のプレーヤーに移行しない
          if (opponentsOnly.length === 1) {
            setCurrentEditingPlayer(null);
          } else {
            // Move to next player or finish (opponentsOnlyのプレーヤーのみを対象)
            const opponentPositions = opponentsOnly.map(p => p.position);
            const position = currentEditingPlayer as Position;
            const currentIndex = opponentPositions.indexOf(position);
            if (currentIndex < opponentPositions.length - 1) {
              setCurrentEditingPlayer(opponentPositions[currentIndex + 1]);
              setEditingCardIndex(0);
            } else {
              setCurrentEditingPlayer(null);
            }
          }
        } else {
          setEditingCardIndex(1);
        }
      } else if (editingCardIndex === 1 && playerState.hand[0] !== '') {
        // Second card - complete the hand
        playerState.hand = [playerState.hand[0], card] as [string, string];
        // ヘッズアップ（相手1人）の場合は次のプレーヤーに移行しない
        // または、opponentsOnlyに含まれるプレーヤーのみを考慮する
        if (opponentsOnly.length === 1) {
          setCurrentEditingPlayer(null);
        } else {
          // Move to next player or finish (opponentsOnlyのプレーヤーのみを対象)
          const opponentPositions = opponentsOnly.map(p => p.position);
          const position = currentEditingPlayer as Position;
          const currentIndex = opponentPositions.indexOf(position);
          if (currentIndex < opponentPositions.length - 1) {
            setCurrentEditingPlayer(opponentPositions[currentIndex + 1]);
            setEditingCardIndex(0);
          } else {
            setCurrentEditingPlayer(null);
          }
        }
      }
      
      return updated;
    });
  };

  // Toggle muck for a player
  const handleToggleMuck = (position: Position) => {
    setPlayerHands(prev => {
      const currentState = prev[position] || {
        position,
        hand: null,
        mucked: false,
        isWinner: false,
      };
      return {
        ...prev,
        [position]: {
          ...currentState,
          mucked: !currentState.mucked,
          hand: !currentState.mucked ? null : currentState.hand,
        },
      };
    });
  };

  // Start editing a player's hand
  const handleStartEditPlayer = (position: Position) => {
    setCurrentEditingPlayer(position);
    setEditingCardIndex(0);
  };

  // Start editing hero hand
  const handleStartEditHero = () => {
    setCurrentEditingPlayer('HERO' as Position);
    const currentHand = heroHandLocal || heroHand;
    if (currentHand && currentHand[0] !== '' && currentHand[1] !== '') {
      setEditingCardIndex(0); // Start from first card
    } else {
      setEditingCardIndex(0);
    }
  };

  // Check if all hands are complete (either filled or mucked)
  const allHandsComplete = useMemo(() => {
    // ヒーローのハンドが完成しているかチェック（フォールドしていない場合）
    let heroHandComplete = false;
    if (heroFolded) {
      heroHandComplete = true;
    } else {
      // heroHandLocalを優先的に使用、なければheroHandを使用
      const currentHeroHand = heroHandLocal || heroHand;
      if (currentHeroHand && Array.isArray(currentHeroHand) && currentHeroHand.length === 2) {
        const card1 = currentHeroHand[0];
        const card2 = currentHeroHand[1];
        // 両方のカードが存在し、空文字列でないことを確認
        heroHandComplete = !!(card1 && card2 && String(card1).trim() !== '' && String(card2).trim() !== '');
      }
    }
    
    // 相手プレーヤーのハンドが全て完成しているかチェック（マックされたか、ハンドが入力されている）
    let opponentHandsComplete = true;
    if (opponentsOnly.length > 0) {
      opponentHandsComplete = opponentsOnly.every(player => {
        const playerState = playerHands[player.position];
        if (!playerState) {
          return false; // playerStateが存在しない場合は未完成
        }
        if (playerState.mucked) {
          return true; // マックされた場合は完成
        }
        // ハンドが入力されている場合
        const hand = playerState.hand;
        if (hand && Array.isArray(hand) && hand.length === 2) {
          const card1 = hand[0];
          const card2 = hand[1];
          return !!(card1 && card2 && String(card1).trim() !== '' && String(card2).trim() !== '');
        }
        return false;
      });
    }
    
    const result = heroHandComplete && opponentHandsComplete;
    return result;
  }, [playerHands, heroHandLocal, heroHand, heroFolded, opponentsOnly]);

  // Submit result
  const handleSubmit = () => {
    // Winner must be selected (either hero won or opponent won)
    if (!heroFolded && heroWon === null) return;
    if (!heroFolded && !heroWon && winnerPosition === null) return;

    // Don't add hero if hero is already in opponentsOnly (shouldn't happen but defensive)
    const showdownHands: PlayerHandInfo[] = [];
    
    // Add opponent hands (from activePlayers - who reached showdown)
    Object.values(playerHands).forEach(p => {
      showdownHands.push({
        position: p.position,
        hand: p.hand && p.hand[0] !== '' && p.hand[1] !== '' ? p.hand : undefined,
        mucked: p.mucked,
        isWinner: p.isWinner,
      });
    });

    // Add hero's hand if hero didn't fold
    const finalHeroHand = heroHandLocal || heroHand;
    if (heroPosition && finalHeroHand && !heroFolded) {
      showdownHands.push({
        position: heroPosition,
        hand: finalHeroHand,
        mucked: false,
        isWinner: heroWon || false,
      });
    }

    // Add folded players (who didn't reach showdown) separately
    const foldedPlayers = allPlayers.filter(p => 
      p.folded && !p.isHero && !activePlayers.some(ap => ap.position === p.position)
    );
    
    foldedPlayers.forEach(p => {
      showdownHands.push({
        position: p.position,
        hand: undefined,
        mucked: false, // Not mucked, folded earlier
        isWinner: false,
      });
    });

    // Calculate pot awarded using actual contribution
    const heroContribution = calculateHeroContribution();
    const potAwarded = heroWon ? (potSize - heroContribution) : -heroContribution;

    // Determine the actual winner
    const actualWinner = heroWon ? heroPosition! : winnerPosition!;

    const result: HandResult = {
      completionType,
      winner: actualWinner,
      heroWon: heroWon || false,
      potAwarded,
      showdownHands,
      timestamp: Date.now(),
    };

    onSubmit(result);
    handleClose();
  };

  // Reset and close
  const handleClose = () => {
    setStep('winner');
    setHeroWon(null);
    setWinnerPosition(null);
    setPlayerHands({});
    setHeroHandLocal(heroHand ? [...heroHand] as [string, string] : null);
    setCurrentEditingPlayer(null);
    setEditingCardIndex(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">
            {step === 'winner' ? 'Hand Result' : 'Player Hands'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {step === 'winner' && !heroFolded && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <p className="text-gray-400 mb-2">Did you win this hand?</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      handleWinnerSelect(true, heroPosition || undefined);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-base transition-all hover:scale-105"
                  >
                    <Trophy className="w-5 h-5" />
                    Won
                  </button>
                  <button
                    onClick={() => {
                      // Need to select winner from opponents
                      const opponents = opponentsOnly;
                      if (opponents.length === 1) {
                        handleWinnerSelect(false, opponents[0].position);
                      } else {
                        setHeroWon(false);
                        setStep('hands');
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-base transition-all hover:scale-105"
                  >
                    <XCircle className="w-5 h-5" />
                    Lost
                  </button>
                </div>
              </div>
            </div>
          )}

          {(step === 'hands' || heroFolded) && (
            <div className="space-y-3">
              {/* Winner selection if hero lost and multiple opponents */}
              {heroWon === false && !winnerPosition && opponentsOnly.length > 1 && (
                <div className="mb-2 p-2 bg-gray-800 rounded-lg">
                  <p className="text-gray-400 mb-2 text-sm">Who won the pot?</p>
                  <div className="flex flex-wrap gap-2">
                    {opponentsOnly.map(player => (
                      <button
                        key={player.position}
                        onClick={() => {
                          setWinnerPosition(player.position);
                          setPlayerHands(prev => {
                            const updated = { ...prev };
                            Object.entries(updated).forEach(([pos, playerState]) => {
                              if (playerState && pos === player.position) {
                                playerState.isWinner = true;
                              } else if (playerState) {
                                playerState.isWinner = false;
                              }
                            });
                            return updated;
                          });
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          winnerPosition === player.position
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {player.position}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hero hand input (if hero won and hand not already set, or always show if set) */}
              {!heroFolded && heroWon === true && (
                <div className="mb-2 p-2 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">
                        {heroPosition} (You)
                      </span>
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    <button
                      onClick={handleStartEditHero}
                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-all"
                    >
                      {heroHandLocal && heroHandLocal[0] !== '' && heroHandLocal[1] !== '' ? 'Edit Hand' : 'Add Hand'}
                    </button>
                  </div>
                  
                  <div className="flex gap-1.5 mt-1.5">
                    {[0, 1].map((idx) => {
                      const card = (heroHandLocal || heroHand)?.[idx] || '';
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-14 bg-gray-900 border border-gray-700 rounded flex items-center justify-center text-xs font-bold ${card ? getSuitColor(card) : ''}`}
                        >
                          {card || '?'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Player hand inputs */}
              <div className="space-y-2">
                <p className="text-gray-400 text-xs">
                  {heroFolded 
                    ? 'Optionally enter opponent hands (if shown):'
                    : heroWon === true
                      ? 'Optionally enter opponent hands (if shown):'
                      : 'Enter winner\'s hand (optional for others):'}
                </p>
                
                {opponentsOnly.filter(player => player.position !== heroPosition).map(player => {
                  const playerState = playerHands[player.position];
                  if (!playerState) return null;
                  
                  return (
                    <div key={player.position} className="p-2 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{player.position}</span>
                          {playerState.isWinner && (
                            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleToggleMuck(player.position)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                              playerState.mucked
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {playerState.mucked ? 'Mucked' : 'Mark Muck'}
                          </button>
                          {!playerState.mucked && (
                            <button
                              onClick={() => handleStartEditPlayer(player.position)}
                              className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-all"
                            >
                              {playerState.hand && playerState.hand[0] !== '' ? 'Edit Hand' : 'Add Hand'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {!playerState.mucked && (
                        <div className="flex gap-1.5 mt-1.5">
                          {[0, 1].map((idx) => {
                            const card = playerState.hand?.[idx] || '';
                            return (
                              <div
                                key={idx}
                                className={`w-10 h-14 bg-gray-900 border border-gray-700 rounded flex items-center justify-center text-xs font-bold ${card ? getSuitColor(card) : ''}`}
                              >
                                {card || '?'}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Card picker for current editing player or hero */}
              {currentEditingPlayer && (
                <div className="mt-3 p-2 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">
                    Select {editingCardIndex === 0 ? 'first' : 'second'} card for{' '}
                    <span className="font-bold text-white">
                      {currentEditingPlayer === 'HERO' ? `${heroPosition} (You)` : currentEditingPlayer}
                    </span>:
                  </p>
                  <div className="max-h-[200px] overflow-y-auto">
                    <SimpleCardPicker
                      onCardSelect={handleCardSelect}
                      excludedCards={getExcludedCards()}
                      selectedCards={
                        currentEditingPlayer === 'HERO'
                          ? (heroHandLocal || heroHand)
                            ? [(heroHandLocal || heroHand)![editingCardIndex === 0 ? 1 : 0]]
                            : []
                          : playerHands[currentEditingPlayer]?.hand
                            ? [playerHands[currentEditingPlayer].hand![editingCardIndex === 0 ? 1 : 0]]
                            : []
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-800 flex justify-between">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {step === 'hands' && !heroFolded && (
              <button
                onClick={() => setStep('winner')}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-all"
              >
                Back
              </button>
            )}
            {(step === 'hands' || heroFolded) && (winnerPosition || heroFolded) && (
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold transition-all"
              >
                {allHandsComplete ? 'Finish' : 'Skip & Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
