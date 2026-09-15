// A "token set" is the palette of unique game pieces belonging to one game
// (e.g. the Everdell critters) — each token has a stable `id` so a player's
// actual in-game piece can be looked up directly instead of guessed, and a
// shape/color for rendering it (an SVG path + its own viewBox, since each
// piece's source art keeps its own coordinate space).
export const TOKEN_SETS = {
  everdell: [
    {
      id: 'red',
      viewBox: '24 36 263 357',
      color: '#de553c',
      path: 'M 38.00,85.00 L 24.00,104.00 L 43.00,128.00 L 25.00,195.00 L 24.00,241.00 L 52.00,309.00 L 84.00,333.00 L 84.00,342.00 L 72.00,345.00 L 65.00,358.00 L 70.00,381.00 L 95.00,391.00 L 160.00,391.00 L 167.00,374.00 L 146.00,360.00 L 146.00,352.00 L 175.00,347.00 L 191.00,363.00 L 196.00,392.00 L 286.00,389.00 L 283.00,368.00 L 253.00,358.00 L 251.00,321.00 L 234.00,281.00 L 239.00,244.00 L 276.00,256.00 L 285.00,242.00 L 286.00,223.00 L 277.00,209.00 L 236.00,198.00 L 247.00,160.00 L 283.00,134.00 L 277.00,105.00 L 239.00,74.00 L 186.00,64.00 L 161.00,37.00 L 137.00,36.00 L 129.00,46.00 L 131.00,67.00 L 165.00,106.00 L 168.00,122.00 L 132.00,193.00 L 121.00,197.00 L 128.00,128.00 L 115.00,94.00 L 79.00,75.00 Z',
    },
    {
      id: 'ivory',
      viewBox: '344 55 250 339',
      color: '#efebec',
      path: 'M 506.00,55.00 L 488.00,56.00 L 476.00,105.00 L 459.00,101.00 L 407.00,56.00 L 375.00,56.00 L 347.00,72.00 L 355.00,103.00 L 421.00,150.00 L 421.00,177.00 L 432.00,202.00 L 429.00,215.00 L 396.00,248.00 L 382.00,286.00 L 384.00,303.00 L 415.00,330.00 L 415.00,345.00 L 381.00,346.00 L 355.00,312.00 L 344.00,312.00 L 346.00,356.00 L 360.00,375.00 L 384.00,388.00 L 417.00,392.00 L 449.00,383.00 L 460.00,393.00 L 497.00,393.00 L 498.00,384.00 L 479.00,369.00 L 481.00,355.00 L 494.00,353.00 L 528.00,392.00 L 575.00,392.00 L 569.00,375.00 L 544.00,364.00 L 543.00,352.00 L 555.00,322.00 L 554.00,291.00 L 583.00,274.00 L 593.00,240.00 L 585.00,227.00 L 575.00,226.00 L 559.00,246.00 L 541.00,247.00 L 531.00,234.00 L 530.00,216.00 L 538.00,205.00 L 572.00,195.00 L 582.00,179.00 L 540.00,136.00 L 525.00,80.00 Z',
    },
    {
      id: 'umber',
      viewBox: '982 59 264 336',
      color: '#614441',
      path: 'M 1098.00,65.00 L 1050.00,88.00 L 1049.00,109.00 L 1034.00,114.00 L 996.00,156.00 L 995.00,169.00 L 1010.00,172.00 L 1011.00,181.00 L 994.00,195.00 L 982.00,222.00 L 985.00,233.00 L 996.00,235.00 L 983.00,272.00 L 986.00,293.00 L 1008.00,295.00 L 1006.00,329.00 L 1013.00,350.00 L 1025.00,353.00 L 1035.00,343.00 L 1044.00,344.00 L 1032.00,378.00 L 1036.00,389.00 L 1107.00,393.00 L 1113.00,382.00 L 1102.00,355.00 L 1121.00,350.00 L 1128.00,356.00 L 1124.00,389.00 L 1129.00,394.00 L 1217.00,394.00 L 1221.00,370.00 L 1213.00,363.00 L 1189.00,361.00 L 1187.00,348.00 L 1196.00,301.00 L 1229.00,270.00 L 1230.00,241.00 L 1197.00,241.00 L 1195.00,229.00 L 1210.00,210.00 L 1240.00,190.00 L 1245.00,170.00 L 1237.00,163.00 L 1212.00,160.00 L 1185.00,127.00 L 1184.00,117.00 L 1217.00,113.00 L 1221.00,93.00 L 1196.00,76.00 L 1149.00,78.00 L 1134.00,59.00 Z',
    },
    {
      id: 'teal',
      viewBox: '654 60 286 342',
      color: '#357789',
      path: 'M 913.00,70.00 L 869.00,60.00 L 862.00,68.00 L 866.00,98.00 L 851.00,106.00 L 844.00,71.00 L 827.00,65.00 L 794.00,101.00 L 716.00,106.00 L 686.00,120.00 L 665.00,142.00 L 654.00,191.00 L 667.00,248.00 L 708.00,296.00 L 702.00,349.00 L 731.00,344.00 L 730.00,355.00 L 704.00,377.00 L 706.00,394.00 L 775.00,395.00 L 785.00,355.00 L 805.00,345.00 L 815.00,347.00 L 828.00,375.00 L 828.00,395.00 L 875.00,401.00 L 893.00,393.00 L 894.00,382.00 L 850.00,315.00 L 843.00,277.00 L 889.00,257.00 L 900.00,240.00 L 900.00,220.00 L 889.00,205.00 L 864.00,201.00 L 863.00,218.00 L 850.00,224.00 L 845.00,207.00 L 857.00,184.00 L 888.00,164.00 L 912.00,158.00 L 926.00,171.00 L 935.00,161.00 L 939.00,104.00 Z',
    },
  ],
}

/**
 * Meeple options a player can pick from for a given game, e.g. for the
 * history form's meeple picker — reuses `TOKEN_SETS` so a player's chosen
 * meeple always lines up with what the podium reveal can render (see
 * `assignTokens`). Only games with a known token set return options; every
 * other game returns an empty array until its own set is added here.
 *
 * Each option carries `gameKey` (the same key as `TOKEN_SETS`) rather than a
 * display name — callers resolve the localized meeple name via
 * `t(\`meeples.${gameKey}.${id}\`)` (see src/i18n/locales) since it's
 * user-facing text.
 */
export function getMeepleOptions(gameName) {
  const key = (gameName ?? '').trim().toLowerCase()
  const tokens = TOKEN_SETS[key]
  if (!tokens) return []
  return tokens.map((token) => ({ ...token, gameKey: key }))
}

function hashString(value) {
  let hash = 0
  for (const char of value ?? '') hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

/**
 * Assigns each player one token from `tokens`, so the podium (or anything
 * else) can show the actual piece a player used in the game rather than a
 * random one, while guaranteeing no two players share a token.
 *
 * A player carrying a `pieceId` that matches a token's `id` gets that exact
 * token. Everyone else gets one deterministically, picked by hashing their
 * name among the tokens nobody has claimed yet, so results stay stable
 * across re-renders without ever repeating a token.
 *
 * Returns a Map keyed by the player objects themselves, so callers look up
 * `assignment.get(player)` — works for any player shape, since identity is
 * all that's required.
 */
export function assignTokens(tokens, players, { getPieceId = (player) => player.pieceId, getName = (player) => player.name } = {}) {
  const tokenById = new Map(tokens.map((token) => [token.id, token]))
  const taken = new Set()
  const assignment = new Map()
  const unresolved = []

  for (const player of players) {
    const requested = tokenById.get(getPieceId(player))
    if (requested && !taken.has(requested.id)) {
      taken.add(requested.id)
      assignment.set(player, requested)
    } else {
      unresolved.push(player)
    }
  }

  for (const player of unresolved) {
    const free = tokens.filter((token) => !taken.has(token.id))
    if (free.length === 0) break // more players than tokens: leave unassigned
    const token = free[hashString(getName(player)) % free.length]
    taken.add(token.id)
    assignment.set(player, token)
  }

  return assignment
}
