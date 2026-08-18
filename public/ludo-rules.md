# Ludo — Complete Rule Specification

An implementation-oriented spec. Section 1–3 define the board model and coordinates,
4–9 define gameplay, 10 covers edge cases, 11 lists configurable variants.

---

## 1. Components

| Item | Count | Notes |
|---|---|---|
| Players | 2–4 | Standard game is 4 |
| Tokens per player | 4 | Also called pawns / pieces |
| Dice | 1 | Six-sided, values 1–6 |
| Colors | Red, Green, Yellow, Blue | Fixed seating order below |

Each player owns a **yard** (base), a **start square**, a **home column**, and the shared **main track**.

---

## 2. Board Model

### 2.1 Main track
- The main track is a loop of **52 squares**, indexed globally `0..51`, traversed in increasing index order (wrapping `51 → 0`).
- Movement direction is the same for all players.

### 2.2 Player anchors

| Player | Seat index | Start square | Home-entry square | Safe star |
|---|---|---|---|---|
| Red | 0 | 0 | 51 | 8 |
| Green | 1 | 13 | 12 | 21 |
| Yellow | 2 | 26 | 25 | 34 |
| Blue | 3 | 39 | 38 | 47 |

Formulas (seat `p` = 0..3):
```
START[p]       = 13 * p
HOME_ENTRY[p]  = (13 * p + 51) % 52      // last main-track square before turning in
SAFE_STAR[p]   = (13 * p + 8) % 52
```

### 2.3 Home column
- Each player has a private **home column of 6 squares**, entered after passing their home-entry square.
- The 6th square is **HOME** (the center triangle). Only own tokens may ever occupy a home column.

### 2.4 Relative position (recommended internal representation)

Store each token as `{ state, pos }` where:

| State | Meaning | `pos` range |
|---|---|---|
| `YARD` | Not yet in play | — |
| `TRACK` | On the main track | `0..50` (steps taken from own start square) |
| `HOME_COLUMN` | In own home column | `51..56` |
| `HOME` | Finished | `56` |

Conversion to a global track square:
```
globalSquare = (START[p] + pos) % 52     // valid only when state == TRACK
```

**Total path length = 57 steps.** A token needs `pos == 56` exactly to finish.

---

## 3. Safe Squares

A token standing on a safe square **cannot be captured**.

- The 4 **start squares**: `0, 13, 26, 39`
- The 4 **star squares**: `8, 21, 34, 47`
- Every square of a home column is inherently safe (unreachable by opponents).

```
SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47]
```

---

## 4. Setup and Turn Order

1. All 16 tokens begin in their owner's yard.
2. Each player rolls the die; highest roll starts. Re-roll ties among the tied players.
3. Play proceeds **clockwise** in seat order from the starting player.

---

## 5. A Turn

1. The active player rolls the die once.
2. The engine computes the set of **legal moves** for that roll.
3. If the set is empty, the turn ends immediately (see §5.3).
4. Otherwise the player must choose and execute exactly one legal move.
5. Extra-turn conditions are evaluated (see §5.2). If any apply, return to step 1; otherwise the turn passes to the next player.

### 5.1 Entering a token
- A token may leave the yard **only on a roll of 6**, and it is placed directly on its start square.
- Entering costs the whole roll — the 6 is not also spent on movement.
- Entry is illegal if the start square is already occupied by **two or more** of the player's own tokens (see §7.2). If occupied by one own token, entry is allowed only if stacking is permitted (§11).
- Entry onto a start square occupied by an opponent token **captures** it, since the start square's safety does not protect against the owner of that start square in most rulesets — see §11 for the toggle.

### 5.2 Extra turns
A player rolls again after:
- Rolling a **6**,
- **Capturing** an opponent token,
- Moving a token **into HOME**.

Extra turns stack but are always resolved one roll at a time.

### 5.3 No legal move
If no token can legally use the rolled value, the roll is forfeited and the turn ends — **even if the roll was a 6**.

### 5.4 Three consecutive sixes
If a player rolls three 6s in a row, the turn ends immediately and the **third** roll is void. (Strict variant: all three moves are undone and every token moved during those rolls returns to its pre-turn position. See §11.)

---

## 6. Movement

- A token moves forward exactly the number of squares rolled. There is no backward movement and no partial movement.
- Tokens **jump over** intervening squares; only the destination square matters for capture — except where blocking applies (§7.2).
- A move is legal only if the destination is legal (§6.1, §7).

### 6.1 Reaching HOME
- The final approach requires an **exact** roll: a token at `pos = 56 - n` may only finish on a roll of exactly `n`.
- Overshooting is **not** a legal move; the token stays put. If no other legal move exists, the turn is forfeited.

### 6.2 Entering the home column
A token entering the home column has passed its own home-entry square. Using relative `pos` this is automatic: any `pos > 50` is in the home column, so no special-case check is needed.

---

## 7. Interactions Between Tokens

### 7.1 Capture
- Landing exactly on a square occupied by a **single opponent token** sends that token back to its owner's yard.
- Capture is impossible when the destination is a **safe square** (§3).
- Capture is impossible against a **block** of two or more opponent tokens (§7.2).
- A capture grants an extra turn.
- A single move can capture at most one token.

### 7.2 Blocks (stacking)
- Two tokens of the **same color** on the same square form a **block**.
- An opponent token **may not land on or pass through** a block.
- A player's own tokens may always pass through their own block.
- Blocks may not form on a square that would exceed the stack limit (default 2).

### 7.3 Own tokens
- Own tokens may share a square up to the stack limit. Landing on a square already holding 2 of your own tokens is illegal by default.

---

## 8. Winning

- A player wins when all **4** of their tokens reach HOME.
- Standard play stops at the first winner. For ranked play, remaining players continue for 2nd/3rd place; last player standing is 4th.

---

## 9. Legal-Move Algorithm (reference)

```
legalMoves(player p, roll r):
  moves = []
  for each token t of p:
    if t.state == YARD:
        if r == 6 and canEnter(p): moves.add(ENTER(t))
        continue
    if t.state == HOME: continue
    newPos = t.pos + r
    if newPos > 56: continue                      // overshoot, illegal
    if newPos > 50:                               // home column
        if occupiedByOwn(p, newPos) >= STACK_LIMIT: continue
        moves.add(MOVE(t, newPos)); continue
    if pathBlocked(p, t.pos, newPos): continue    // §7.2
    dest = (START[p] + newPos) % 52
    if ownCount(p, dest) >= STACK_LIMIT: continue
    if opponentBlockAt(dest): continue
    moves.add(MOVE(t, newPos))
  return moves
```

Capture resolution after a committed move:
```
if dest not in SAFE_SQUARES and exactly one opponent token on dest:
    send that token to YARD
    grantExtraTurn()
```

---

## 10. Edge Cases

1. **Roll of 6 with all tokens in yard and start square blocked by own block** → no legal move, turn ends.
2. **Roll of 6 with all four tokens home-bound and none able to move** → forfeit, no re-roll.
3. **Capture on the last legal move of a triple-six sequence** → the third roll is void, so the capture does not stand under the strict variant.
4. **Two opponents on one square** — impossible unless stacking of mixed colors is enabled; default rules forbid it.
5. **Token on own start square** is safe from capture but still counts toward the stack limit for entry.
6. **Simultaneous win condition** cannot occur; turns are strictly sequential.
7. **Player with zero tokens on the board** simply needs a 6; no penalty applies for repeated failures.
8. **Disconnected / timed-out player** (online play): auto-play the first legal move, or skip if none. Define a max consecutive-skip count before forfeiting.

---

## 11. Configurable Variants

Expose these as a rules config object so the engine can support multiple house rules.

```json
{
  "playerCount": 4,
  "tokensPerPlayer": 4,
  "mainTrackLength": 52,
  "homeColumnLength": 6,
  "stackLimit": 2,

  "entryRollValues": [6],
  "extraTurnOnSix": true,
  "extraTurnOnCapture": true,
  "extraTurnOnHome": true,

  "tripleSixVoidsTurn": true,
  "tripleSixVoidsAllThreeMoves": true,

  "blockingEnabled": true,
  "blocksStopOpponentPassage": true,

  "safeSquares": [0, 8, 13, 21, 26, 34, 39, 47],
  "startSquareCapturesOnEntry": true,

  "exactRollToFinish": true,
  "mustCaptureIfPossible": false,
  "mustMoveIfLegalMoveExists": true,

  "playToLastPlace": false
}
```

Common alternates worth supporting:
- **Entry on 1 or 6** (`entryRollValues: [1, 6]`).
- **No blocking** — tokens pass freely, stacking still allowed.
- **All-tokens-out requirement** — a captured token must re-enter before others may move.
- **No safe stars** — only start squares are safe.
- **Two dice** — roll both, move one token twice or two tokens once each.

---

## 12. Quick Reference

| Question | Answer |
|---|---|
| Track length | 52 squares |
| Steps to finish | 57 |
| Roll to leave yard | 6 |
| Safe squares | 8 total |
| Extra turn | 6, capture, or reaching HOME |
| Three 6s | Turn void |
| Finishing | Exact roll required |
| Win | All 4 tokens HOME |
