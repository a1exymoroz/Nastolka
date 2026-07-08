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
