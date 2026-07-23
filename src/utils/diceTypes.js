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
