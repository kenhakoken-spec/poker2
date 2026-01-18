export type Position = 'SB' | 'BB' | 'UTG' | 'HJ' | 'CO' | 'BTN';

export type ActionType = 'Fold' | 'Check' | 'Call' | 'Bet' | 'Raise';

export type OpponentType = 'Reg' | 'Fish' | 'Nit';

export type BetSizePercentage = '25%' | '33%' | '50%' | '75%' | '100%' | 'All-in';

export type Phase = 'Preflop' | 'Flop' | 'Turn' | 'River';

export type CompletionType = 'showdown' | 'fold' | 'allin';

export interface PlayerHandInfo {
  position: Position;
  hand?: [string, string]; // カードが見えている場合のみ
  mucked: boolean; // マックした場合true
  isWinner: boolean; // 勝者の場合true
}

export interface HandResult {
  completionType: CompletionType;
  winner: Position; // 勝者のポジション（複数勝者の場合は主勝者）
  heroWon: boolean; // ヒーローが勝ったか
  potAwarded: number; // 獲得/損失したBB額（ヒーロー基準）
  showdownHands: PlayerHandInfo[]; // ショーダウンに参加したプレイヤーのハンド情報
  timestamp: number;
}

export interface HandAction {
  id: string;
  position: Position;
  action: ActionType;
  betSize?: number; // BB単位
  potSize: number; // BB単位（アクション後のポットサイズ）
  timestamp: number;
  phase: Phase; // 追加: フェーズ情報
  opponentType?: OpponentType;
}

export interface BoardState {
  flop?: [string, string, string];
  turn?: string;
  river?: string;
}

export interface PokerHand {
  id: string;
  heroPosition: Position | null; // 追加: 自分の位置
  heroHand?: [string, string]; // 追加: 自分のハンド
  stackSize: number; // BB単位（デフォルト100）
  actions: HandAction[];
  board: BoardState;
  potSize: number; // BB単位
  currentPhase: Phase; // 追加: 現在のフェーズ
  currentOpponentType: OpponentType;
  result?: HandResult; // ハンド結果（完了後のみ）
  isComplete: boolean; // ハンド完了フラグ
}

export type PokerHandAction =
  | { type: 'SET_STACK_SIZE'; payload: number }
  | { type: 'SET_HERO_POSITION'; payload: Position }
  | { type: 'SET_HERO_HAND'; payload: [string, string] }
  | { type: 'ADD_ACTION'; payload: HandAction }
  | { type: 'SET_OPPONENT_TYPE'; payload: OpponentType }
  | { type: 'SET_BOARD'; payload: BoardState }
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'RESET_HAND' };

export interface SavedHand {
  id: string;          // UUID
  timestamp: number;   // 保存日時
  heroPosition: Position | null;
  heroHand?: [string, string]; // ヒーローのハンド（オプション、後方互換性のため）
  villainType: OpponentType;  // 'Reg' | 'Fish' | 'Nit'
  board: string[];      // ['As', 'Kd', '2h', ...]
  actions: string[];    // ['[Preflop] UTG Raise 3bb', '[Flop] BTN Call', ...]
  finalPot: number;     // 最終ポット額（BB単位）
}