<h1 align="center">ccwhere</h1>

<p align="center">
  See what every one of your Claude Code sessions is actually doing,<br/>
  from any terminal - no dashboard, no app, just your own session files.
</p>

---

## The problem

Running more than one Claude Code session at once, you lose track fast. `claude --continue` only knows the most recent session for the current folder - it can't tell your three concurrent sessions in the same directory apart. You end up opening tabs one at a time just to remember which one was doing what.

## Why this matters

Lost time here isn't typing, it's the few seconds, times however many
sessions you're juggling, spent alt-tabbing through terminal windows just
to remember which one is doing what. `ccwhere` collapses that into one
list, with names you chose yourself instead of session UUIDs you'd have
to copy out of a history file.

**Honest caveat:** the live summary isn't free. Every time a session's
transcript has actually grown, `ccwhere` spends a real call through your
own, already-logged-in `claude` CLI to regenerate it, so it's drawing on
your own usage, not some separate hosted service.

## What it does

```bash
ccwhere
```

Lists every running Claude Code session on your machine - its name, directory, status, how long since it was last active, and a real one-line summary of what it's actually working on. Pulled straight from your own `~/.claude/sessions/` and `~/.claude/projects/` files.

```bash
ccwhere show <session-name>    # full detail on one session
ccwhere resume <session-name>  # prints the real "claude --resume <id>" command
```

`resume` solves the actual friction: you know the session by its friendly name, not the UUID you'd need to type to get back into it.

## Install

```bash
npm install -g ccwhere
```

## How the summary works

`ccwhere` sends a recent slice of each session's own transcript through your own, already-logged-in `claude` CLI in headless mode (`claude -p`, with `--no-session-persistence` so these calls never show up as phantom sessions) and shows a real one-line summary of what that session is actually doing. No separate API key - if you can run Claude Code, you can run `ccwhere`. Summaries are cached on disk per session and only regenerated when a transcript has actually grown, so a session isn't re-summarized on every launch.

If the `claude` CLI isn't on your PATH, or a call fails or hangs, `ccwhere` falls back to peeking at the transcript directly - its first message and its most recent one - without reading the whole file, which can run into the hundreds of MB for a long session. No vector database, no other dependency: just your own Claude Code session files, read directly, either way.

## License

MIT
