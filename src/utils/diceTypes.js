export const DICE_TYPES = ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20']

export const DICE_LABELS = {
  d2: 'D2 (coin)',
  d4: 'D4',
  d6: 'D6',
  d8: 'D8',
  d10: 'D10',
  d12: 'D12',
  d20: 'D20',
}

export function getDiceSides(diceType) {
  const match = diceType.match(/^d(\d+)$/)
  return match ? Number(match[1]) : 6
}

/**
 * Pick the best-fitting die for a number of games: the smallest die whose
 * face count divides evenly (so every game gets the same number of faces),
 * or failing that, the smallest die with at least one face per game.
 */
export function pickDiceTypeForGameCount(gameCount, diceTypes) {
  const exactMultiple = diceTypes.find((type) => getDiceSides(type) % gameCount === 0)
  if (exactMultiple) {
    return exactMultiple
  }
  const sufficient = diceTypes.find((type) => getDiceSides(type) >= gameCount)
  return sufficient ?? diceTypes[diceTypes.length - 1]
}

/** Which game (by array index) a rolled value belongs to — splits the die's
 * faces into `gameCount` even ranges, in array order. */
export function gameIndexForDiceValue(gameCount, sides, value) {
  const index = Math.floor(((value - 1) * gameCount) / sides)
  return Math.min(index, gameCount - 1)
}

/** Build the full "value → game" legend for a fixed game order. */
export function buildDiceLegend(games, diceType) {
  const sides = getDiceSides(diceType)
  return Array.from({ length: sides }, (_, i) => {
    const value = i + 1
    return { value, game: games[gameIndexForDiceValue(games.length, sides, value)] }
  })
}

/**
 * Reorder survivor games so the game that actually won lands in the exact
 * slot the (already-simulated) roll will show — keeps the pre-roll legend
 * truthful even though the roll itself no longer decides the winner.
 */
export function orderGamesForKnownResult(games, winnerGameId, diceType, landedValue) {
  const sides = getDiceSides(diceType)
  const winner = games.find((game) => game.gameId === winnerGameId)
  const others = games.filter((game) => game.gameId !== winnerGameId)
  if (!winner) {
    return games
  }
  const targetIndex = gameIndexForDiceValue(games.length, sides, landedValue)
  const ordered = [...others]
  ordered.splice(Math.min(targetIndex, ordered.length), 0, winner)
  return ordered
}
