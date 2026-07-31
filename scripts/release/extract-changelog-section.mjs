#!/usr/bin/env node
// Prints the body of a single version's section from CHANGELOG.md, for use
// as GitHub Release notes.
// Usage: node extract-changelog-section.mjs <version>

import { readFileSync } from 'node:fs'

const [, , version] = process.argv
if (!version) {
  console.error('Usage: extract-changelog-section.mjs <version>')
  process.exit(1)
}

const text = readFileSync('CHANGELOG.md', 'utf-8')
const heading = `## [${version}]`
const start = text.indexOf(heading)

if (start === -1) {
  console.log(`Release v${version}`)
  process.exit(0)
}

const bodyStart = text.indexOf('\n', start) + 1
const nextHeadingIndex = text.indexOf('\n## [', bodyStart)
const body = (nextHeadingIndex === -1 ? text.slice(bodyStart) : text.slice(bodyStart, nextHeadingIndex)).trim()

console.log(body || `Release v${version}`)
