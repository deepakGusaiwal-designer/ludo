# Forest Ludo

A playable 3D ludo board — React for the interface, three.js for the board,
and a rules engine that depends on neither.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # rules tests
npm run build    # production bundle in dist/
```

## Layout

```
src/
  game/                 the rules — no three.js, no DOM, no timers
    constants.js        board geometry, colors, rule limits
    rules.js            legal moves, capture, blocks, placement
    rules.test.js       29 tests, run with `npm test`
  scene/                everything three.js
    LudoScene.js        owns the renderer and the animation API
    board.js            grid, yards, lanes, markings, center
    tokens.js           the sixteen pieces, keyed by rules id
    dice.js             cube, pips, roll animation
    forest.js           trees, rocks, grass, motes
    cameraRig.js        orbit + zoom
    materials.js        shared material cache
  hooks/
    useLudoScene.js     builds and disposes the scene
    useLudoGame.js      the turn machine
  components/           the HUD
legacy/
  ludo-standalone.html  the original single-file version
```

The split follows one rule: **`src/game` never imports `three`.** That is what
lets the rules run in Node with no renderer, so `rules.test.js` exercises the
shipped functions directly rather than a copy of them.

Data flows one way. `useLudoGame` holds the authoritative state, asks
`src/game` what is legal, and tells `LudoScene` what to animate. The scene
reports clicks back and never decides anything.

## How a turn runs

`useLudoGame` is a small state machine. Every animation returns a promise, so
each step is just an `await`:

| status     | meaning                                  |
| ---------- | ---------------------------------------- |
| `idle`     | waiting for a roll                       |
| `rolling`  | dice in the air                          |
| `choosing` | waiting for the player to pick a token   |
| `moving`   | a token is travelling, input locked      |
| `over`     | somebody won                             |

The authoritative game state lives in a ref, not React state, so an `await`
in the middle of a turn can never read a stale board. `publish()` copies it
into React state whenever the HUD needs to repaint.

## Positions

A token's position is one number counted from its **own** start square:

```
 -1        waiting in the yard
  0 .. 50  the shared ring
 51 .. 56  its own home lane
 56        home
```

The ring is 52 cells long but a token only walks 51 of them: every player
reaches its home lane entrance at relative step 50 and turns inward there.
Storing positions per player is what lets four players share one ring while
each finishes in its own lane — and it is why the tests check that step 51
lands on `HOME_LANES[color][0]` for all four colors.

## Rules

- a 6 is needed to bring a token out of the yard
- a 6 earns another roll, but three in a row forfeits the turn
- capturing an opponent earns another roll
- bringing a token home earns another roll
- the eight starred squares are safe from capture
- two tokens of one color form a block opponents cannot pass or land on
- home must be reached on an exact roll
- if a legal move exists the player must take it
- first player to bring all four tokens home wins

All four seats are human (hot-seat). There is no AI opponent.

## Controls

Click the dice or the **Roll dice** button, then click a highlighted token.
Drag to orbit, scroll to zoom.
