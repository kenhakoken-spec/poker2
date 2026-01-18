# Poker Logic Engine Documentation (6-max)

## 概要

このドキュメントは、6-maxポーカーゲーム用のロジックエンジン `PokerHandEngine` の仕様と使用方法を説明します。

## 主要機能

### 1. プリフロップの爆速入力システム

#### 問題点
従来のポーカー入力システムでは、各プレイヤーのフォールドを1つずつ入力する必要があり、非常に時間がかかる。

#### 解決策：スキップ機能
**アクションを起こしたプレイヤー（Raise/Call）を直接選択すると、それより前のプレイヤーは自動的にFold扱いとなる。**

#### 例
```
シナリオ: UTGから開始して、BTNがRaiseした場合

入力: BTNを選択 → Raise 3bb

結果:
- UTG: Fold (自動)
- HJ: Fold (自動)
- CO: Fold (自動)
- BTN: Raise 3bb ← 実際に入力したアクション
```

### 2. 6-max固定設定

#### ポジション順序（時計回り）
```typescript
['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN']
```

#### 初期設定
- デフォルトスタック: 100BB
- アンティ: なし
- 初期ポット: 1.5BB (SB 0.5BB + BB 1.0BB)

### 3. プリフロップの進行

#### 開始位置
- **UTG**から開始（インデックス2）

#### 終了条件
以下のいずれかを満たした時点でFlopへ遷移：
1. BBのアクションが完了した
2. 全員が現在の最高ベット額にコールした
3. 最後にRaiseしたプレイヤーに手番が戻り、全員がコールまたはフォールドした

### 4. ポストフロップの進行（Flop/Turn/River）

#### 開始位置
- **SBから時計回り**に開始
- フォールド済みのプレイヤーは自動的にスキップ

#### 終了条件
以下のいずれかを満たした時点で次のストリートへ遷移：
1. 全員がCheck
2. 最後のBet/Raiseに対して全員がCallまたはFold
3. 1人を除いて全員がFold（ハンド終了）

## クラス: `PokerHandEngine`

### コンストラクタ

```typescript
constructor(heroPosition: Position | null, stackSize: number = 100)
```

#### パラメータ
- `heroPosition`: 自分のポジション（SB/BB/UTG/HJ/CO/BTN）
- `stackSize`: 初期スタックサイズ（BB単位、デフォルト100）

### 主要メソッド

#### 1. `addPreflopAction()`

```typescript
addPreflopAction(
  position: Position, 
  actionType: ActionType, 
  betSize?: number
): void
```

プリフロップのアクションを追加（スキップ機能付き）。

**パラメータ:**
- `position`: アクションするポジション
- `actionType`: 'Fold' | 'Call' | 'Raise'
- `betSize`: Raiseのサイズ（BB単位）

**動作:**
1. 現在の手番から `position` までの間のプレイヤーは全員自動Fold
2. `position` プレイヤーの実際のアクションを記録
3. 次の手番を自動決定

**例:**
```typescript
// UTGから開始、BTNが3BBレイズ
engine.addPreflopAction('BTN', 'Raise', 3);
// → UTG, HJ, CO が自動的にFold
```

#### 2. `addPostflopAction()`

```typescript
addPostflopAction(
  position: Position, 
  actionType: ActionType, 
  betSize?: number
): void
```

ポストフロップのアクションを追加。

**パラメータ:**
- `position`: アクションするポジション（現在の手番と一致する必要がある）
- `actionType`: 'Fold' | 'Check' | 'Call' | 'Bet' | 'Raise'
- `betSize`: Bet/Raiseのサイズ（BB単位）

**制約:**
- 現在の手番のプレイヤーのみがアクション可能
- 手番外のアクションはエラーとなる

#### 3. `getCurrentActor()`

```typescript
getCurrentActor(): Position | null
```

現在の手番のポジションを取得。

**戻り値:**
- 手番のポジション、またはハンド終了時は `null`

#### 4. `getState()`

```typescript
getState(): {
  players: PlayerState[];
  pot: number;
  phase: Phase;
  currentActor: Position | null;
  actions: HandAction[];
  isComplete: boolean;
}
```

現在のハンド状態を取得。

#### 5. `isHandComplete()`

```typescript
isHandComplete(): boolean
```

ハンドが終了したかを判定。

**戻り値:**
- `true`: ハンド終了（1人除いて全員Fold、またはRiver終了）
- `false`: ハンド継続中

#### 6. `forceAdvanceToNextStreet()`

```typescript
forceAdvanceToNextStreet(): void
```

手動で次のストリートへ進める（ボード入力後など）。

## React統合: `usePokerEngineWithState`

### 概要
エンジンをReactコンポーネントで簡単に使用できるカスタムフック。

### 使用例

```typescript
import { usePokerEngineWithState } from '@/lib/usePokerEngine';

function MyPokerComponent() {
  const {
    state,
    setHeroPosition,
    addAction,
    setBoard,
  } = usePokerEngineWithState();

  // ヒーロー位置を設定
  useEffect(() => {
    setHeroPosition('BTN');
  }, []);

  // アクションを追加
  const handleAction = () => {
    addAction('CO', 'Raise', 3);
  };

  return (
    <div>
      <p>現在の手番: {state.currentActor}</p>
      <p>ポット: {state.potSize}bb</p>
      <button onClick={handleAction}>CO Raise 3bb</button>
    </div>
  );
}
```

### 提供される機能

```typescript
interface ReturnValue {
  state: EnhancedPokerState;           // 現在の状態
  setHeroPosition: (pos: Position) => void;
  setHeroHand: (hand: [string, string]) => void;
  setBoard: (board: BoardState) => void;
  setCurrentOpponentType: (type: OpponentType) => void;
  setStackSize: (size: number) => void;
  addAction: (pos: Position, action: ActionType, size?: number) => void;
  reset: () => void;                   // ハンドをリセット
}
```

## UI実装例: `EnhancedActionPanel`

### 主要機能

1. **手番の明示表示**
   - 現在の手番プレイヤーをハイライト表示
   - ヒーロー（自分）の手番では特別な色で強調

2. **プリフロップのスキップ機能UI**
   - 利用可能なポジション全てを表示
   - 任意のポジションを選択可能
   - 選択したポジションより前のプレイヤーは自動Fold

3. **ポストフロップの順番管理**
   - 現在の手番のプレイヤーのみ選択可能
   - 他のプレイヤーは無効化表示

4. **プリセットベット/レイズ**
   - プリフロップ: 2x, 3x
   - ポストフロップ: 33%, 50%, 75%, 100%, 150%, All-in

## データ構造

### PlayerState

```typescript
interface PlayerState {
  position: Position;
  stack: number;              // 残りスタック（BB単位）
  contributed: number;        // 現在のストリートで投入した額
  totalContributed: number;   // ハンド全体で投入した額
  folded: boolean;
  isHero: boolean;
}
```

### StreetState

```typescript
interface StreetState {
  phase: Phase;                        // 'Preflop' | 'Flop' | 'Turn' | 'River'
  pot: number;                         // 現在のポット
  currentBet: number;                  // 現在のベット額
  lastAggressorIndex: number | null;   // 最後にBet/Raiseしたプレイヤー
  actionsThisStreet: HandAction[];     // このストリートのアクション
}
```

## アクション履歴のJSON形式

エンジンは全てのアクションをJSON形式で記録します。これにより、後でAI（Gemini等）が解析しやすくなります。

### 例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "position": "BTN",
  "action": "Raise",
  "betSize": 3,
  "potSize": 4.5,
  "timestamp": 1705555200000,
  "phase": "Preflop",
  "opponentType": "Reg"
}
```

## 実装のポイント

### 1. ポット計算
- 各アクションでプレイヤーの投入額をポットに加算
- ストリート終了時、全プレイヤーの `contributed` をリセット

### 2. 手番管理
- フォールド済みプレイヤーは自動的にスキップ
- `getNextActivePlayerIndex()` で次の有効なプレイヤーを取得

### 3. ストリート終了判定
- 全員のベット額が一致しているかチェック
- 最後のアグレッサーに手番が戻ったかチェック

### 4. エラーハンドリング
- 不正なアクション（例: ベットがある時のCheck）を検出
- 手番外のアクションを拒否

## テストシナリオ

### シナリオ1: プリフロップの基本フロー

```typescript
const engine = new PokerHandEngine('BTN', 100);

// BTNが最初にレイズ（UTG, HJ, CO は自動Fold）
engine.addPreflopAction('BTN', 'Raise', 3);

// SBがFold
engine.addPreflopAction('SB', 'Fold');

// BBがCall
engine.addPreflopAction('BB', 'Call');

// → Flopへ遷移
console.log(engine.getPhase()); // 'Flop' (ボード設定後)
```

### シナリオ2: ポストフロップ

```typescript
// Flop: BB Check
engine.addPostflopAction('BB', 'Check');

// BTN Bet 3bb
engine.addPostflopAction('BTN', 'Bet', 3);

// BB Call
engine.addPostflopAction('BB', 'Call');

// → Turnへ遷移
```

## まとめ

この爆速入力システムにより、ポーカーハンドの記録が劇的に高速化されます。特にプリフロップでの連続フォールドを省略できることで、ユーザー体験が大幅に向上します。
