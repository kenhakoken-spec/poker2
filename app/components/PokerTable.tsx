'use client';

import { useReducer } from 'react';
import type { PokerHand, PokerHandAction } from '@/types/poker';

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

// 初期ハンドを生成する関数
function createInitialHand(): PokerHand {
  return {
    id: generateUUID(),
    heroPosition: null,
    heroHand: undefined,
    stackSize: 100,
    actions: [],
    board: {},
    potSize: 1.5, // SB + BB
    currentPhase: 'Preflop',
    currentOpponentType: 'Reg',
  };
}

function pokerHandReducer(state: PokerHand, action: PokerHandAction): PokerHand {
  switch (action.type) {
    case 'SET_STACK_SIZE':
      return { ...state, stackSize: action.payload };
    case 'SET_HERO_POSITION':
      return { ...state, heroPosition: action.payload };
    case 'SET_HERO_HAND':
      return { ...state, heroHand: action.payload };
    case 'ADD_ACTION': {
      const newActions = [...state.actions, action.payload];
      // ポットサイズを再計算（簡易版）
      let newPotSize = state.potSize;
      if (action.payload.action === 'Bet' || action.payload.action === 'Raise') {
        newPotSize = action.payload.potSize;
      } else if (action.payload.action === 'Call') {
        newPotSize += 1; // 簡易計算
      }
      
      // フェーズの自動遷移
      let newPhase = state.currentPhase;
      const boardKeys = Object.keys(state.board).length;
      if (boardKeys === 0 && state.currentPhase === 'Preflop') {
        newPhase = 'Preflop';
      } else if (state.board.flop && !state.board.turn && state.currentPhase !== 'Flop') {
        newPhase = 'Flop';
      } else if (state.board.turn && !state.board.river && state.currentPhase !== 'Turn') {
        newPhase = 'Turn';
      } else if (state.board.river && state.currentPhase !== 'River') {
        newPhase = 'River';
      }
      
      return { ...state, actions: newActions, potSize: newPotSize, currentPhase: newPhase };
    }
    case 'SET_OPPONENT_TYPE':
      return { ...state, currentOpponentType: action.payload };
    case 'SET_BOARD': {
      // ボード変更時にフェーズを更新
      let newPhase = state.currentPhase;
      if (action.payload.flop && !action.payload.turn) {
        newPhase = 'Flop';
      } else if (action.payload.turn && !action.payload.river) {
        newPhase = 'Turn';
      } else if (action.payload.river) {
        newPhase = 'River';
      }
      return { ...state, board: action.payload, currentPhase: newPhase };
    }
    case 'SET_PHASE':
      return { ...state, currentPhase: action.payload };
    case 'RESET_HAND':
      return createInitialHand();
    default:
      return state;
  }
}

interface PokerTableProps {
  children: (hand: PokerHand, dispatch: React.Dispatch<PokerHandAction>) => React.ReactNode;
}

export function PokerTable({ children }: PokerTableProps) {
  const [hand, dispatch] = useReducer(pokerHandReducer, null, createInitialHand);

  return <>{children(hand, dispatch)}</>;
}

// JSONデータを取得するヘルパー関数（将来のGemini連携用）
export function getHandJSON(hand: PokerHand): string {
  return JSON.stringify(hand, null, 2);
}
