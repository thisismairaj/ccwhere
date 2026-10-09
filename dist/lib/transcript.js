import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
// Claude Code sanitizes a working directory into its ~/.claude/projects/
// folder name by replacing every `:` and path separator with `-` - e.g.
// `D:\data-lab2` -> `D--data-lab2`, `D:\Normies\normies-backend` ->
// `D--Normies-normies-backend`. Confirmed against several real folders,
// not guessed.
export function projectDirFor(cwd) {
    return cwd.replace(/[:\\/]/g, '-');
}
export function transcriptPath(cwd, sessionId) {
    return path.join(os.homedir(), '.claude', 'projects', projectDirFor(cwd), `${sessionId}.jsonl`);
}
function extractText(line) {
    if (line.isMeta)
        return null;
    if (line.type !== 'user' && line.type !== 'assistant')
        return null;
    const msg = line.message;
    if (!msg)
        return null;
    let text;
    if (typeof msg.content === 'string') {
        text = msg.content;
    }
    else if (Array.isArray(msg.content)) {
        const block = msg.content.find((b) => b.type === 'text' && typeof b.text === 'string');
        text = block?.text;
    }
    if (!text)
        return null;
    const trimmed = text.trim();
    // Skip synthetic/wrapper content - real human/assistant text doesn't
    // start with a system-reminder or command-output wrapper tag.
    if (trimmed.startsWith('<'))
        return null;
    if (trimmed.length === 0)
        return null;
    return { role: line.type, text: trimmed };
}
function truncate(s, max = 160) {
    const oneLine = s.replace(/\s+/g, ' ').trim();
    return oneLine.length > max ? oneLine.slice(0, max - 1).trimEnd() + '…' : oneLine;
}
// Reads bounded chunks from the start and end of a (possibly huge)
// transcript file rather than loading it whole - a session can run for
// hours and produce a multi-hundred-MB .jsonl, and all we need is one
// message from each end.
export function peekTranscript(cwd, sessionId) {
    const file = transcriptPath(cwd, sessionId);
    if (!fs.existsSync(file))
        return {};
    const result = {};
    const fd = fs.openSync(file, 'r');
    try {
        const size = fs.fstatSync(fd).size;
        const headSize = Math.min(size, 65536);
        const headBuf = Buffer.alloc(headSize);
        fs.readSync(fd, headBuf, 0, headSize, 0);
        for (const line of headBuf.toString('utf8').split('\n')) {
            if (!line.trim())
                continue;
            try {
                const parsed = extractText(JSON.parse(line));
                if (parsed?.role === 'user') {
                    result.firstUserMessage = truncate(parsed.text);
                    break;
                }
            }
            catch {
                // partial/invalid line (likely truncated at the chunk boundary) - skip
            }
        }
        const tailSize = Math.min(size, 262144);
        const tailBuf = Buffer.alloc(tailSize);
        fs.readSync(fd, tailBuf, 0, tailSize, size - tailSize);
        const tailLines = tailBuf.toString('utf8').split('\n');
        for (let i = tailLines.length - 1; i >= 0; i--) {
            const line = tailLines[i];
            if (!line.trim())
                continue;
            try {
                const parsed = extractText(JSON.parse(line));
                if (parsed) {
                    result.lastMessage = truncate(parsed.text);
                    result.lastMessageRole = parsed.role;
                    break;
                }
            }
            catch {
                // partial line at the chunk's own start boundary - skip
            }
        }
    }
    finally {
        fs.closeSync(fd);
    }
    return result;
}
