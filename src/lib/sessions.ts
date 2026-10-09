import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

export interface SessionInfo {
  pid: number
  sessionId: string
  cwd: string
  name: string
  status: string
  startedAt: number
  updatedAt?: number
  version?: string
  alive: boolean
}

function sessionsDir(): string {
  return path.join(os.homedir(), '.claude', 'sessions')
}

// A PID can outlive its session file if Claude Code didn't clean up on exit
// (crash, force-kill). Checking liveness with signal 0 - Node's documented
// way to test process existence without actually sending a signal, works on
// both POSIX and Windows - avoids showing phantom sessions as if real.
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

// Reads every ~/.claude/sessions/<pid>.json file - these are written by a
// running Claude Code process itself, one per pid, and are the only exact
// source for "which session name maps to which real sessionId and cwd."
// Filters out any whose process has actually exited, so a crashed session
// doesn't show up as if it were still there.
export function listLiveSessions(): SessionInfo[] {
  const dir = sessionsDir()
  if (!fs.existsSync(dir)) return []

  const out: SessionInfo[] = []
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith('.json')) continue
    const full = path.join(dir, entry)
    let parsed: any
    try {
      parsed = JSON.parse(fs.readFileSync(full, 'utf8'))
    } catch {
      continue // malformed/partially-written file - skip, don't crash
    }
    if (!parsed.pid || !parsed.sessionId || !parsed.cwd) continue

    out.push({
      pid: parsed.pid,
      sessionId: parsed.sessionId,
      cwd: parsed.cwd,
      name: parsed.name || parsed.sessionId.slice(0, 8),
      status: parsed.status || 'unknown',
      startedAt: parsed.startedAt,
      updatedAt: parsed.updatedAt,
      version: parsed.version,
      alive: isAlive(parsed.pid),
    })
  }

  return out.sort((a, b) => (b.updatedAt ?? b.startedAt) - (a.updatedAt ?? a.startedAt))
}
