# Scripts Directory

Collection of utility scripts for the Thermo-App project.

## Auto-Shutdown Wrapper (`dev-timed`)

Automatically terminates long-running development processes after a specified timeout. Useful for preventing memory leaks and resource buildup on memory-constrained systems.

### Usage

**Basic syntax:**
```bash
./scripts/dev-timed [timeout_minutes] <command>
```

**Examples:**
```bash
# Next.js dev server with 60-minute timeout (default)
./scripts/dev-timed npm run dev

# Next.js dev server with 30-minute timeout
./scripts/dev-timed 30 npm run dev

# Long-running script with 2-hour timeout
./scripts/dev-timed 120 npx tsx scripts/analysis/long-analysis.ts

# Database shell with 60-minute timeout
./scripts/dev-timed ./scripts/db/psql-direct.sh
```

### NPM Shortcuts

Pre-configured shortcuts in `package.json`:

```bash
npm run dev:timed        # Next.js dev server, 60-minute timeout
npm run dev:timed-30     # Next.js dev server, 30-minute timeout
npm run dev:timed-120    # Next.js dev server, 2-hour timeout
npm run db:psql-timed    # Database shell, 60-minute timeout
```

### Features

- **Automatic cleanup:** Gracefully terminates process and all child processes
- **Progress updates:** Shows elapsed time every 15 minutes
- **Clean shutdown:** SIGTERM first, then SIGKILL if needed
- **Process group handling:** Kills entire process tree (prevents orphaned processes)
- **Interrupt handling:** Ctrl+C cleanly shuts down monitored process

### When to Use

**Recommended for:**
- Next.js dev server (`npm run dev`) - prevents memory leaks during long sessions
- Database shells (`psql`) - prevents forgotten connections
- Long-running TypeScript scripts (`npx tsx`) - sets hard time limits

**Not needed for:**
- Short-lived commands (build, lint, test)
- Production processes (use proper process managers)
- Commands that naturally terminate

### Output Example

```bash
$ npm run dev:timed

=== Dev-Timed Wrapper ===
Command:  npm run dev
Timeout:  60 minutes
Started:  2025-11-19 15:30:00
=========================

Process started with PID: 12345
Will auto-shutdown at: 16:30:00

> thermo-app@1.0.0 dev
> next dev

   ▲ Next.js 16.0.3
   - Local:        http://localhost:3000
   - ready started server on 0.0.0.0:3000, url: http://localhost:3000

[15:45:00] Running for 15m | 45m remaining
[16:00:00] Running for 30m | 30m remaining
[16:15:00] Running for 45m | 15m remaining

=== TIMEOUT REACHED ===
Process has been running for 60 minutes
Auto-shutdown initiated at: 16:30:00
=======================

Cleaning up process 12345...
Process terminated
Total runtime: 60 minutes
```

### How It Works

1. Starts command in background
2. Tracks process ID and start time
3. Monitors process every 10 seconds
4. Shows progress every 15 minutes
5. At timeout: sends SIGTERM → waits 5s → sends SIGKILL if still running
6. Cleans up PID file and exits

### Troubleshooting

**Process doesn't terminate:**
- Script kills entire process group, including child processes
- If process persists, check for orphaned processes: `ps aux | grep node`

**Timeout not working:**
- Verify script is executable: `ls -l scripts/dev-timed`
- Should show: `-rwxr-xr-x` (x = executable)
- If not: `chmod +x scripts/dev-timed`

**Can't use with complex commands:**
- Wrap command in quotes: `./scripts/dev-timed 60 "npm run dev && echo done"`
- Or create a wrapper script

## Subdirectories

- `db/` - Database utilities, import scripts, migrations (see `db/README.md`)
- `analysis/` - Data analysis scripts (see `analysis/README.md`)
- `ai/` - Future: AI/ML integration scripts

## Related Documentation

- Global memory management: `~/.claude/CLAUDE.md` (mem-daemon, mem-restart commands)
- Database connection: `scripts/db/README.md` (psql-direct.sh, psql-pooled.sh)
- Project setup: `.claude/CLAUDE.md` (project-specific configuration)
