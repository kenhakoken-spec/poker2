// BTNレイズ後の詳細デバッグ
import { PokerHandEngine } from './lib/PokerHandEngine';

const engine = new PokerHandEngine('BTN', 100);
let state = engine.getState();

console.log('初期状態:');
console.log(`  currentActorIndex: ${engine['currentActorIndex']}`);
console.log(`  currentActor: ${state.currentActor}`);
console.log(`  waitingForBoard: ${state.waitingForBoard}`);

console.log('\nBTNがレイズ:');
engine.addPreflopAction('BTN', 'Raise', 3);

state = engine.getState();
console.log(`  currentActorIndex: ${engine['currentActorIndex']}`);
console.log(`  currentActor: ${state.currentActor}`);
console.log(`  waitingForBoard: ${state.waitingForBoard}`);
console.log(`  isHandComplete: ${state.isComplete}`);
console.log(`  lastAggressorIndex: ${engine['street']['lastAggressorIndex']}`);

const activeCount = engine['getActivePlayerCount']();
console.log(`  activePlayerCount: ${activeCount}`);

const nextIdx = engine['getNextActivePlayerIndex'](engine['currentActorIndex']);
console.log(`  nextIndex (from BTN index ${engine['currentActorIndex']}): ${nextIdx}`);

// advanceToNextActorの内部動作をシミュレート
const isComplete = engine['isStreetComplete'](nextIdx);
console.log(`  isStreetComplete(${nextIdx}): ${isComplete}`);

if (!isComplete) {
  console.log(`  → currentActorIndex should be set to ${nextIdx} (SB)`);
  console.log(`  → but it's still ${engine['currentActorIndex']}`);
  console.log(`  → This is the bug!`);
}

console.log(`  players:`, state.players.map(p => ({ 
  pos: p.position, 
  folded: p.folded, 
  acted: p.hasActedThisStreet,
  contributed: p.contributed
})));
