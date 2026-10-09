import * as fs from 'node:fs'
import * as path from 'node:path'

// If this session's directory is using wrap-it-up (github.com/thisismairaj/
// wrap-it-up), its .claude-brain/hot.md is a real, curated summary of what
// that project is and what the last session there actually did - a much
// better answer than guessing from raw transcript text. Pure bonus: ccwhere
// works the same without it, just falls back to transcript peeking.
export function readHotBrain(cwd: string): string | null {
  const p = path.join(cwd, '.claude-brain', 'hot.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}

// First real paragraph of hot.md, not its "# hot - ..." title line - a
// short one-line summary suitable for a table cell.
export function hotBrainSummary(cwd: string, maxLen = 160): string | null {
  const content = readHotBrain(cwd)
  if (!content) return null

  const lines = content.split('\n').map((l) => l.trim())
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const oneLine = line.replace(/\s+/g, ' ')
    return oneLine.length > maxLen ? oneLine.slice(0, maxLen - 1).trimEnd() + '…' : oneLine
  }
  return null
}
