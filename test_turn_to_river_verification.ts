import { PokerHandEngine } from './lib/PokerHandEngine';

/**
 * ターン終了時にリバーに進まない問題の検証テスト
 */

function logSection(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
}

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  if (!passed) {
    console.error(`   ❌ Test failed!`);
  }
}

// Test 1: TurnでCheck-Checkしてリバーに進む
function testTurnCheckCheckToRiver() {
  logSection('テスト1: ターンでCheck-Checkしてリバーに進む');
  const engine = new PokerHandEngine('BB', 100);
  
  // Preflop
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Flop: Check-Check
  state = engine.getState();
  logTest('フロップ開始', state.phase === 'Flop', `phase=${state.phase}`);
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('UTG', 'Check');
  
  state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Turn: Check-Check
  state = engine.getState();
  logTest('ターン開始確認', state.phase === 'Turn', `phase=${state.phase}`);
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('UTG', 'Check');
  
  state = engine.getState();
  const turnCheckPass = state.waitingForBoard === true;
  logTest('ターン完了後、リバー待ち', turnCheckPass, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    const riverPass = state.phase === 'River' && !state.isComplete;
    logTest('リバーボード確認後、リバーに進む', riverPass, 
      `phase=${state.phase}, isComplete=${state.isComplete}, currentActor=${state.currentActor}`);
    
    if (!riverPass) {
      console.error(`   ❌ リバーに進まなかった！phase=${state.phase}, isComplete=${state.isComplete}`);
    }
  } else {
    logTest('ターン完了後にwaitingForBoardがfalse', false, 'このテストは失敗しました');
  }
}

// Test 2: TurnでBet-Callしてリバーに進む
function testTurnBetCallToRiver() {
  logSection('テスト2: ターンでBet-Callしてリバーに進む');
  const engine = new PokerHandEngine('BB', 100);
  
  // Preflop
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Flop: Check-Check
  state = engine.getState();
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('UTG', 'Check');
  
  state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Turn: Bet-Call
  state = engine.getState();
  logTest('ターン開始確認', state.phase === 'Turn', `phase=${state.phase}`);
  engine.addPostflopAction('BB', 'Bet', 5);
  engine.addPostflopAction('UTG', 'Call');
  
  state = engine.getState();
  const betCallPass = state.waitingForBoard === true;
  logTest('ターンBet-Call後、リバー待ち', betCallPass, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    const riverPass = state.phase === 'River' && !state.isComplete;
    logTest('リバーボード確認後、リバーに進む', riverPass, 
      `phase=${state.phase}, isComplete=${state.isComplete}, currentActor=${state.currentActor}`);
  }
}

// Test 3: Turnで複数回のベッティング後にリバーに進む
function testTurnComplexBettingToRiver() {
  logSection('テスト3: ターンで複数回ベッティング後にリバーに進む');
  const engine = new PokerHandEngine('BB', 100);
  
  // Preflop
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Flop: Check-Check
  state = engine.getState();
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('UTG', 'Check');
  
  state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Turn: Bet-Raise-Call
  state = engine.getState();
  logTest('ターン開始確認', state.phase === 'Turn', `phase=${state.phase}`);
  engine.addPostflopAction('BB', 'Bet', 5);
  engine.addPostflopAction('UTG', 'Raise', 15);
  engine.addPostflopAction('BB', 'Call');
  
  state = engine.getState();
  const complexPass = state.waitingForBoard === true;
  logTest('ターン複数回ベッティング後、リバー待ち', complexPass, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    const riverPass = state.phase === 'River' && !state.isComplete;
    logTest('リバーボード確認後、リバーに進む', riverPass, 
      `phase=${state.phase}, isComplete=${state.isComplete}, currentActor=${state.currentActor}`);
  }
}

// Test 4: Turnでオールインしてリバーに進む
function testTurnAllInToRiver() {
  logSection('テスト4: ターンでオールインしてリバーに進む');
  const engine = new PokerHandEngine('BB', 100);
  
  // Preflop
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Flop: Check-Check
  state = engine.getState();
  engine.addPostflopAction('BB', 'Check');
  engine.addPostflopAction('UTG', 'Check');
  
  state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // Turn: All-in
  state = engine.getState();
  logTest('ターン開始確認', state.phase === 'Turn', `phase=${state.phase}`);
  const bbStack = state.players.find(p => p.position === 'BB')?.stack || 0;
  engine.addPostflopAction('BB', 'Bet', bbStack); // BBオールイン
  engine.addPostflopAction('UTG', 'Call');
  
  state = engine.getState();
  const allInPass = state.waitingForBoard === true;
  logTest('ターンオールイン後、リバー待ち', allInPass, 
    `waitingForBoard=${state.waitingForBoard}, phase=${state.phase}`);
  
  if (state.waitingForBoard) {
    engine.confirmBoard();
    state = engine.getState();
    // 全員オールインの場合、リバーでもボードカードが必要
    const riverPass = state.phase === 'River' || state.waitingForBoard === true;
    logTest('リバーボード確認後、リバー待ちまたはハンド完了', riverPass, 
      `phase=${state.phase}, waitingForBoard=${state.waitingForBoard}, isComplete=${state.isComplete}`);
  }
}

// Test 5: フロップ→ターン→リバー全て通過する完全なテスト
function testCompleteFlopTurnRiver() {
  logSection('テスト5: フロップ→ターン→リバー完全通過テスト');
  const engine = new PokerHandEngine('BB', 100);
  
  // Preflop
  engine.addPreflopAction('UTG', 'Raise', 3);
  engine.addPreflopAction('SB', 'Fold');
  engine.addPreflopAction('BB', 'Call');
  
  let state = engine.getState();
  if (state.waitingForBoard) {
    engine.confirmBoard();
  }
  
  // フロップ、ターン、リバーでCheck-Check
  const phases: string[] = [];
  for (let i = 0; i < 3; i++) {
    state = engine.getState();
    phases.push(state.phase);
    
    if (state.isComplete) {
      logTest(`フェーズ${i + 1}でハンド完了（予期しない）`, false, `phase=${state.phase}`);
      return;
    }
    
    engine.addPostflopAction('BB', 'Check');
    engine.addPostflopAction('UTG', 'Check');
    
    state = engine.getState();
    if (state.waitingForBoard) {
      engine.confirmBoard();
    }
  }
  
  state = engine.getState();
  const allPhasesPass = phases.length === 3 && phases[0] === 'Flop' && phases[1] === 'Turn' && phases[2] === 'River';
  logTest('全フェーズ（Flop→Turn→River）を通過', allPhasesPass, 
    `通過したフェーズ: ${phases.join(' → ')}, 最終phase=${state.phase}`);
}

// 統計用
let passCount = 0;
let failCount = 0;

// 全テスト実行
console.log('\n========================================');
console.log('ターン→リバー進行検証テスト');
console.log('========================================\n');

try {
  testTurnCheckCheckToRiver();
  console.log('\n');
  testTurnBetCallToRiver();
  console.log('\n');
  testTurnComplexBettingToRiver();
  console.log('\n');
  testTurnAllInToRiver();
  console.log('\n');
  testCompleteFlopTurnRiver();
} catch (error) {
  console.error('\n❌ テスト実行中にエラーが発生しました:', error);
}

console.log('\n========================================');
console.log('検証テスト完了');
console.log('========================================\n');
