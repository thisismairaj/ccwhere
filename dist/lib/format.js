// Minimal ANSI helpers - no chalk/colorette dependency, this is a small
// enough surface to hand-roll and keep the package dependency-free.
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
export function colorForStatus(status) {
    if (status === 'busy')
        return YELLOW;
    if (status === 'idle')
        return DIM;
    if (status === 'shell')
        return GREEN;
    return RESET;
}
export function timeAgo(ms) {
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'just now';
    if (mins < 60)
        return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
// A plain bordered table - box-drawing characters, one color per status
// column, everything else left in the default terminal color so it stays
// readable regardless of theme. Deliberately simple for v0.1 - the shape
// to refine once there's a concrete "make it look like X" reference.
export function renderTable(rows) {
    if (rows.length === 0) {
        return `${DIM}No running Claude Code sessions found.${RESET}`;
    }
    const headers = ['SESSION', 'DIRECTORY', 'STATUS', 'LAST ACTIVE', 'WHAT IT\'S DOING'];
    const widths = headers.map((h, i) => {
        const colVals = rows.map((r) => [r.name, r.cwd, r.status, r.lastActive, r.doing][i]);
        return Math.max(h.length, ...colVals.map((v) => v.length));
    });
    // Cap the "doing" column so one long line doesn't blow out the table width.
    widths[4] = Math.min(widths[4], 70);
    const pad = (s, w) => (s.length > w ? s.slice(0, w - 1) + '…' : s.padEnd(w));
    const headerLine = `${BOLD}${headers.map((h, i) => pad(h, widths[i])).join('  ')}${RESET}`;
    const sepLine = `${DIM}${widths.map((w) => '─'.repeat(w)).join('  ')}${RESET}`;
    const lines = rows.map((r) => {
        const statusColor = colorForStatus(r.status);
        return [
            `${CYAN}${pad(r.name, widths[0])}${RESET}`,
            pad(r.cwd, widths[1]),
            `${statusColor}${pad(r.status, widths[2])}${RESET}`,
            `${DIM}${pad(r.lastActive, widths[3])}${RESET}`,
            pad(r.doing, widths[4]),
        ].join('  ');
    });
    return [headerLine, sepLine, ...lines].join('\n');
}
