<h1 align="center">ccwhere</h1>

<p align="center">
  See what every one of your Claude Code sessions is actually doing,<br/>
  from any terminal - no dashboard, no app, just your own session files.
</p>

---

## The problem

Running more than one Claude Code session at once, you lose track fast. `claude --continue` only knows the most recent session for the current folder - it can't tell your three concurrent sessions in the same directory apart. You end up opening tabs one at a time just to remember which one was doing what.

## What it does

```bash
ccwhere
```

Lists every running Claude Code session on your machine - its name, directory, status, how long since it was last active, and a real one-line summary of what it's actually working on. Pulled straight from your own `~/.claude/sessions/` and `~/.claude/projects/` files - no telemetry, no external service, nothing sent anywhere.

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

Two sources, in order of preference:

1. If the session's directory is using [wrap-it-up](https://github.com/thisismairaj/wrap-it-up), its `.claude-brain/hot.md` - a real, curated summary the session itself wrote - is used directly. Works great, but only when there's exactly one live session in that directory (a shared `hot.md` can't tell two sessions in the same folder apart).
2. Otherwise, `ccwhere` peeks at the session's own transcript - its first message and its most recent one - without reading the whole file, which can run into the hundreds of MB for a long session.

No API calls, no LLM summarization, no vector database. Just your own files, read directly.

## License

MIT
