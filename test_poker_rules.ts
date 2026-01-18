// ポーカールールの包括的テスト
import { PokerHandEngine } from './lib/PokerHandEngine';
import type { Position } from './types/poker';

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`    ${details}`);
  if (!passed) {
    console.error(`    ⚠️  エラー詳細: ${details}`);
  }
}

// テスト1: UTGが3倍レイズ → BBがコール → フロップへ進む
function testUTGRaiseBBCall() {
  console.log('\n📋 テスト1: UTGが3倍レイズ → BBがコール');
  const engine = new PokerHandEngine('BB', 100);
  
  let state = engine.getState();
  logTest('初期状態: UTGが手番', state.currentActor === 'UTG', `currentActor=${state.currentActor}`);
  
  // UTGが3倍レイズ
  engine.addPreflopAction('UTG', 'Raise', 3);
  state = engine.getState();
  // プリフロップの順序: UTG → HJ → CO → BTN → SB → BB
  logTest('UTGレイズ後: HJが手番', state.currentActor === 'HJ', `currentActor=${state.currentActor}, pot=${state.pot}`);
  
  // HJ、CO、BTNをスキップしてSBへ
  engine.addPreflopAction('SB', 'Fold');
  state = engine.getState();
  logTest('SBフォールド後: BBが手番', state.currentActor === 'BB', `currentActor=${state.currentActor}`);
  
  // BBがコール
  engine.addPreflopAction('BB', 'Call');
  state = engine.getState();
  logTest('BBコール後: ボード待ち状態', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}, currentActor=${state.currentActor}`);
  logTest('BBコール後: フェーズがFlop', state.phase === 'Flop', `phase=${state.phase}`);
  logTest('BBコール後: ハンド未完了', state.isComplete === false, `isComplete=${state.isComplete}`);
  
  // フロップへ進む
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    logTest('フロップ確認後: BBが最初のアクター', state.currentActor === 'BB', 
      `currentActor=${state.currentActor}, phase=${state.phase}`);
  }
  
  return state.waitingForBoard && state.phase === 'Flop' && !state.isComplete;
}

// テスト2: BTNがレイズ → SB/BBフォールド → BTNが勝つ
function testBTNRaiseAllFold() {
  console.log('\n📋 テスト2: BTNがレイズ → 全員フォールド');
  const engine = new PokerHandEngine('BTN', 100);
  
  // BTNがレイズ（UTG, HJ, COは自動フォールド）
  engine.addPreflopAction('BTN', 'Raise', 3);
  let state = engine.getState();
  // BTNレイズ後、次のアクターはSB（プリフロップ順序: UTG → HJ → CO → BTN → SB → BB）
  logTest('BTNレイズ後: SBが手番', state.currentActor === 'SB', `currentActor=${state.currentActor}`);
  
  // SBフォールド
  engine.addPreflopAction('SB', 'Fold');
  state = engine.getState();
  logTest('SBフォールド後: BBが手番', state.currentActor === 'BB', `currentActor=${state.currentActor}`);
  
  // BBフォールド
  engine.addPreflopAction('BB', 'Fold');
  state = engine.getState();
  logTest('BBフォールド後: ハンド完了', state.isComplete === true, 
    `isComplete=${state.isComplete}, currentActor=${state.currentActor}`);
  
  return state.isComplete === true;
}

// テスト3: 全員コール（リンプ）→ BBオプション → フロップ
function testAllLimpBBOption() {
  console.log('\n📋 テスト3: 全員リンプ → BBオプション');
  const engine = new PokerHandEngine('BB', 100);
  
  // UTG、HJ、CO、BTNがコール
  engine.addPreflopAction('UTG', 'Call');
  engine.addPreflopAction('HJ', 'Call');
  engine.addPreflopAction('CO', 'Call');
  engine.addPreflopAction('BTN', 'Call');
  
  let state = engine.getState();
  logTest('BTNコール後: SBが手番', state.currentActor === 'SB', `currentActor=${state.currentActor}`);
  
  engine.addPreflopAction('SB', 'Call');
  state = engine.getState();
  logTest('SBコール後: BBが手番（オプション）', state.currentActor === 'BB', 
    `currentActor=${state.currentActor}, waitingForBoard=${state.waitingForBoard}`);
  
  // BBがチェック
  engine.addPreflopAction('BB', 'Check');
  state = engine.getState();
  logTest('BBチェック後: ボード待ち', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  return state.waitingForBoard === true && state.phase === 'Flop';
}

// テスト4: フロップでチェックチェック → ターンへ
function testFlopCheckCheck() {
  console.log('\n📋 テスト4: フロップでチェックチェック');
  const engine = new PokerHandEngine('BB', 100);
  
  // プリフロップ
  engine.addPreflopAction('UTG', 'Raise', 3);
  // HJ、CO、BTNをスキップしてSBへ
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  logTest('BBコール後: ボード待ち状態', state.waitingForBoard === true && state.phase === 'Flop', 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  state = engine.getState();
  // ポストフロップの順序: SB → BB → UTG → HJ → CO → BTN
  // SBがフォールドしているので、BBが最初
  logTest('フロップ開始: BBが最初', state.currentActor === 'BB' && state.phase === 'Flop', 
    `currentActor=${state.currentActor}, phase=${state.phase}`);
  
  // BBチェック
  engine.addPostflopAction('BB', 'Check');
  state = engine.getState();
  logTest('BBチェック後: UTGが手番', state.currentActor === 'UTG', `currentActor=${state.currentActor}`);
  
  // UTGチェック
  engine.addPostflopAction('UTG', 'Check');
  state = engine.getState();
  logTest('UTGチェック後: ターン待ち', state.waitingForBoard === true && state.phase === 'Turn', 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}, isComplete=${state.isComplete}`);
  
  return state.waitingForBoard === true && state.phase === 'Turn' && !state.isComplete;
}

// テスト5: フロップでベット→コール → ターンへ
function testFlopBetCall() {
  console.log('\n📋 テスト5: フロップでベット→コール');
  const engine = new PokerHandEngine('BB', 100);
  
  // プリフロップ
  engine.addPreflopAction('UTG', 'Raise', 3);
  // HJ、CO、BTNをスキップしてSBへ
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  state = engine.getState();
  // BBがベット（ポストフロップではSB → BB → UTGの順、SBがフォールドなのでBBが最初）
  engine.addPostflopAction('BB', 'Bet', 5);
  state = engine.getState();
  logTest('BBベット後: UTGが手番', state.currentActor === 'UTG', `currentActor=${state.currentActor}`);
  
  // UTGがコール
  engine.addPostflopAction('UTG', 'Call');
  state = engine.getState();
  logTest('UTGコール後: ターン待ち', state.waitingForBoard === true && state.phase === 'Turn', 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  return state.waitingForBoard === true && state.phase === 'Turn';
}

// テスト6: チェック可能時にフォールドできない
function testCannotFoldWhenCanCheck() {
  console.log('\n📋 テスト6: チェック可能時にフォールドできない');
  const engine = new PokerHandEngine('BB', 100);
  
  // プリフロップ
  engine.addPreflopAction('UTG', 'Raise', 3);
  // HJ、CO、BTNをスキップしてSBへ
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  state = engine.getState();
  // BBの利用可能アクション（ポストフロップではSB → BB → UTGの順、SBがフォールドなのでBBが最初）
  const bbActions = engine.getAvailableActions('BB');
  logTest('BBの利用可能アクション: チェック可能', bbActions.includes('Check'), 
    `availableActions: ${bbActions.join(', ')}`);
  logTest('BBの利用可能アクション: フォールド不可', !bbActions.includes('Fold'), 
    `availableActions: ${bbActions.join(', ')}`);
  
  // フォールドしようとしてエラー
  let errorThrown = false;
  try {
    engine.addPostflopAction('BB', 'Fold');
  } catch (e) {
    errorThrown = true;
    logTest('フォールド時にエラー発生', true, `エラー: ${(e as Error).message}`);
  }
  
  return !bbActions.includes('Fold') && errorThrown;
}

// テスト7: レイズ→リレイズ→コール
function testRaiseReraiseCall() {
  console.log('\n📋 テスト7: レイズ→リレイズ→コール');
  const engine = new PokerHandEngine('BB', 100);
  
  // プリフロップ
  engine.addPreflopAction('UTG', 'Raise', 3);
  
  let state = engine.getState();
  logTest('UTGレイズ後: SBが手番', state.currentActor === 'SB', `currentActor=${state.currentActor}`);
  
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Raise', 9); // リレイズ
  
  state = engine.getState();
  logTest('BBリレイズ後: UTGが手番', state.currentActor === 'UTG', `currentActor=${state.currentActor}`);
  
  engine.addPreflopAction('UTG', 'Call');
  state = engine.getState();
  logTest('UTGコール後: ボード待ち', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  return state.waitingForBoard === true && state.phase === 'Flop';
}

// 全テスト実行
function runAllTests() {
  console.log('🧪 ポーカールール包括的テスト開始\n');
  console.log('='.repeat(60));
  
  const results = [
    { name: 'UTGレイズ→BBコール', result: testUTGRaiseBBCall() },
    { name: 'BTNレイズ→全員フォールド', result: testBTNRaiseAllFold() },
    { name: '全員リンプ→BBオプション', result: testAllLimpBBOption() },
    { name: 'フロップチェックチェック', result: testFlopCheckCheck() },
    { name: 'フロップベット→コール', result: testFlopBetCall() },
    { name: 'チェック可能時にフォールド不可', result: testCannotFoldWhenCanCheck() },
    { name: 'レイズ→リレイズ→コール', result: testRaiseReraiseCall() },
  ];
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 テスト結果サマリー:');
  const passed = results.filter(r => r.result).length;
  const total = results.length;
  console.log(`${passed}/${total} テストが成功`);
  
  if (passed === total) {
    console.log('✅ すべてのテストが成功しました！');
  } else {
    console.log('❌ 失敗したテスト:');
    results.filter(r => !r.result).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
  
  return passed === total;
}

// 実行
runAllTests();
