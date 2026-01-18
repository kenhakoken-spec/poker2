// 手動テスト用スクリプト
import { PokerHandEngine } from './lib/PokerHandEngine';

console.log('🧪 手動テスト開始\n');

// テスト1: フロップでチェック＆チェック
console.log('📋 テスト1: フロップでチェック＆チェック');
const engine1 = new PokerHandEngine('BTN', 100);

// プリフロップ
console.log('  BTNがレイズ');
engine1.addPreflopAction('BTN', 'Raise', 3);

let state1 = engine1.getState();
console.log(`  BTNレイズ後: 現在のアクター = ${state1.currentActor}, フェーズ = ${state1.phase}, ボード待ち = ${state1.waitingForBoard}`);

console.log('  BBがコール');
engine1.addPreflopAction('BB', 'Call');

state1 = engine1.getState();
console.log(`  BBコール後: 現在のアクター = ${state1.currentActor}, フェーズ = ${state1.phase}, ボード待ち = ${state1.waitingForBoard}`);
console.log(`  プレイヤー状態: BTN acted=${state1.players.find(p => p.position === 'BTN')?.hasActedThisStreet}, BB acted=${state1.players.find(p => p.position === 'BB')?.hasActedThisStreet}`);

// ボード待ちの場合、confirmBoardを呼ぶ
if (state1.waitingForBoard) {
  engine1.confirmBoard();
  state1 = engine1.getState();
  console.log(`  フロップ開始: 現在のアクター = ${state1.currentActor}, フェーズ = ${state1.phase}`);
} else {
  console.log(`  ❌ エラー: プリフロップ完了後もボード待ちになっていない`);
  state1 = engine1.getState();
  console.log(`  現在の状態: 現在のアクター = ${state1.currentActor}, フェーズ = ${state1.phase}`);
  process.exit(1);
}

// BBチェック
engine1.addPostflopAction('BB', 'Check');
state1 = engine1.getState();
console.log(`  BBチェック後: 現在のアクター = ${state1.currentActor}, ハンド完了 = ${state1.isComplete}, ボード待ち = ${state1.waitingForBoard}`);

// BTNチェック
engine1.addPostflopAction('BTN', 'Check');
state1 = engine1.getState();
console.log(`  BTNチェック後: 現在のアクター = ${state1.currentActor}, フェーズ = ${state1.phase}, ハンド完了 = ${state1.isComplete}, ボード待ち = ${state1.waitingForBoard}`);
console.log(`  ✅ ${state1.waitingForBoard && state1.phase === 'Turn' && !state1.isComplete ? '成功: ターン待ち状態' : '❌ 失敗'}\n`);

// テスト2: チェック可能な場合にフォールドできないことを確認
console.log('📋 テスト2: チェック可能な場合にフォールドできない');
const engine2 = new PokerHandEngine('BTN', 100);

engine2.addPreflopAction('BTN', 'Raise', 3);
engine2.addPreflopAction('BB', 'Call');
engine2.confirmBoard();

const actions = engine2.getAvailableActions('BB');
console.log(`  BBの利用可能なアクション: ${actions.join(', ')}`);
console.log(`  ✅ ${!actions.includes('Fold') && actions.includes('Check') ? '成功: フォールドが利用不可、チェックが利用可能' : '❌ 失敗'}\n`);

// テスト3: ベットに直面した場合はフォールド可能
console.log('📋 テスト3: ベットに直面した場合はフォールド可能');
const engine3 = new PokerHandEngine('BTN', 100);

engine3.addPreflopAction('BTN', 'Raise', 3);
engine3.addPreflopAction('BB', 'Call');
engine3.confirmBoard();

// BBがベット
engine3.addPostflopAction('BB', 'Bet', 3);
const actions3 = engine3.getAvailableActions('BTN');
console.log(`  BTNの利用可能なアクション: ${actions3.join(', ')}`);
console.log(`  ✅ ${actions3.includes('Fold') && !actions3.includes('Check') ? '成功: フォールドが利用可能、チェックが利用不可' : '❌ 失敗'}\n`);

// テスト4: 完全なハンド（リバーまで）
console.log('📋 テスト4: 完全なハンド（リバーまで）');
const engine4 = new PokerHandEngine('BTN', 100);

engine4.addPreflopAction('BTN', 'Raise', 3);
engine4.addPreflopAction('BB', 'Call');
engine4.confirmBoard();

// フロップ: チェックチェック
engine4.addPostflopAction('BB', 'Check');
engine4.addPostflopAction('BTN', 'Check');
engine4.confirmBoard();

let state4 = engine4.getState();
console.log(`  ターン: フェーズ = ${state4.phase}, アクター = ${state4.currentActor}`);

// ターン: チェックチェック
engine4.addPostflopAction('BB', 'Check');
engine4.addPostflopAction('BTN', 'Check');
engine4.confirmBoard();

state4 = engine4.getState();
console.log(`  リバー: フェーズ = ${state4.phase}, アクター = ${state4.currentActor}`);

// リバー: チェックチェック
engine4.addPostflopAction('BB', 'Check');
engine4.addPostflopAction('BTN', 'Check');

state4 = engine4.getState();
console.log(`  リバー後: フェーズ = ${state4.phase}, ハンド完了 = ${state4.isComplete}`);
console.log(`  ✅ ${state4.isComplete && state4.currentActor === null ? '成功: ハンド完了' : '❌ 失敗'}\n`);

console.log('✅ すべてのテスト完了');
