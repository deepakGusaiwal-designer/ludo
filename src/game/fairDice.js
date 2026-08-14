/**
 * Fair Dice System with Yard Release Pity & Balanced Distribution.
 *
 * Prevents players from getting trapped in the yard with no 6s for long streaks,
 * ensuring every team gets a fair opportunity to release tokens and play.
 */

// Track consecutive non-6 rolls per color while trapped in yard
const yardPityCounters = {
  red: 0,
  green: 0,
  yellow: 0,
  blue: 0,
};

// Shuffled entropy bags per color for uniform distribution
const diceBags = {
  red: [],
  green: [],
  yellow: [],
  blue: [],
};

function fillAndShuffleBag(color) {
  // Balanced set of outcomes: [1, 2, 3, 4, 5, 6, 6] (giving slightly boosted 6 chance)
  const set = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6];
  for (let i = set.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [set[i], set[j]] = [set[j], set[i]];
  }
  diceBags[color] = set;
}

/**
 * Reset pity counters when starting a new match.
 */
export function resetFairDice() {
  for (const c of ["red", "green", "yellow", "blue"]) {
    yardPityCounters[c] = 0;
    diceBags[c] = [];
  }
}

/**
 * Roll dice fairly with Pity Guarantee for Yard Release.
 * @param {string} color Player color ("red", "green", "yellow", "blue")
 * @param {Array} tokens Current state tokens for this player
 */
export function getFairRoll(color, tokens = []) {
  if (!color || !yardPityCounters.hasOwnProperty(color)) {
    return 1 + Math.floor(Math.random() * 6);
  }

  // Count active tokens on board (not in yard and not finished)
  const activeTokensOnBoard = tokens.filter(
    (t) => t.color === color && t.position !== "yard" && !t.finished,
  ).length;

  const yardTokens = tokens.filter(
    (t) => t.color === color && t.position === "yard",
  ).length;

  // Pity Trigger: Player has yard tokens AND no active tokens on the board
  const needsYardRelease = yardTokens > 0 && activeTokensOnBoard === 0;

  let rolledValue = null;

  if (needsYardRelease) {
    const missCount = yardPityCounters[color];

    // Pity Guarantee: 5th miss -> 70% chance of 6, 6th miss -> 100% GUARANTEED 6
    if (missCount >= 5) {
      rolledValue = 6;
    } else if (missCount >= 4 && Math.random() < 0.7) {
      rolledValue = 6;
    }
  }

  // If pity wasn't triggered, pick from balanced entropy bag
  if (!rolledValue) {
    if (!diceBags[color] || diceBags[color].length === 0) {
      fillAndShuffleBag(color);
    }
    rolledValue = diceBags[color].pop();
  }

  // Update pity counter
  if (rolledValue === 6) {
    yardPityCounters[color] = 0;
  } else if (needsYardRelease) {
    yardPityCounters[color] += 1;
  }

  return rolledValue;
}
