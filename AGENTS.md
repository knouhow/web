<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# KNOUHow Web instructions for Codex

Before working in this repository, read and follow `web-config/ai/AGENTS.md`. Codex does not treat a Claude-style `@path` line as an automatic import, so open that file explicitly. If it is missing, initialize the configured submodule from the repository root:

```powershell
git -c submodule.web-config.update=checkout submodule update --init web-config
```

If the submodule cannot be initialized, report that and do not make code changes based on missing project rules.
