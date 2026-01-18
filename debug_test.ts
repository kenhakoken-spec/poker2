// BTNレイズ後のデバッグ
import { PokerHandEngine } from './lib/PokerHandEngine';

const engine = new PokerHandEngine('BTN', 100);
let state = engine.getState();

console.log('初期状態:');
console.log(`  currentActor: ${state.currentActor}`);
console.log(`  currentActorIndex: ${engine['currentActorIndex']}`);
console.log(`  players:`, state.players.map(p => ({ pos: p.position, folded: p.folded, acted: p.hasActedThisStreet })));

console.log('\nBTNがレイズ:');
engine.addPreflopAction('BTN', 'Raise', 3);

state = engine.getState();
console.log(`  currentActor: ${state.currentActor}`);
console.log(`  currentActorIndex: ${engine['currentActorIndex']}`);
console.log(`  lastAggressorIndex: ${engine['street']['lastAggressorIndex']}`);
console.log(`  players:`, state.players.map(p => ({ pos: p.position, folded: p.folded, acted: p.hasActedThisStreet, contributed: p.contributed })));

// 内部メソッドを使って確認
const nextIdx = engine['getNextActivePlayerIndex'](engine['currentActorIndex']);
console.log(`  nextIndex (from BTN): ${nextIdx} (${nextIdx >= 0 ? ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'][nextIdx] : 'null'})`);

const isComplete = engine['isStreetComplete'](nextIdx);
console.log(`  isStreetComplete(${nextIdx}): ${isComplete}`);
