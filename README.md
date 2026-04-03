# cpl — Claude Pipeline

Universal AI-assisted development pipeline for any project type: mobile, backend, frontend, fullstack, CLI, library.

## Installation

Install as a Claude Code plugin:
```bash
# Via Claude Code plugin system
/install-plugin path/to/cpl
```

## Project Setup

After installing the plugin, initialize a project:

```bash
# With explicit type and stack
~/.claude/plugins/cache/.../cpl/1.0.0/init.sh \
  --target-dir /path/to/project \
  --project-name "My App" \
  --type mobile \
  --stack "Kotlin + Compose + Koin"

# Auto-detect type from project files
~/.claude/plugins/cache/.../cpl/1.0.0/init.sh \
  --target-dir ~/my-project

# Store ai/ inline (no symlinks)
~/.claude/plugins/cache/.../cpl/1.0.0/init.sh \
  --target-dir ~/my-project \
  --inline
```

### Options
- `--target-dir` — target project (default: current directory)
- `--project-name` — project name (default: dirname)
- `--package-name` — base package (default: `com.example.app`)
- `--type` — project type: `mobile|backend|frontend|fullstack|cli|library` (auto-detect)
- `--stack` — tech stack, e.g. `"Kotlin + Compose + Koin"` (determined by `/cpl:new-project`)
- `--inline` — store ai/, CLAUDE.md inside project (no symlinks)
- `--force` — overwrite existing files
- `--force-ai` — overwrite ai/ artifacts (dangerous!)

### Auto-detection

| Marker | Type |
|---|---|
| `build.gradle.kts` + `AndroidManifest.xml` | mobile |
| `package.json` + `next.config.*` / `vite.config.*` | frontend |
| `package.json` + express/fastify/koa | backend |
| `Cargo.toml` + `[[bin]]` | cli |
| `pom.xml`, `go.mod`, `Cargo.toml`, `pyproject.toml` | backend |
| `build.gradle.kts` (without Android) | library |

## Pipeline

Each phase reads artifacts from previous phases and writes to its own. Phases run in separate chats — context passes through `ai/*.md` files.

### Quick Start
```
/cpl:new-project          # One-time setup: detect stack, create artifacts
/cpl:gather               # Collect context from project files
/cpl:kickoff [description] # Fast-track: context → requirements → tasks
```

### Main Pipeline
```
/cpl:gather → /cpl:product → /cpl:architect → /cpl:design → /cpl:ui-spec
  → /cpl:test-plan → /cpl:gen → /cpl:gen-tests → /cpl:code-review
  → /cpl:verify → /cpl:debug (if needed) → /cpl:release
```

### All Commands (28 skills)

#### Pipeline Phases
| Command | Model | Description |
|---------|-------|-------------|
| `/cpl:gather` | haiku | Collect context from files/logs/docs → `ai/context.md` |
| `/cpl:product` | opus | Requirements + user stories → `ai/requirements.md` |
| `/cpl:architect` | opus | Architecture + ADRs + trade-off comparison → `ai/architecture.md` |
| `/cpl:design` | opus | UX design + user flows → `ai/design.md` |
| `/cpl:ui-spec` | sonnet | UI state specs + components → `ai/ui_spec.md` |
| `/cpl:test-plan` | sonnet | Test strategy by layers → `ai/test_plan.md` |
| `/cpl:gen` | haiku | Client code generation with verification gates |
| `/cpl:gen-server` | haiku | Server/API code generation with verification gates |
| `/cpl:gen-tests` | haiku | Test generation per test plan |
| `/cpl:code-review` | sonnet | Code review + goal-backward verification → `ai/review.md` |
| `/cpl:debug` | sonnet | Diagnose + fix bugs → `ai/debug.md` |
| `/cpl:investigate` | sonnet | Systematic investigation without stacktrace → `ai/investigate.md` |

#### Post-MVP
| Command | Model | Description |
|---------|-------|-------------|
| `/cpl:refactor` | opus | Refactoring plan → `ai/refactor.md` |
| `/cpl:migrate` | sonnet | DB migration plan → `ai/migration.md` |
| `/cpl:security` | opus | Security audit (OWASP) → `ai/security.md` |
| `/cpl:api-diff` | haiku | Client/server API divergence check → `ai/api_diff.md` |
| `/cpl:changelog` | haiku | Changelog from git/impl_notes → `ai/changelog.md` |
| `/cpl:release` | sonnet | Pre-deploy checklist → `ai/release.md` |

#### Meta & Utilities
| Command | Model | Description |
|---------|-------|-------------|
| `/cpl:do` | haiku | Smart router — routes freeform text to the right phase |
| `/cpl:next` | haiku | Auto-determine next pipeline step |
| `/cpl:pause` | haiku | Save position for later resumption |
| `/cpl:resume` | haiku | Restore context from previous session |
| `/cpl:kickoff` | opus | Quick start: context → requirements → tasks |
| `/cpl:new-project` | opus | Initialize pipeline for a project |
| `/cpl:progress` | haiku | Status summary |
| `/cpl:verify` | haiku | Artifact validation + build check |
| `/cpl:delegate` | haiku | Delegate simple phases to local LLM |
| `/cpl:evolve` | opus | Self-improvement from accumulated learnings |

## Features

### Verification Gates
Code generation skills (`gen`, `gen-server`, `gen-tests`) run `verify_cmd` after each task. Commit only on success. 3 retry attempts before marking as BLOCKED.

### Deviation Rules
Clear boundaries for agent autonomy:
- **auto-fix**: broken imports, type mismatches → fix silently, log
- **auto-add**: validation, error handling → add and log
- **ask**: new DB tables, architecture changes → stop and ask

### TDD Mode (optional)
Enable `tdd: true` in `ai/status.md`. Code generation follows RED → GREEN → REFACTOR cycle.

### Goal-Backward Verification
Code review includes a pass checking that completed tasks actually achieve their goals — detecting stubs, unwired code, and placeholders.

### Trade-off Comparison
Architecture decisions require 2-3 alternatives with comparison tables before choosing.

### Wave Analysis
Task delegation analyzes dependencies and groups into parallel waves.

### Session Continuity
`/cpl:pause` saves position, `/cpl:resume` restores context — work across sessions.

### Auto-learnings
Debug fixes auto-append to `ai/gotchas.md`. Code generation reads gotchas before starting.

## Structure

```
cpl/
├── .claude-plugin/plugin.json    # Plugin metadata
├── package.json                  # npm metadata
├── init.sh                       # Project bootstrap
├── skills/                       # 28 skill definitions
│   ├── <phase>/SKILL.md
│   └── ...
├── references/                   # Shared reference docs
│   ├── routing-table.md
│   ├── project-profiles.md
│   ├── validation-checks.md
│   ├── deviation-rules.md
│   └── routine-checks.md
└── templates/                    # Project templates
    ├── CLAUDE.md.tmpl
    └── ai/*.md.tmpl
```

## License

MIT
