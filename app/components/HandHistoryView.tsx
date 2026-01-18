'use client';

import { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp, Calendar, User, DollarSign, List, Copy, Sparkles } from 'lucide-react';
import { getAllHands, deleteHand } from '@/lib/handStorage';
import type { SavedHand } from '@/types/poker';

// カードのスートに応じた色を返す
function getSuitColor(card: string): string {
  if (card.includes('♦')) return 'text-blue-500'; // ダイヤは青
  if (card.includes('♣')) return 'text-green-500'; // クラブは緑
  if (card.includes('♠')) return 'text-gray-200'; // スペードは明るいグレー
  if (card.includes('♥')) return 'text-red-500'; // ハートは赤
  return 'text-white';
}

// 日時をフォーマット
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }
}

// 詳細な日時をフォーマット
function formatFullTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface HandHistoryViewProps {
  onClose?: () => void;
}

export function HandHistoryView({ onClose }: HandHistoryViewProps) {
  const [hands, setHands] = useState<SavedHand[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<Record<string, 'idle' | 'copied'>>({});

  // ハンドを読み込む
  const loadHands = () => {
    try {
      const loadedHands = getAllHands();
      setHands(loadedHands);
    } catch (error) {
      console.error('Failed to load hands:', error);
      setHands([]);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadHands();
  }, []);

  // ハンドを削除
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this hand?')) {
      setDeletingId(id);
      deleteHand(id);
      // 少し遅延を入れてUIを更新
      setTimeout(() => {
        loadHands();
        setDeletingId(null);
        if (expandedId === id) {
          setExpandedId(null);
        }
      }, 100);
    }
  };

  // 展開/折りたたみを切り替え
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isExpanded = (id: string) => expandedId === id;

  // Copy and Gemini functionality
  const handleCopyAndGemini = async (hand: SavedHand) => {
    // Convert board array to BoardState format
    const boardState = {
      flop: hand.board.length >= 3 ? [hand.board[0], hand.board[1], hand.board[2]] as [string, string, string] : undefined,
      turn: hand.board.length >= 4 ? hand.board[3] : undefined,
      river: hand.board.length >= 5 ? hand.board[4] : undefined,
    };

    // Determine current phase from board
    const currentPhase = boardState.river ? 'River' : boardState.turn ? 'Turn' : boardState.flop ? 'Flop' : 'Preflop';

    // Format board
    const formatBoard = (): string => {
      return hand.board.length > 0 ? hand.board.join(' ') : 'No board';
    };

    // Generate analysis prompt
    let promptText = `テキサスホールデムポーカーにおける以下の自分の動きをGTOやエクスプロイト戦略に則ってフラットにレビューして

【セッション情報】
ヒーローポジション: ${hand.heroPosition || 'Unknown'}
ヒーローハンド: ${hand.heroHand ? `${hand.heroHand[0]}${hand.heroHand[1]}` : 'Unknown'}
初期スタック: 100bb
現在のスタック: Unknown

【ボード情報】
現在のフェーズ: ${currentPhase}
ボード: ${formatBoard()}

【アクション詳細】
${hand.actions.map((action, idx) => `${idx + 1}. ${action}`).join('\n')}

【ポット情報】
最終ポット: ${hand.finalPot}bb

【サマリー】
総アクション数: ${hand.actions.length}
オポーネントタイプ: ${hand.villainType}`;
    
    try {
      await navigator.clipboard.writeText(promptText);
      setCopyStatus(prev => ({ ...prev, [hand.id]: 'copied' }));
      setTimeout(() => {
        setCopyStatus(prev => {
          const updated = { ...prev };
          delete updated[hand.id];
          return updated;
        });
      }, 2000);
      
      // Geminiを新しいタブで開く
      window.open('https://gemini.google.com/app', '_blank');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (hands.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Hands Saved Yet</h3>
            <p className="text-gray-500 text-sm">
              Complete a hand to see it here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/50 backdrop-blur-sm bg-gray-950/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Hand History</h2>
            <span className="text-sm text-gray-400">({hands.length})</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Hand List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {hands.map((hand) => {
          const expanded = isExpanded(hand.id);
          const deleting = deletingId === hand.id;

          return (
            <div
              key={hand.id}
              className={`bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden transition-all ${
                deleting ? 'opacity-50' : 'hover:bg-gray-900/70'
              }`}
            >
              {/* List Item (Summary) */}
              <div
                className="p-3 cursor-pointer"
                onClick={() => toggleExpand(hand.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatTimestamp(hand.timestamp)}</span>
                      </div>

                      {/* Position */}
                      {hand.heroPosition && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <User className="w-3.5 h-3.5" />
                          <span className="font-semibold text-gray-300">{hand.heroPosition}</span>
                        </div>
                      )}

                      {/* Villain Type */}
                      <div className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] font-medium text-gray-400">
                        {hand.villainType}
                      </div>
                    </div>

                    {/* Pot & Actions Summary */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-green-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-semibold">{hand.finalPot.toFixed(1)}bb</span>
                      </div>
                      <div className="text-gray-500">
                        {hand.actions.length} {hand.actions.length === 1 ? 'action' : 'actions'}
                      </div>
                      {hand.board.length > 0 && (
                        <div className="flex gap-1">
                          {hand.board.slice(0, 3).map((card, idx) => (
                            <span key={idx} className={`text-xs ${getSuitColor(card)}`}>
                              {card}
                            </span>
                          ))}
                          {hand.board.length > 3 && (
                            <span className="text-xs text-gray-500">+{hand.board.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Expand/Delete Controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(hand.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete hand"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title={expanded ? 'Collapse' : 'Expand'}
                    >
                      {expanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expanded && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-800 space-y-3">
                  {/* Full Timestamp */}
                  <div className="pt-3 text-xs text-gray-400">
                    {formatFullTimestamp(hand.timestamp)}
                  </div>

                  {/* Board Cards */}
                  {hand.board.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 mb-2">Board</h4>
                      <div className="flex gap-1.5">
                        {hand.board.map((card, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-14 bg-white border-2 border-gray-600 rounded flex items-center justify-center font-bold text-sm"
                          >
                            <span className={getSuitColor(card)}>{card}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-400">Actions</h4>
                      {hand.actions.length > 0 && (
                        <button
                          onClick={() => handleCopyAndGemini(hand)}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-[10px] font-semibold transition-colors"
                          title="Copy to clipboard and open Gemini"
                        >
                          {copyStatus[hand.id] === 'copied' ? (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Copy & Gemini</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="bg-gray-950/50 rounded p-2 space-y-1">
                      {hand.actions.length > 0 ? (
                        hand.actions.map((action, idx) => (
                          <div key={idx} className="text-xs font-mono text-gray-300">
                            {idx + 1}. {action}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 italic">No actions recorded</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}