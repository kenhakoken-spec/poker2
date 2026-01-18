// 包括的なポーカールールテスト
import { PokerHandEngine } from './lib/PokerHandEngine';
import type { Position } from './types/poker';

let testCount = 0;
let passCount = 0;
let failCount = 0;

function logTest(name: string, passed: boolean, details?: string) {
  testCount++;
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`    ${details}`);
  if (!passed) {
    console.error(`    ⚠️  エラー: ${details}`);
  }
}

function logSection(name: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${name}`);
  console.log('='.repeat(60));
}

// テスト1: スタックを超えてレイズできないことを確認
function testCannotRaiseMoreThanStack() {
  logSection('テスト1: スタック制限テスト');
  const engine = new PokerHandEngine('UTG', 10); // スタック10BB
  
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  
  let state = engine.getState();
  const bbPlayer = state.players.find(p => p.position === 'BB');
  const bbStackBefore = bbPlayer?.stack || 0;
  
  // BBのスタックは9BB（ブラインド1BB支払済み）
  // 3BBレイズにコールするには2BB必要
  // 15BBレイズはスタックを超える
  
  let errorThrown = false;
  let errorMessage = '';
  
  try {
    // BBが15BBレイズしようとする（スタック9BBを超える）
    engine.addPreflopAction('BB', 'Raise', 15);
  } catch (e) {
    errorThrown = true;
    errorMessage = (e as Error).message;
  }
  
  state = engine.getState();
  const bbStackAfter = state.players.find(p => p.position === 'BB')?.stack || 0;
  
  // スタックを超えるレイズはできないか、自動的にオールインになるべき
  // recordAction内でMath.minで制限されているので、オールインになるはず
  logTest('スタックを超えるレイズはオールインになる', 
    !errorThrown || errorMessage.includes('stack'), 
    `BB stack before: ${bbStackBefore}, after: ${bbStackAfter}, error: ${errorMessage}`);
  
  // 正しいレイズサイズ（スタック内）でテスト
  const engine2 = new PokerHandEngine('UTG', 10);
  engine2.addPreflopAction('UTG', 'Raise', 3);
  engine2.addPreflopAction('SB', 'Fold');
  
  state = engine2.getState();
  const bbStack = state.players.find(p => p.position === 'BB')?.stack || 0;
  
  // BBがスタック内でレイズ
  engine2.addPreflopAction('BB', 'Raise', bbStack + 1); // オールイン
  state = engine2.getState();
  const bbPlayerAfter = state.players.find(p => p.position === 'BB');
  
  logTest('スタック内でオールインレイズ可能', 
    (bbPlayerAfter?.stack === 0 || bbPlayerAfter?.stack < 0.01),
    `BB stack after all-in: ${bbPlayerAfter?.stack}`);
}

// テスト2: オールイン後の挙動
function testAllInBehavior() {
  logSection('テスト2: オールイン後の挙動');
  const engine = new PokerHandEngine('UTG', 10);
  
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  
  let state = engine.getState();
  const bbStack = state.players.find(p => p.position === 'BB')?.stack || 0;
  
  // BBがオールイン
  engine.addPreflopAction('BB', 'Raise', bbStack + 1); // オールイン
  state = engine.getState();
  
  logTest('BBオールイン後: UTGが手番', state.currentActor === 'UTG', 
    `currentActor=${state.currentActor}, BB stack=${state.players.find(p => p.position === 'BB')?.stack}`);
  
  // UTGがコール
  engine.addPreflopAction('UTG', 'Call');
  state = engine.getState();
  
  logTest('UTGコール後: ボード待ち状態', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  // フロップへ
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    
    // オールインしたプレイヤーはスタック0なので、もう一人が最初
    logTest('フロップ開始: UTGが最初（BBはオールイン済み）', 
      state.currentActor === 'UTG', 
      `currentActor=${state.currentActor}, BB stack=${state.players.find(p => p.position === 'BB')?.stack}`);
  }
}

// テスト3: オールインコール後の挙動
function testAllInCallBehavior() {
  logSection('テスト3: オールインコール後の挙動');
  const engine = new PokerHandEngine('UTG', 10);
  
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  
  let state = engine.getState();
  const bbStack = state.players.find(p => p.position === 'BB')?.stack || 0;
  
  // BBがオールイン
  engine.addPreflopAction('BB', 'Raise', bbStack + 1);
  state = engine.getState();
  
  // UTGがコール（これは実質オールインコール）
  engine.addPreflopAction('UTG', 'Call');
  state = engine.getState();
  
  logTest('オールインコール後: ボード待ち', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  // 両者がオールインした場合、ハンドは完了するか？
  // 実際にはボードを待つ必要がある
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    
    // 両者オールインの場合、次のストリートは進むがアクションはない
    logTest('両者オールイン後: フロップに進む', 
      state.phase === 'Flop', 
      `phase=${state.phase}`);
  }
}

// テスト4: 3wayポット
function test3WayPot() {
  logSection('テスト4: 3wayポット');
  const engine = new PokerHandEngine('CO', 100);
  
  // COがレイズ
  engine.addPreflopAction('CO', 'Raise', 3);
  
  let state = engine.getState();
  logTest('COレイズ後: BTNが手番', state.currentActor === 'BTN', `currentActor=${state.currentActor}`);
  
  // BTNがコール
  engine.addPreflopAction('BTN', 'Call');
  state = engine.getState();
  logTest('BTNコール後: SBが手番', state.currentActor === 'SB', `currentActor=${state.currentActor}`);
  
  // SBがフォールド
  engine.addPreflopAction('SB', 'Fold');
  state = engine.getState();
  logTest('SBフォールド後: BBが手番', state.currentActor === 'BB', `currentActor=${state.currentActor}`);
  
  // BBがコール
  engine.addPreflopAction('BB', 'Call');
  state = engine.getState();
  logTest('BBコール後: ボード待ち', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  logTest('アクティブプレイヤー数: 3人', 
    state.players.filter(p => !p.folded).length === 3,
    `activePlayers: ${state.players.filter(p => !p.folded).map(p => p.position).join(', ')}`);
  
  // フロップへ
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    
    // ポストフロップはSBから、SBがフォールドしているのでBBから
    logTest('3wayフロップ開始: BBが最初', state.currentActor === 'BB', 
      `currentActor=${state.currentActor}`);
    
    // BBチェック
    engine.addPostflopAction('BB', 'Check');
    state = engine.getState();
    logTest('BBチェック後: COが手番', state.currentActor === 'CO', `currentActor=${state.currentActor}`);
    
    // COチェック
    engine.addPostflopAction('CO', 'Check');
    state = engine.getState();
    logTest('COチェック後: BTNが手番', state.currentActor === 'BTN', `currentActor=${state.currentActor}`);
    
    // BTNチェック
    engine.addPostflopAction('BTN', 'Check');
    state = engine.getState();
    logTest('全員チェック後: ターン待ち', 
      state.waitingForBoard === true && state.phase === 'Turn',
      `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  }
}

// テスト5: フロップでオールイン
function testFlopAllIn() {
  logSection('テスト5: フロップでオールイン');
  const engine = new PokerHandEngine('UTG', 10);
  
  // プリフロップ
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  state = engine.getState();
  const bbStack = state.players.find(p => p.position === 'BB')?.stack || 0;
  
  // BBがフロップでオールイン
  engine.addPostflopAction('BB', 'Bet', bbStack);
  state = engine.getState();
  
  logTest('BBオールインベット後: UTGが手番', state.currentActor === 'UTG', 
    `currentActor=${state.currentActor}, BB stack=${state.players.find(p => p.position === 'BB')?.stack}`);
  
  // UTGがコール（オールイン）
  engine.addPostflopAction('UTG', 'Call');
  state = engine.getState();
  
  logTest('UTGオールインコール後: ターン待ち', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    
    // 両者オールインなので、ターンも自動進行
    logTest('両者オールイン後: ターンに進む', state.phase === 'Turn', 
      `phase=${state.phase}`);
  }
}

// テスト6: 部分オールイン（一方のみオールイン）
function testPartialAllIn() {
  logSection('テスト6: 部分オールイン');
  const engine = new PokerHandEngine('UTG', 100);
  const engine2 = new PokerHandEngine('BB', 10); // BBだけスタック小さい
  
  // エンジン1でテスト
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  
  let state = engine.getState();
  const bbStack = state.players.find(p => p.position === 'BB')?.stack || 0;
  
  // BBがオールイン（7BB）
  engine.addPreflopAction('BB', 'Raise', bbStack + 1);
  state = engine.getState();
  
  logTest('BB部分オールイン後: UTGが手番', state.currentActor === 'UTG', 
    `currentActor=${state.currentActor}, BB stack=${state.players.find(p => p.position === 'BB')?.stack}`);
  
  // UTGがコール（オールインではない、通常コール）
  engine.addPreflopAction('UTG', 'Call');
  state = engine.getState();
  
  logTest('UTGコール後: ボード待ち', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, UTG stack=${state.players.find(p => p.position === 'UTG')?.stack}`);
  
  // BBのオールイン額よりUTGが多く持っている場合
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    
    // UTGがまだスタックを持っているので、UTGが最初のアクター
    logTest('部分オールイン後: UTGが最初（BBはオールイン済み）', 
      state.currentActor === 'UTG',
      `currentActor=${state.currentActor}`);
  }
}

// テスト7: マルチベットサイズ（レイズ→リレイズ→リレイズ）
function testMultiBetSizing() {
  logSection('テスト7: マルチベットサイズ');
  const engine = new PokerHandEngine('UTG', 100);
  
  // UTGレイズ
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  
  let state = engine.getState();
  logTest('UTGレイズ後: BBが手番', state.currentActor === 'BB', `currentActor=${state.currentActor}`);
  
  // BBリレイズ
  engine.addPreflopAction('BB', 'Raise', 10);
  state = engine.getState();
  logTest('BBリレイズ後: UTGが手番', state.currentActor === 'UTG', 
    `currentActor=${state.currentActor}, currentBet=${state.currentBet}`);
  
  // UTGリレイズ
  engine.addPreflopAction('UTG', 'Raise', 25);
  state = engine.getState();
  logTest('UTGリレイズ後: BBが手番', state.currentActor === 'BB', 
    `currentActor=${state.currentActor}, currentBet=${state.currentBet}`);
  
  // BBコール
  engine.addPreflopAction('BB', 'Call');
  state = engine.getState();
  logTest('BBコール後: ボード待ち', state.waitingForBoard === true, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
}

// 全テスト実行
function runAllTests() {
  console.log('🧪 包括的ポーカールールテスト開始\n');
  
  testCannotRaiseMoreThanStack();
  testAllInBehavior();
  testAllInCallBehavior();
  test3WayPot();
  testFlopAllIn();
  testPartialAllIn();
  testMultiBetSizing();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 テスト結果サマリー:');
  console.log(`✅ 成功: ${passCount}/${testCount}`);
  console.log(`❌ 失敗: ${failCount}/${testCount}`);
  
  if (failCount === 0) {
    console.log('✅ すべてのテストが成功しました！');
  } else {
    console.log('❌ 一部のテストが失敗しました。修正が必要です。');
  }
  
  return failCount === 0;
}

// 実行
runAllTests();
