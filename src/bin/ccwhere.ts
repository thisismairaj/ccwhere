#!/usr/bin/env node
import { listLiveSessions, type SessionInfo } from '../lib/sessions.js'
import { peekTranscript } from '../lib/transcript.js'
import { hotBrainSummary, readHotBrain } from '../lib/brain.js'
import { renderTable, timeAgo, type Row } from '../lib/format.js'

function fail(msg: string): never {
  process.stderr.write(`${msg}\n`)
  process.exit(1)
}

// The one-line "what it's doing" for a session. hot.md is written per
// PROJECT, not per session - if two live sessions share a directory, it
// can't tell them apart, and using it for both would show identical,
// misleading text for genuinely different sessions. So: hot.md only when
// this session is the sole live one in its directory (then it's accurate
// and more curated than a raw transcript guess); transcript peeking
// (always session-specific) whenever a directory has more than one.
function describeSession(s: SessionInfo, sessionsInSameCwd: number): string {
  if (sessionsInSameCwd === 1) {
    const brainLine = hotBrainSummary(s.cwd)
    if (brainLine) return brainLine
  }

  const t = peekTranscript(s.cwd, s.sessionId)
  if (t.lastMessage) return t.lastMessage
  if (t.firstUserMessage) return `(started) ${t.firstUserMessage}`
  return '(no messages found)'
}

function cmdList(): void {
  const sessions = listLiveSessions().filter((s) => s.alive)

  const cwdCounts = new Map<string, number>()
  for (const s of sessions) cwdCounts.set(s.cwd, (cwdCounts.get(s.cwd) ?? 0) + 1)

  const rows: Row[] = sessions.map((s) => ({
    name: s.name,
    cwd: s.cwd,
    status: s.status,
    lastActive: timeAgo(s.updatedAt ?? s.startedAt),
    doing: describeSession(s, cwdCounts.get(s.cwd) ?? 1),
  }))
  process.stdout.write(renderTable(rows) + '\n')
}

function cmdShow(name: string): void {
  const sessions = listLiveSessions()
  const s = sessions.find((x) => x.name === name)
  if (!s) fail(`No session named "${name}". Run "ccwhere" with no arguments to list them.`)

  console.log(`${s!.name}  (${s!.alive ? 'running' : 'not running - stale entry'})`)
  console.log(`  directory:  ${s!.cwd}`)
  console.log(`  status:     ${s!.status}`)
  console.log(`  pid:        ${s!.pid}`)
  console.log(`  sessionId:  ${s!.sessionId}`)
  console.log(`  started:    ${new Date(s!.startedAt).toLocaleString()}`)
  if (s!.updatedAt) console.log(`  updated:    ${new Date(s!.updatedAt).toLocaleString()}`)

  const brain = readHotBrain(s!.cwd)
  if (brain) {
    console.log('\n--- hot.md (this project\'s wrap-it-up context bridge) ---\n')
    console.log(brain.trim())
    return
  }

  const t = peekTranscript(s!.cwd, s!.sessionId)
  console.log('\n--- transcript ---\n')
  if (t.firstUserMessage) console.log(`  started with:  ${t.firstUserMessage}`)
  if (t.lastMessage) console.log(`  most recent (${t.lastMessageRole}):  ${t.lastMessage}`)
  if (!t.firstUserMessage && !t.lastMessage) console.log('  (no messages found in transcript)')
}

function cmdResume(name: string): void {
  const sessions = listLiveSessions()
  const s = sessions.find((x) => x.name === name)
  if (!s) fail(`No session named "${name}". Run "ccwhere" with no arguments to list them.`)

  console.log(`claude --resume ${s!.sessionId}`)
}

function cmdHelp(): void {
  console.log(`ccwhere - see what every one of your Claude Code sessions is actually doing

Usage:
  ccwhere                 List all running sessions, with a one-line summary of each
  ccwhere show <name>     Full detail on one session (directory, status, context)
  ccwhere resume <name>   Print the real "claude --resume <sessionId>" command for a session
  ccwhere --help          Show this help
`)
}

function main(): void {
  const [, , cmd, arg] = process.argv

  switch (cmd) {
    case undefined:
      return cmdList()
    case 'show':
      if (!arg) fail('Usage: ccwhere show <session-name>')
      return cmdShow(arg)
    case 'resume':
      if (!arg) fail('Usage: ccwhere resume <session-name>')
      return cmdResume(arg)
    case '--help':
    case '-h':
    case 'help':
      return cmdHelp()
    default:
      fail(`Unknown command: ${cmd}\nRun "ccwhere --help" for usage.`)
  }
}

main()
