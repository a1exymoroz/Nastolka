#!/usr/bin/env node
// Moves the [Unreleased] section of CHANGELOG.md into a new dated version
// entry and starts a fresh, empty [Unreleased] section above it.
// Usage: node bump-changelog.mjs <oldVersion> <newVersion>

import { readFileSync, writeFileSync } from 'node:fs'

const [, , oldVersion, newVersion] = process.argv
if (!oldVersion || !newVersion) {
  console.error('Usage: bump-changelog.mjs <oldVersion> <newVersion>')
  process.exit(1)
}

const repo = 'a1exymoroz/Nastolka'
const changelogPath = 'CHANGELOG.md'
const date = new Date().toISOString().slice(0, 10)

let text = readFileSync(changelogPath, 'utf-8')

if (!text.includes('## [Unreleased]')) {
  console.error('CHANGELOG.md is missing an [Unreleased] section')
  process.exit(1)
}

text = text.replace(
  '## [Unreleased]\n',
  `## [Unreleased]\n\n## [${newVersion}] - ${date}\n`
)

const linkBlock =
  `[Unreleased]: https://github.com/${repo}/compare/v${newVersion}...HEAD\n` +
  `[${newVersion}]: https://github.com/${repo}/compare/v${oldVersion}...v${newVersion}`

text = text.replace(/\[Unreleased\]: .+/, linkBlock)

writeFileSync(changelogPath, text)
