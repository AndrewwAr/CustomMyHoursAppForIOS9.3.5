# Project Tracker

Last updated: 2026-10-16

## Delivery status

| Slice | Status | Physical iPad validation |
| --- | --- | --- |
| Phase 1 — compatibility and persistence proof | Complete | Passed |
| Phase 1.5 — persistent timer proof | Complete | Passed |
| Phase 2 — manual time-entry MVP | Complete | Passed |
| Phase 3 — timer-to-time-entry workflow | Complete | Passed |
| Phase 4 — weekly timesheet and reporting | Complete | Passed |
| Phase 5 — backup, restore, and export | In progress | Not tested |
| Phase 6 — product hardening | In progress | Not tested |

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
- [x] Complete the Phase 2 physical iPad checklist.

Deployment commit: `7c2e5b2`

Physical acceptance: passed on the iPad 2 running iOS 9.3.5.

## Phase 3 implementation

- [x] Upgrade stored time entries to exact-second durations without losing data.
- [x] Assign a running timer to a project and optional task.
- [x] Capture a timer description and billable status.
- [x] Preserve the timer assignment across reload, Safari restart, sleep, and
  backgrounding.
- [x] Pause and resume without changing the captured assignment.
- [x] Stop and save the elapsed timer as a time entry.
- [x] Cancel a timer without creating an entry.
- [x] Support the stop, select another assignment, and restart workflow.
- [x] Add automated migration, timer metadata, and timer-to-entry tests.
- [x] Complete interactive desktop browser verification.
- [x] Deploy Phase 3 version 3.0.0 to GitHub Pages.
- [x] Complete the Phase 3 physical iPad checklist.

Deployment commit: `b73c23e`

Physical acceptance: passed on the iPad 2 running iOS 9.3.5.

## Phase 4 implementation

- [x] Add previous, current, and next week navigation.
- [x] Show entries for the selected week with exact durations.
- [x] Show seven daily totals and the combined weekly total.
- [x] Group weekly totals by project and task.
- [x] Filter the week by project and billing status.
- [x] Open a weekly entry directly in the existing edit form.
- [x] Add date and weekly aggregation tests.
- [x] Complete interactive desktop browser verification.
- [x] Deploy Phase 4 version 4.0.0 to GitHub Pages.
- [x] Complete the Phase 4 physical iPad checklist.

Deployment commit: `5003118`

Physical acceptance: passed on the iPad 2 running iOS 9.3.5.

## Phase 5 implementation

- [ ] Export all local data as a JSON backup.
- [ ] Import a JSON backup with validation and confirmation.
- [ ] Restore data atomically without losing the current copy on failure.
- [ ] Export time entries as a CSV file for sharing or archiving.
- [x] Provide a selectable copy fallback for iOS 9 Safari, which cannot reliably
  download Blob URLs.
- [ ] Add backup, restore, and CSV tests.
- [ ] Complete interactive desktop browser verification.
- [x] Deploy Phase 5 version 5.0.0 to GitHub Pages.
- [ ] Complete the Phase 5 physical iPad checklist.

Deployment commit: `ba8e3fa`

## Phase 6 implementation

- [x] Add first-run guidance for an empty local workspace.
- [x] Add global error capture to the diagnostics report.
- [x] Add a recoverable safe-mode reload path.
- [x] Improve legacy-Safari guidance around local backups.
- [x] Run compatibility, DOM, and ES5 checks.
- [ ] Complete interactive desktop browser verification.
- [ ] Deploy Phase 6 version 6.0.0 to GitHub Pages.
- [ ] Complete the Phase 6 physical iPad checklist.

## Working agreement

Each slice is implemented, automatically verified, deployed to GitHub Pages, and
tested on the physical iPad before the next slice begins. A phase is marked
complete only after its physical-device acceptance test passes.
