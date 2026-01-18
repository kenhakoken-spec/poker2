import { PokerHandEngine, POSITION_ORDER } from '../lib/PokerHandEngine';
import type { Position } from '../types/poker';

/**
 * PokerHandEngine のテストスイート
 * テキサスホールデムの全ルールに対応
 */

// ユーティリティ: テスト結果を表示
function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`  ${details}`);
}

// テスト1: 初期化
function testInitialization() {
  console.log('\n📋 Test: Initialization');
  const engine = new PokerHandEngine('BTN', 100);
  const state = engine.getState();
  
  const sbPlayer = state.players.find(p => p.position === 'SB');
  const bbPlayer = state.players.find(p => p.position === 'BB');
  
  const tests = [
    { name: 'Initial pot is 1.5bb', pass: state.pot === 1.5 },
    { name: 'Phase is Preflop', pass: state.phase === 'Preflop' },
    { name: 'Current actor is UTG', pass: state.currentActor === 'UTG' },
    { name: 'SB has 99.5bb after blind', pass: sbPlayer?.stack === 99.5 },
    { name: 'BB has 99bb after blind', pass: bbPlayer?.stack === 99 },
    { name: 'Not waiting for board initially', pass: state.waitingForBoard === false },
  ];
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト2: プリフロップのスキップ機能
function testPreflopSkip() {
  console.log('\n📋 Test: Preflop Skip Function');
  const engine = new PokerHandEngine('BTN', 100);
  
  // BTNが直接レイズ（UTG, HJ, COは自動Fold）
  engine.addPreflopAction('BTN', 'Raise', 3);
  
  const state = engine.getState();
  const actions = state.actions;
  
  const tests = [
    { name: 'UTG auto-folded', pass: actions.some(a => a.position === 'UTG' && a.action === 'Fold') },
    { name: 'HJ auto-folded', pass: actions.some(a => a.position === 'HJ' && a.action === 'Fold') },
    { name: 'CO auto-folded', pass: actions.some(a => a.position === 'CO' && a.action === 'Fold') },
    { name: 'BTN raised 3bb', pass: actions.some(a => a.position === 'BTN' && a.action === 'Raise') },
    { name: 'Current actor is SB', pass: state.currentActor === 'SB' },
    { name: 'Total 4 actions recorded', pass: actions.length === 4 },
  ];
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト3: プリフロップ完了後、ボード待ち状態になる
function testPreflopToFlopTransition() {
  console.log('\n📋 Test: Preflop to Flop Transition');
  const engine = new PokerHandEngine('BTN', 100);
  
  // BTNレイズ、BBコール
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('BB', 'Call');
  
  const state = engine.getState();
  
  const tests = [
    { name: 'Waiting for board after preflop', pass: state.waitingForBoard === true },
    { name: 'Phase is Flop', pass: state.phase === 'Flop' },
    { name: 'Current actor is null (waiting for board)', pass: state.currentActor === null },
    { name: 'Hand is not complete', pass: state.isComplete === false },
  ];
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト4: フロップでチェック＆チェック後、ターンに進む
function testFlopCheckCheck() {
  console.log('\n📋 Test: Flop Check-Check Advances to Turn');
  const engine = new PokerHandEngine('BTN', 100);
  
  // プリフロップ
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('BB', 'Call');
  
  // フロップへ
  engine.confirmBoard();
  
  let state = engine.getState();
  const tests = [];
  
  tests.push({ name: 'After confirm, current actor is BB', pass: state.currentActor === 'BB' });
  tests.push({ name: 'Phase is Flop', pass: state.phase === 'Flop' });
  
  // BBチェック
  engine.addPostflopAction('BB', 'Check');
  state = engine.getState();
  tests.push({ name: 'After BB check, current actor is BTN', pass: state.currentActor === 'BTN' });
  
  // BTNチェック
  engine.addPostflopAction('BTN', 'Check');
  state = engine.getState();
  
  tests.push({ name: 'After both check, waiting for board', pass: state.waitingForBoard === true });
  tests.push({ name: 'Phase is Turn', pass: state.phase === 'Turn' });
  tests.push({ name: 'Hand is NOT complete after check-check', pass: state.isComplete === false });
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト5: チェック可能な場合はフォールドが利用不可
function testAvailableActions() {
  console.log('\n📋 Test: Available Actions (Fold/Check Rules)');
  const engine = new PokerHandEngine('BTN', 100);
  
  // プリフロップ: BTNレイズ、BBコール
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('BB', 'Call');
  engine.confirmBoard();
  
  // フロップ: BBのアクション
  let actions = engine.getAvailableActions('BB');
  
  const tests = [];
  tests.push({ name: 'BB can check (no bet)', pass: actions.includes('Check') });
  tests.push({ name: 'BB cannot fold when can check', pass: !actions.includes('Fold') });
  tests.push({ name: 'BB can bet', pass: actions.includes('Bet') });
  
  // BBがベット
  engine.addPostflopAction('BB', 'Bet', 3);
  
  // BTNのアクション（ベットに直面）
  actions = engine.getAvailableActions('BTN');
  tests.push({ name: 'BTN can fold (facing bet)', pass: actions.includes('Fold') });
  tests.push({ name: 'BTN can call', pass: actions.includes('Call') });
  tests.push({ name: 'BTN can raise', pass: actions.includes('Raise') });
  tests.push({ name: 'BTN cannot check (facing bet)', pass: !actions.includes('Check') });
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト6: 完全なハンド（リバーまで）
function testCompleteHand() {
  console.log('\n📋 Test: Complete Hand to River');
  const engine = new PokerHandEngine('BTN', 100);
  
  // プリフロップ
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('BB', 'Call');
  engine.confirmBoard();
  
  // フロップ
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('BTN', 'Check');
  engine.confirmBoard();
  
  let state = engine.getState();
  const tests = [];
  tests.push({ name: 'After flop, phase is Turn', pass: state.phase === 'Turn' });
  
  // ターン
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('BTN', 'Check');
  engine.confirmBoard();
  
  state = engine.getState();
  tests.push({ name: 'After turn, phase is River', pass: state.phase === 'River' });
  
  // リバー
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('BTN', 'Check');
  
  state = engine.getState();
  tests.push({ name: 'After river, hand is complete', pass: state.isComplete === true });
  tests.push({ name: 'Current actor is null', pass: state.currentActor === null });
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト7: BBのオプション（全員リンプ）
function testBBOption() {
  console.log('\n📋 Test: BB Option (All Limpers)');
  const engine = new PokerHandEngine('BB', 100);
  
  // 全員コール（リンプ）
  engine.addPreflopAction('UTG', 'Call');
  
  let state = engine.getState();
  const tests = [];
  tests.push({ name: 'After UTG limp, current actor is HJ', pass: state.currentActor === 'HJ' });
  
  engine.addPreflopAction('HJ', 'Call');
  engine.addPreflopAction('CO', 'Call');
  engine.addPreflopAction('BTN', 'Call');
  engine.addPreflopAction('SB', 'Call');
  
  state = engine.getState();
  tests.push({ name: 'After all limps, current actor is BB', pass: state.currentActor === 'BB' });
  tests.push({ name: 'Preflop not yet complete', pass: state.waitingForBoard === false });
  
  // BBはチェック可能
  const bbActions = engine.getAvailableActions('BB');
  tests.push({ name: 'BB can check (option)', pass: bbActions.includes('Check') });
  tests.push({ name: 'BB cannot fold (can check)', pass: !bbActions.includes('Fold') });
  tests.push({ name: 'BB can raise', pass: bbActions.includes('Raise') });
  
  // BBチェック
  engine.addPreflopAction('BB', 'Check');
  
  state = engine.getState();
  tests.push({ name: 'After BB check, waiting for board', pass: state.waitingForBoard === true });
  tests.push({ name: 'Phase is Flop', pass: state.phase === 'Flop' });
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト8: ベット＆コール後のストリート進行
function testBetCallAdvance() {
  console.log('\n📋 Test: Bet-Call Advances Street');
  const engine = new PokerHandEngine('BTN', 100);
  
  // プリフロップ
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('BB', 'Call');
  engine.confirmBoard();
  
  // フロップ: BBベット、BTNコール
  engine.addPostflopAction('BB', 'Bet', 4);
  engine.addPostflopAction('BTN', 'Call');
  
  const state = engine.getState();
  
  const tests = [
    { name: 'After bet-call, waiting for board', pass: state.waitingForBoard === true },
    { name: 'Phase is Turn', pass: state.phase === 'Turn' },
    { name: 'Hand is not complete', pass: state.isComplete === false },
  ];
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト9: フォールド時のハンド終了
function testFoldEndsHand() {
  console.log('\n📋 Test: Fold Ends Hand');
  const engine = new PokerHandEngine('BTN', 100);
  
  // プリフロップ: BTNレイズ、BBフォールド
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Fold');
  
  const state = engine.getState();
  
  const tests = [
    { name: 'Hand is complete after all fold', pass: state.isComplete === true },
    { name: 'Only BTN remaining', pass: state.players.filter(p => !p.folded).length === 1 },
  ];
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト10: レイズ＆リレイズの処理
function testRaiseReraise() {
  console.log('\n📋 Test: Raise and Reraise');
  const engine = new PokerHandEngine('BTN', 100);
  
  // プリフロップ
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('BB', 'Call');
  engine.confirmBoard();
  
  // フロップ: ベット→レイズ→コール
  engine.addPostflopAction('BB', 'Bet', 4);
  
  let state = engine.getState();
  const tests = [];
  tests.push({ name: 'Current bet is 4', pass: state.currentBet === 4 });
  
  engine.addPostflopAction('BTN', 'Raise', 12);
  
  state = engine.getState();
  tests.push({ name: 'After raise, current bet is 12', pass: state.currentBet === 12 });
  tests.push({ name: 'Current actor is BB', pass: state.currentActor === 'BB' });
  
  engine.addPostflopAction('BB', 'Call');
  
  state = engine.getState();
  tests.push({ name: 'After call, waiting for board', pass: state.waitingForBoard === true });
  tests.push({ name: 'Phase is Turn', pass: state.phase === 'Turn' });
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト11: マルチウェイポット（3人以上）
function testMultiwayPot() {
  console.log('\n📋 Test: Multiway Pot');
  const engine = new PokerHandEngine('BTN', 100);
  
  // プリフロップ: CO, BTN, BBがアクティブ
  engine.addPreflopAction('CO', 'Raise', 3);
  engine.addPreflopAction('BTN', 'Call');
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  engine.confirmBoard();
  
  let state = engine.getState();
  const tests = [];
  tests.push({ name: '3 players active', pass: state.players.filter(p => !p.folded).length === 3 });
  tests.push({ name: 'Current actor is BB (first active postflop)', pass: state.currentActor === 'BB' });
  
  // フロップ
  engine.addPostflopAction('BB', 'Check');
  state = engine.getState();
  tests.push({ name: 'After BB check, actor is CO', pass: state.currentActor === 'CO' });
  
  engine.addPostflopAction('CO', 'Check');
  state = engine.getState();
  tests.push({ name: 'After CO check, actor is BTN', pass: state.currentActor === 'BTN' });
  
  engine.addPostflopAction('BTN', 'Check');
  state = engine.getState();
  tests.push({ name: 'After all check, waiting for turn', pass: state.waitingForBoard === true });
  tests.push({ name: 'Phase is Turn', pass: state.phase === 'Turn' });
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// テスト12: ヘッズアップ（2人）でのアクション順
function testHeadsUp() {
  console.log('\n📋 Test: Heads Up Action Order');
  const engine = new PokerHandEngine('BTN', 100);
  
  // 全員フォールドしてHU
  engine.addPreflopAction('BTN', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  engine.confirmBoard();
  
  const state = engine.getState();
  
  const tests = [
    { name: 'HU: Only 2 players active', pass: state.players.filter(p => !p.folded).length === 2 },
    { name: 'HU: BB acts first postflop', pass: state.currentActor === 'BB' },
  ];
  
  tests.forEach(t => logTest(t.name, t.pass));
  return tests.every(t => t.pass);
}

// 全テスト実行
export function runAllTests() {
  console.log('🧪 Running PokerHandEngine Tests\n');
  console.log('='.repeat(50));
  
  const results = [
    { name: 'Initialization', result: testInitialization() },
    { name: 'Preflop Skip Function', result: testPreflopSkip() },
    { name: 'Preflop to Flop Transition', result: testPreflopToFlopTransition() },
    { name: 'Flop Check-Check', result: testFlopCheckCheck() },
    { name: 'Available Actions', result: testAvailableActions() },
    { name: 'Complete Hand', result: testCompleteHand() },
    { name: 'BB Option', result: testBBOption() },
    { name: 'Bet-Call Advance', result: testBetCallAdvance() },
    { name: 'Fold Ends Hand', result: testFoldEndsHand() },
    { name: 'Raise and Reraise', result: testRaiseReraise() },
    { name: 'Multiway Pot', result: testMultiwayPot() },
    { name: 'Heads Up', result: testHeadsUp() },
  ];
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  const passed = results.filter(r => r.result).length;
  const total = results.length;
  console.log(`${passed}/${total} test suites passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed:');
    results.filter(r => !r.result).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
  
  return passed === total;
}

// ブラウザ環境で実行
if (typeof window !== 'undefined') {
  console.log('Run tests by calling: runAllTests()');
}
