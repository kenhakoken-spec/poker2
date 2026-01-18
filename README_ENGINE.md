# Poker Hand Tracker with Logic Engine (6-max)

ポーカーハンド記録アプリ - 爆速入力システム搭載

## 🎯 主要機能

### 1. 爆速入力システム（プリフロップ）

**問題:** 従来、各プレイヤーのフォールドを1つずつ入力する必要があり、非常に時間がかかる。

**解決策:** アクションを起こしたプレイヤーを直接選択すると、それより前のプレイヤーは自動的にFold扱いとなる。

**例:**
```
シナリオ: UTGから開始して、BTNがRaiseした場合

操作: BTN → Raise 3bb

結果:
✓ UTG: Fold (自動)
✓ HJ: Fold (自動)  
✓ CO: Fold (自動)
✓ BTN: Raise 3bb
```

### 2. 厳密なポーカールール準拠

- **6-max固定** (SB, BB, UTG, HJ, CO, BTN)
- **プリフロップ:** UTGから開始
- **ポストフロップ:** SBから開始（生存者のみ）
- **自動ストリート遷移:** 全員のアクションが完了した時点で次のストリートへ
- **ポット計算:** 各アクションで正確に計算

### 3. UI/UX最適化

- **現在の手番を明示表示:** 誰の手番か常にハイライト
- **ヒーロー（自分）の強調:** 自分のポジションを特別な色で表示
- **プリセットベットサイズ:** 
  - プリフロップ: 2x, 3x
  - ポストフロップ: 33%, 50%, 75%, 100%, 150%, All-in
- **カスタムサイズ入力:** 任意のベットサイズを入力可能

## 📁 プロジェクト構造

```
poker1/
├── app/
│   ├── components/
│   │   ├── EnhancedActionPanel.tsx    # 新エンジン統合版アクションパネル
│   │   ├── EnhancedPokerTable.tsx     # 新エンジン統合版テーブル
│   │   ├── ActionPanel.tsx            # 旧版アクションパネル
│   │   ├── PokerTable.tsx             # 旧版テーブル
│   │   ├── ActionLog.tsx              # アクション履歴表示
│   │   ├── StackHeader.tsx            # スタック・ポジション表示
│   │   ├── BoardPicker.tsx            # ボード選択
│   │   ├── HandPicker.tsx             # ハンド選択
│   │   └── ...
│   ├── page.tsx                       # メインページ（新旧切替可能）
│   └── globals.css
├── lib/
│   ├── PokerHandEngine.ts             # ★ コアロジックエンジン
│   └── usePokerEngine.ts              # React統合フック
├── types/
│   └── poker.ts                       # 型定義
├── tests/
│   └── PokerHandEngine.test.ts        # エンジンのテストスイート
├── docs/
│   └── POKER_ENGINE_GUIDE.md          # 詳細ドキュメント
└── README.md
```

## 🚀 使い方

### 開発サーバーの起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く

### 基本的な操作フロー

1. **ヒーローポジションを選択**
   - アプリ起動時にポジション選択画面が表示される
   - 自分のポジション（SB～BTN）を選択

2. **プリフロップのアクション入力**
   - 「アクションするプレイヤーを選択」でポジションをタップ
   - 選択したポジションより前のプレイヤーは自動的にFold
   - Fold/Call/Raiseからアクションを選択
   - プリセットボタン（2x, 3x）またはカスタムサイズを入力

3. **ボードの入力**
   - 「Board」ボタンをタップ
   - Flopのカードを選択
   - 自動的にFlopストリートへ遷移

4. **ポストフロップのアクション入力**
   - 現在の手番のプレイヤーを選択（他は無効化）
   - Check/Fold/Call/Betからアクションを選択
   - プリセットボタン（33%, 50%, 75%, 100%, 150%, All-in）またはカスタムサイズ

5. **Turn/Riverの入力**
   - 同様にBoardボタンから追加カードを選択
   - 自動的に次のストリートへ遷移

6. **ハンド終了**
   - 全員のアクションが完了、または1人除いて全員Foldで終了
   - 「ハンドをリセット」ボタンで新しいハンドを開始

## 🧪 テスト

### ブラウザでのテスト実行

1. ブラウザのコンソールを開く
2. 以下を実行:

```javascript
import { runAllTests } from './tests/PokerHandEngine.test';
runAllTests();
```

### テストカバレッジ

- ✅ 初期化
- ✅ プリフロップのスキップ機能
- ✅ プリフロップの完全なフロー
- ✅ ポストフロップの基本フロー
- ✅ ポット計算
- ✅ エラーハンドリング
- ✅ スタック管理

## 📚 技術スタック

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks + Custom Engine
- **Architecture:** Clean Architecture with separation of concerns

## 🏗️ アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────┐
│  UI Components (React)          │
│  - EnhancedPokerTable           │
│  - EnhancedActionPanel          │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  React Integration Layer        │
│  - usePokerEngine               │
│  - usePokerEngineWithState      │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Core Logic Engine              │
│  - PokerHandEngine              │
│  - Pure TypeScript, No React    │
└─────────────────────────────────┘
```

### 設計原則

1. **関心の分離:** ロジックとUIを完全に分離
2. **テスタビリティ:** エンジンはReactに依存せず、純粋なTypeScript
3. **型安全性:** 全てのデータ構造に厳密な型定義
4. **拡張性:** 新機能（AI連携など）を追加しやすい設計

## 🎨 UI機能詳細

### 新版（エンジン搭載）の特徴

1. **手番の明示表示**
   - 現在の手番: 青色でハイライト + リング
   - ヒーロー: 黄色で表示
   - その他のアクティブプレイヤー: グレー

2. **プリフロップのスキップ機能**
   - 全てのアクティブポジションが選択可能
   - 選択したポジションより前は自動Fold

3. **ポストフロップの順番管理**
   - 現在の手番のプレイヤーのみ選択可能
   - 他のプレイヤーは無効化（グレーアウト）

4. **リアルタイムステータス表示**
   - 現在の手番
   - フェーズ（Preflop/Flop/Turn/River）
   - ポットサイズ

### 旧版との切替

アプリ右上の「新版/旧版切替」ボタンで、いつでも新旧バージョンを切り替え可能。

## 🔧 コアクラス: PokerHandEngine

### 初期化

```typescript
import { PokerHandEngine } from '@/lib/PokerHandEngine';

const engine = new PokerHandEngine('BTN', 100);
// 引数: (ヒーローポジション, スタックサイズ)
```

### 主要メソッド

```typescript
// プリフロップアクション（スキップ機能付き）
engine.addPreflopAction('BTN', 'Raise', 3);

// ポストフロップアクション
engine.addPostflopAction('SB', 'Check');

// 現在の手番を取得
const currentActor = engine.getCurrentActor(); // 'SB' | 'BB' | ...

// 現在の状態を取得
const state = engine.getState();
console.log(state.pot);          // ポット額
console.log(state.phase);        // 'Preflop' | 'Flop' | 'Turn' | 'River'
console.log(state.currentActor); // 現在の手番
console.log(state.actions);      // 全アクション履歴
```

### React統合

```typescript
import { usePokerEngineWithState } from '@/lib/usePokerEngine';

function MyComponent() {
  const {
    state,
    setHeroPosition,
    addAction,
    setBoard,
  } = usePokerEngineWithState();

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

## 📖 詳細ドキュメント

完全な仕様とAPIドキュメントは [docs/POKER_ENGINE_GUIDE.md](docs/POKER_ENGINE_GUIDE.md) を参照。

## 🔮 今後の予定

### Phase 2: AI連携

- Gemini APIとの統合
- アクション履歴をJSONで送信
- AIからの戦略アドバイス取得

### Phase 3: 統計機能

- ハンド履歴の保存
- 統計情報の表示（VPIP, PFR, 3-bet%など）
- グラフとチャート

### Phase 4: マルチプレイヤー

- リアルタイム同期
- 複数デバイスからの同時入力
- クラウドバックアップ

## 🐛 トラブルシューティング

### ポストフロップで手番が進まない

→ ストリート終了判定が正しく行われていない可能性があります。`forceAdvanceToNextStreet()` を呼び出すか、全員のアクションが完了しているか確認してください。

### プリフロップでスキップ機能が動かない

→ `addPreflopAction()` を使用していることを確認してください。`addPostflopAction()` はプリフロップで使用できません。

### ポット計算が合わない

→ エンジンのテストを実行して、ロジックエラーがないか確認してください。

## 📝 ライセンス

MIT License

## 👨‍💻 開発者

CEO指示に基づき、爆速入力システムを搭載した完璧なポーカーロジックエンジンを実装しました。

---

**Happy Poker Tracking! 🃏♠️♥️♦️♣️**
