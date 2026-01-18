# Poker Logic Engine - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Position    │  │   Action     │  │    Board     │        │
│  │  Selector    │  │   Panel      │  │   Picker     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EnhancedPokerTable                           │
│                  (React Component Layer)                        │
│                                                                 │
│  - State Management                                             │
│  - User Interaction Handling                                    │
│  - UI Updates                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   usePokerEngineWithState                       │
│                   (React Integration Hook)                      │
│                                                                 │
│  - Bridge between UI and Engine                                 │
│  - State Synchronization                                        │
│  - Metadata Management (opponent type, board, etc.)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PokerHandEngine                            │
│                   (Core Logic Engine)                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Player Management                                       │  │
│  │ - Stack tracking                                        │  │
│  │ - Fold status                                           │  │
│  │ - Contribution tracking                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Street Management                                       │  │
│  │ - Current phase (Preflop/Flop/Turn/River)              │  │
│  │ - Pot calculation                                       │  │
│  │ - Current bet tracking                                  │  │
│  │ - Aggressor tracking                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Action Management                                       │  │
│  │ - addPreflopAction() → Skip function                   │  │
│  │ - addPostflopAction() → Strict turn enforcement        │  │
│  │ - recordAction() → JSON history                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Turn Management                                         │  │
│  │ - getCurrentActor()                                     │  │
│  │ - getNextActivePlayerIndex()                            │  │
│  │ - advanceToNextActor()                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Street Completion Detection                             │  │
│  │ - isStreetComplete()                                    │  │
│  │ - advanceToNextStreet()                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Preflop Action Flow (with Skip Function)

```
User Input
    │
    ↓
┌───────────────────┐
│ Select Position   │  (e.g., BTN)
└─────────┬─────────┘
          │
          ↓
┌───────────────────┐
│ Select Action     │  (e.g., Raise 3bb)
└─────────┬─────────┘
          │
          ↓
┌───────────────────────────────────────┐
│ EnhancedActionPanel                   │
│ onAddAction(BTN, Raise, 3)            │
└─────────┬─────────────────────────────┘
          │
          ↓
┌───────────────────────────────────────┐
│ usePokerEngineWithState               │
│ addAction(BTN, Raise, 3)              │
└─────────┬─────────────────────────────┘
          │
          ↓
┌───────────────────────────────────────┐
│ PokerHandEngine                       │
│ addPreflopAction(BTN, Raise, 3)       │
└─────────┬─────────────────────────────┘
          │
          ├─────────────────────────────┐
          │                             │
          ↓                             ↓
┌─────────────────────┐    ┌─────────────────────┐
│ autoFoldBetween()   │    │ recordAction()      │
│ (UTG, HJ, CO)       │    │ (BTN, Raise, 3)     │
└─────────┬───────────┘    └─────────┬───────────┘
          │                           │
          └───────────┬───────────────┘
                      │
                      ↓
          ┌───────────────────────┐
          │ advanceToNextActor()  │
          └───────────┬───────────┘
                      │
                      ↓
          ┌───────────────────────┐
          │ Update State          │
          │ - pot                 │
          │ - currentActor        │
          │ - actions history     │
          └───────────┬───────────┘
                      │
                      ↓
          ┌───────────────────────┐
          │ UI Re-render          │
          └───────────────────────┘
```

### Postflop Action Flow

```
User Input
    │
    ↓
┌───────────────────┐
│ Only Current Turn │  (Others disabled)
│ Position Selectable│
└─────────┬─────────┘
          │
          ↓
┌───────────────────┐
│ Select Action     │  (e.g., Bet 5bb)
└─────────┬─────────┘
          │
          ↓
┌───────────────────────────────────────┐
│ EnhancedActionPanel                   │
│ onAddAction(SB, Bet, 5)               │
└─────────┬─────────────────────────────┘
          │
          ↓
┌───────────────────────────────────────┐
│ usePokerEngineWithState               │
│ addAction(SB, Bet, 5)                 │
└─────────┬─────────────────────────────┘
          │
          ↓
┌───────────────────────────────────────┐
│ PokerHandEngine                       │
│ addPostflopAction(SB, Bet, 5)         │
└─────────┬─────────────────────────────┘
          │
          ├─────────────────────┐
          │                     │
          ↓                     ↓
┌─────────────────┐  ┌─────────────────┐
│ Validate Turn   │  │ recordAction()  │
│ (Must be SB)    │  │ (SB, Bet, 5)    │
└─────────┬───────┘  └─────────┬───────┘
          │                     │
          └──────────┬──────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ advanceToNextActor()  │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ Check if Street       │
         │ Complete              │
         └───────────┬───────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ↓ Yes                 ↓ No
┌─────────────────┐   ┌─────────────────┐
│ advanceToNext   │   │ Next Player     │
│ Street()        │   │                 │
└─────────┬───────┘   └─────────┬───────┘
          │                     │
          └──────────┬──────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ Update State          │
         │ UI Re-render          │
         └───────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    PokerHandEngine State                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  players: PlayerState[]                                     │
│  ┌────────────────────────────────────────────────────┐   │
│  │ { position, stack, contributed, folded, isHero }   │   │
│  │ { position, stack, contributed, folded, isHero }   │   │
│  │ { position, stack, contributed, folded, isHero }   │   │
│  │ { position, stack, contributed, folded, isHero }   │   │
│  │ { position, stack, contributed, folded, isHero }   │   │
│  │ { position, stack, contributed, folded, isHero }   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  street: StreetState                                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │ phase: 'Preflop' | 'Flop' | 'Turn' | 'River'      │   │
│  │ pot: number                                        │   │
│  │ currentBet: number                                 │   │
│  │ lastAggressorIndex: number | null                 │   │
│  │ actionsThisStreet: HandAction[]                   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  actions: HandAction[]                                      │
│  ┌────────────────────────────────────────────────────┐   │
│  │ [ { id, position, action, betSize, potSize, ... } ]│   │
│  │ [ { id, position, action, betSize, potSize, ... } ]│   │
│  │ [ { id, position, action, betSize, potSize, ... } ]│   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  currentActorIndex: number                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Skip Function Algorithm

```
Input: position = 'BTN', action = 'Raise', betSize = 3
Current turn: UTG (index 2)

Step 1: Calculate indices
┌────────────────────────────────┐
│ currentIndex = 2 (UTG)         │
│ targetIndex = 5 (BTN)          │
└────────────────────────────────┘

Step 2: Auto-fold between
┌────────────────────────────────┐
│ Loop from 2 to 5:              │
│   idx = 2 (UTG)  → Fold        │
│   idx = 3 (HJ)   → Fold        │
│   idx = 4 (CO)   → Fold        │
│   idx = 5 (BTN)  → Stop        │
└────────────────────────────────┘

Step 3: Record actual action
┌────────────────────────────────┐
│ recordAction(BTN, Raise, 3)    │
└────────────────────────────────┘

Step 4: Advance turn
┌────────────────────────────────┐
│ getNextActivePlayerIndex(5)    │
│ → 0 (SB)                       │
└────────────────────────────────┘

Result:
┌────────────────────────────────┐
│ Actions recorded:              │
│ 1. UTG Fold (auto)             │
│ 2. HJ Fold (auto)              │
│ 3. CO Fold (auto)              │
│ 4. BTN Raise 3bb (manual)      │
│                                │
│ Next turn: SB                  │
└────────────────────────────────┘
```

## Street Completion Detection

```
┌───────────────────────────────────────────────────────┐
│           isStreetComplete() Decision Tree            │
└───────────────────────────────────────────────────────┘

Start
  │
  ↓
┌─────────────────────────┐
│ Active players <= 1?    │───Yes──→ ✅ Complete
└────────┬────────────────┘
         │ No
         ↓
┌─────────────────────────┐
│ Current bet = 0 AND     │
│ All players checked?    │───Yes──→ ✅ Complete
└────────┬────────────────┘
         │ No
         ↓
┌─────────────────────────┐
│ Last aggressor exists?  │───No───→ ❌ Not complete
└────────┬────────────────┘
         │ Yes
         ↓
┌─────────────────────────┐
│ All players matched     │
│ current bet?            │───No───→ ❌ Not complete
└────────┬────────────────┘
         │ Yes
         ↓
┌─────────────────────────┐
│ Next turn is last       │
│ aggressor?              │───Yes──→ ✅ Complete
└────────┬────────────────┘
         │ No
         ↓
    ❌ Not complete
```

## Position Order (Clockwise)

```
Preflop Start: UTG (index 2)
Postflop Start: SB (index 0)

    ┌────────────┐
    │   Table    │
    └────────────┘

         BTN (5)
            ↓
    CO (4) ← → SB (0)
            ↑
    HJ (3) ← → BB (1)
            ↑
         UTG (2)

Array: [SB, BB, UTG, HJ, CO, BTN]
Index:  0   1   2    3   4   5

Preflop Order:
  UTG → HJ → CO → BTN → SB → BB

Postflop Order:
  SB → BB → UTG → HJ → CO → BTN
```

## Action Types by Phase

```
┌──────────────────────────────────────────────────────┐
│                    Preflop Actions                   │
├──────────────────────────────────────────────────────┤
│ • Fold   - Discard hand                             │
│ • Call   - Match current bet                        │
│ • Raise  - Increase bet (2x, 3x, or custom)        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  Postflop Actions                    │
├──────────────────────────────────────────────────────┤
│ • Fold   - Discard hand                             │
│ • Check  - Pass action (if no bet)                 │
│ • Call   - Match current bet                        │
│ • Bet    - Make first bet (33%, 50%, 75%, 100%,    │
│            150%, All-in, or custom)                 │
│ • Raise  - Increase existing bet                    │
└──────────────────────────────────────────────────────┘
```

---

This architecture ensures:
✅ Clean separation of concerns
✅ Testable core logic
✅ Type-safe operations
✅ Easy AI integration (Phase 2)
✅ Scalable and maintainable code
