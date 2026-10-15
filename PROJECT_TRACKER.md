# Project Tracker

Last updated: 2026-10-16

## Delivery status

| Slice | Status | Physical iPad validation |
| --- | --- | --- |
| Phase 1 — compatibility and persistence proof | Complete | Passed |
| Phase 1.5 — persistent timer proof | Complete | Passed |
| Phase 2 — manual time-entry MVP | Implemented | Pending physical test |
| Phase 3 — timer-to-time-entry workflow | Not started | Not tested |
| Phase 4 — weekly timesheet and reporting | Not started | Not tested |
| Phase 5 — backup, restore, and export | Not started | Not tested |
| Phase 6 — product hardening | Not started | Not tested |

## Completed work

### Phase 1

- Created a static GitHub Pages application with zero runtime dependencies.
- Restricted runtime JavaScript to ECMAScript 5 for Safari on iOS 9.3.5.
- Added a touch-friendly layout for iPad portrait and landscape.
- Added versioned `localStorage` persistence.
- Added save, list, reload, and delete tests for local records.
- Added safe handling for unavailable, full, malformed, or unsupported storage.
- Added device and application diagnostics with a legacy copy fallback.
- Added automated storage, static-resource, and ES5 syntax checks.
- Configured and verified GitHub Pages deployment.
- Passed the complete checklist on the physical iPad 2.

### Phase 1.5

- Added a persistent stopwatch with start, pause, resume, and reset actions.
- Calculated elapsed time from saved timestamps instead of background intervals.
- Recovered the running timer after page reload, Safari restart, backgrounding,
  and device sleep.
- Added immediate refresh on page visibility and page-show events.
- Added timer status and elapsed time to the diagnostic report.
- Added a non-destructive schema migration that retained Phase 1 notes.
- Added automated timer arithmetic, pause/resume, clock rollback, and migration
  tests.
- Deployed version 1.1.0 and passed the complete timer checklist on the physical
  iPad 2.

## Phase 2 implementation

- [x] Add versioned entities for projects, tasks, and time entries.
- [x] Migrate Phase 1.5 data without losing notes or timer state.
- [x] Create, edit, archive, and restore projects.
- [x] Create, edit, archive, and restore project tasks.
- [x] Add manual time entries with date, project, task, duration, description,
  and billable status.
- [x] Show entries and total duration for the selected day.
- [x] Edit, duplicate, and delete time entries.
- [x] Preserve historical names when projects or tasks are archived.
- [x] Add validation and empty/error states.
- [x] Add automated domain, persistence, migration, DOM, and compatibility tests.
- [x] Complete an interactive browser test covering create, edit, duplicate,
  delete, archive, restore, historical names, and recalculated daily totals.
- [x] Deploy Phase 2 version 2.0.0 to GitHub Pages.
- [ ] Complete the Phase 2 physical iPad checklist.

Deployment commit: `7c2e5b2`

## Working agreement

Each slice is implemented, automatically verified, deployed to GitHub Pages, and
tested on the physical iPad before the next slice begins. A phase is marked
complete only after its physical-device acceptance test passes.
