---
name: session-chrono localStorage persistence
description: Session-scoped chrono state (start time, paused elapsed) is persisted to localStorage using keys egn_chrono_start_{id} and egn_chrono_paused_{id}
type: project
---

Session-scoped chrono state is persisted to localStorage via `egn_chrono_start_{sessionId}` (running) and `egn_chrono_paused_{sessionId}` (paused).

**Why:** Without persistence, closing and reopening the app lost all session timer state. After reopen, `_getOrCreateSession` created a fresh entry with status='paused' and elapsed=0, making the timer appear to reset on every reopen.

**How to apply:** When `_getOrCreateSession` creates a new in-memory entry, it immediately calls `restoreSessionFromStorage` which reads localStorage and populates status/elapsed/interval correctly. `startForSession` will no-op if the entry was restored as 'running' (status guard) or as 'paused' with saved elapsed (pausedElapsed > 0 guard) — this prevents the component's effect from resetting a restored timer to 0.
