// デバッグ用テスト: オールイン後のコール
import { PokerHandEngine } from './lib/PokerHandEngine';

const engine = new PokerHandEngine('UTG', 10);

console.log('=== 初期状態 ===');
let state = engine.getState();
console.log(`currentActor: ${state.currentActor}`);
state.players.forEach(p => {
  console.log(`${p.position}: stack=${p.stack}, contributed=${p.contributed}, folded=${p.folded}, hasActed=${p.hasActedThisStreet}`);
});

console.log('\n=== UTGレイズ3BB ===');
engine.addPreflopAction('UTG', 'Raise', 3);
state = engine.getState();
console.log(`currentActor: ${state.currentActor}, currentBet: ${state.currentBet}`);
state.players.forEach(p => {
  console.log(`${p.position}: stack=${p.stack}, contributed=${p.contributed}, folded=${p.folded}, hasActed=${p.hasActedThisStreet}`);
});

console.log('\n=== SBフォールド ===');
engine.addPreflopAction('SB', 'Fold');
state = engine.getState();
console.log(`currentActor: ${state.currentActor}, currentBet: ${state.currentBet}`);
state.players.forEach(p => {
  console.log(`${p.position}: stack=${p.stack}, contributed=${p.contributed}, folded=${p.folded}, hasActed=${p.hasActedThisStreet}`);
});

console.log('\n=== BBオールイン ===');
const bbStack = state.players.find(p => p.position === 'BB')?.stack || 0;
console.log(`BB stack before all-in: ${bbStack}`);
engine.addPreflopAction('BB', 'Raise', bbStack + 1);
state = engine.getState();
console.log(`currentActor: ${state.currentActor}, currentBet: ${state.currentBet}, waitingForBoard: ${state.waitingForBoard}`);
state.players.forEach(p => {
  console.log(`${p.position}: stack=${p.stack}, contributed=${p.contributed}, folded=${p.folded}, hasActed=${p.hasActedThisStreet}`);
});
console.log(`lastAggressorIndex: ${state.players.findIndex(p => p.position === state.currentActor) === -1 ? 'null' : state.players.findIndex(p => p.position === state.currentActor)}`);

console.log('\n=== UTGコール ===');
engine.addPreflopAction('UTG', 'Call');
state = engine.getState();
console.log(`currentActor: ${state.currentActor}, currentBet: ${state.currentBet}, waitingForBoard: ${state.waitingForBoard}, phase: ${state.phase}`);
state.players.forEach(p => {
  console.log(`${p.position}: stack=${p.stack}, contributed=${p.contributed}, folded=${p.folded}, hasActed=${p.hasActedThisStreet}`);
});
