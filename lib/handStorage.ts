import type { SavedHand, HandAction, BoardState, Position, OpponentType } from '@/types/poker';

const STORAGE_KEY = 'poker_hand_history';

// UUID生成ヘルパー（PokerHandEngine.tsと同じ実装）
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return c === 'x' ? r.toString(16) : v.toString(16);
  });
}

/**
 * HandAction[]を文字列配列に変換
 * 形式: "[Preflop] UTG Raise 3bb", "[Flop] BTN Call", "[Turn] BB Check"
 */
function formatActions(actions: HandAction[]): string[] {
  return actions.map(action => {
    const position = action.position;
    const actionType = action.action;
    const phase = action.phase || 'Preflop'; // フェーズ情報を追加
    
    let actionStr = `[${phase}] ${position} ${actionType}`;
    
    if (action.betSize !== undefined) {
      // betSizeがある場合: "[Preflop] UTG Raise 3bb"
      actionStr += ` ${action.betSize.toFixed(1)}bb`;
    }
    
    return actionStr;
  });
}

/**
 * BoardStateをstring[]に変換
 * 形式: ['As', 'Kd', '2h', '3c', '4s']
 */
function formatBoard(board: BoardState): string[] {
  const cards: string[] = [];
  
  if (board.flop) {
    cards.push(...board.flop);
  }
  
  if (board.turn) {
    cards.push(board.turn);
  }
  
  if (board.river) {
    cards.push(board.river);
  }
  
  return cards;
}

/**
 * 1ハンドを保存
 */
export function saveHand(
  heroPosition: Position | null,
  villainType: OpponentType,
  board: BoardState,
  actions: HandAction[],
  finalPot: number,
  heroHand?: [string, string] // ヒーローのハンド（オプション）
): void {
  // サーバーサイドでは何もしない
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // 既存のハンドを取得
    const existingHands = getAllHands();
    
    // 新しいハンドを作成
    const newHand: SavedHand = {
      id: generateUUID(),
      timestamp: Date.now(),
      heroPosition,
      heroHand,
      villainType,
      board: formatBoard(board),
      actions: formatActions(actions),
      finalPot,
    };
    
    // 新しいハンドを配列の先頭に追加（新しい順）
    const updatedHands = [newHand, ...existingHands];
    
    // localStorageに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHands));
  } catch (error) {
    // localStorageの容量制限やエラーをキャッチ
    console.error('Failed to save hand to localStorage:', error);
    // エラーが発生してもアプリは継続動作させる
  }
}

/**
 * 全ハンドを取得（新しい順）
 */
export function getAllHands(): SavedHand[] {
  // サーバーサイドでは空配列を返す
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const hands = JSON.parse(stored) as SavedHand[];
    
    // 念のため、タイムスタンプでソート（新しい順）
    return hands.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to load hands from localStorage:', error);
    return [];
  }
}

/**
 * ハンドを削除
 */
export function deleteHand(id: string): void {
  // サーバーサイドでは何もしない
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const hands = getAllHands();
    const filtered = hands.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete hand from localStorage:', error);
  }
}

/**
 * 全ハンドを削除（オプション機能）
 */
export function clearAllHands(): void {
  // サーバーサイドでは何もしない
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear hands from localStorage:', error);
  }
}