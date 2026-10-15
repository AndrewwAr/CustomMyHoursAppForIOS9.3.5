# My Hours Custom — Agile Delivery Plan

## Product boundary

The application is a standalone time tracker hosted by GitHub Pages. It does not
connect to My Hours or another backend. Application records are stored in Safari
on the device under the GitHub Pages origin. A GitHub Pages deployment contains
only the application files and cannot write records back to the repository.

Target platform: iPad 2, iOS 9.3.5, Safari 9.

## Delivery loop

Every phase follows the same loop:

1. Implement the smallest complete vertical slice.
2. Run automated compatibility and data tests.
3. Deploy that version to GitHub Pages.
4. Run the phase checklist on the physical iPad.
5. Record defects and usability feedback.
6. Fix release-blocking defects before beginning the next phase.

Each phase is independently usable and keeps data created by earlier phases.
Schema migrations must be added whenever stored data changes.

## Compatibility rules from the first commit

- Plain HTML, CSS, and ECMAScript 5 JavaScript.
- No JavaScript modules, frameworks, service workers, or runtime CDN files.
- No arrow functions, classes, promises, `fetch`, optional chaining, or nullish
  coalescing.
- Use `XMLHttpRequest` only if a static request becomes necessary.
- Use conservative CSS with touch-sized controls and vendor prefixes where needed.
- Parse and format dates explicitly; do not depend on inconsistent legacy date
  parsing.
- Store records through one versioned storage module, never directly from views.
- Keep the app functional at 1024 x 768 in portrait and landscape.

## Phase 1 — Compatibility and persistence proof

### User outcome

The user can open a real deployed application on the iPad, create a test record,
close or refresh Safari, and see the record again.

### Tasks

- Create the static application structure and GitHub Pages deployment setup.
- Build a simple shell with header, navigation, status area, and version number.
- Add iOS home-screen metadata and local icons.
- Implement a namespaced, versioned `localStorage` adapter.
- Add a diagnostic screen showing JavaScript startup, storage availability,
  screen/orientation information, and the last startup error.
- Add a small form that saves, lists, and deletes test records.
- Add a "copy diagnostic report" fallback suitable for old Safari.
- Add automated checks that reject post-ES5 syntax and external runtime assets.
- Document the exact GitHub Pages URL and iPad test procedure.

### iPad acceptance test

- The page reaches a usable screen instead of remaining on a loader.
- A test record can be added and deleted with touch controls.
- The record survives refresh, closing/reopening Safari, and a device restart.
- Portrait and landscape remain usable.
- The diagnostic screen reports success without an uncaught error.

### Feedback gate

Do not build product features until the physical iPad passes this phase. Fix any
WebKit, storage, HTTPS, layout, or keyboard issue first.

## Phase 2 — Manual time-entry MVP

Before Phase 2, Phase 1.5 validates a persistent stopwatch on the physical iPad.
The test timer must count from saved timestamps, recover across reloads, Safari
backgrounding and device sleep, pause without advancing, resume from its saved
elapsed time, and reset safely without losing Phase 1 notes.

Implementation status: complete in version 2.0.0; physical iPad acceptance
passed.

### User outcome

The application is useful for basic daily time tracking without a live timer.

### Tasks

- Define version 1 entities: project, task, time entry, settings, and metadata.
- Add create/edit/archive flows for projects.
- Add create/edit/archive flows for tasks within a project.
- Add a manual entry form with date, project, task, duration, description, and
  billable status.
- Add today's entries, daily total, edit, duplicate, and delete actions.
- Add validation for required fields, invalid duration, and archived references.
- Seed optional example data only on an empty first launch.
- Add unit tests for duration arithmetic, validation, IDs, and persistence.

### iPad acceptance test

- Create a project and task, then add a time entry using only the touchscreen.
- Refresh Safari and confirm all records and totals remain correct.
- Edit, duplicate, and delete entries without navigation or keyboard problems.
- Archive a project without losing the readability of historical entries.

## Phase 3 — Reliable timer

Implementation status: complete in version 3.0.0; physical iPad acceptance
passed.

### User outcome

The user can start work, leave Safari or let the iPad sleep, return later, and
stop the timer with the correct elapsed time.

### Tasks

- Store timer start timestamps instead of relying on an in-memory counter.
- Add start, stop, cancel, and switch-project actions.
- Recalculate display time from the clock after resume or reload.
- Prevent multiple active timers.
- Handle clock changes and invalid timer state defensively.
- Convert a stopped timer into a normal time entry.
- Add prominent recovery UI when an unfinished timer is found.
- Add timer arithmetic and reload-recovery tests.

### iPad acceptance test

- Start a timer, lock the device, wait, unlock it, and stop the timer.
- Start a timer, close Safari, reopen the site, and recover it.
- Switch tasks and verify that the old timer becomes a correct completed entry.

## Phase 4 — Weekly workflow and reporting

### User outcome

The user can review and maintain an entire week efficiently.

### Tasks

- Add previous/current/next week navigation.
- Add a weekly timesheet grouped by project and task.
- Show daily, weekly, project, billable, and non-billable totals.
- Add filters for project and archived records.
- Provide a compact edit workflow appropriate for the iPad screen.
- Add overlap warnings for entries with explicit start/end times.
- Test week boundaries, leap years, daylight-saving changes, and rounding.

### iPad acceptance test

- Enter and edit a full test week.
- Navigate across month and year boundaries.
- Confirm all totals manually against known expected values.
- Verify both orientations with a realistically sized dataset.

## Phase 5 — Backup, restore, and export

### User outcome

The user can recover data if Safari storage is cleared or the iPad is replaced.

### Tasks

- Export a complete versioned JSON backup.
- Provide a copy/paste backup path compatible with old iOS.
- Import with validation, preview, and explicit replace confirmation.
- Reject corrupted or unsupported backups without changing existing data.
- Export a selected date range as CSV.
- Add a printable timesheet view.
- Track the last successful backup date and display reminders.
- Test round trips using empty, typical, large, and corrupted datasets.

### iPad acceptance test

- Export data, delete a test dataset, and restore it exactly.
- Verify that a failed import leaves current data untouched.
- Open or transfer the CSV using options available on the device.

## Phase 6 — Product hardening and release

### User outcome

The application feels dependable as a home-screen utility on the old iPad.

### Tasks

- Refine touch targets, forms, loading states, and confirmation messages.
- Add empty states, help text, and first-run guidance.
- Add global error capture and a recoverable safe mode.
- Test storage-quota behavior and larger datasets.
- Add schema migration fixtures and upgrade tests.
- Ensure deployments use cache-busted asset names or query versions.
- Test updating the GitHub Pages application without losing device data.
- Complete installation, backup, restoration, troubleshooting, and release notes.
- Perform a final pass with all external network dependencies disabled except the
  GitHub Pages origin.

### Release acceptance test

- Install from Safari using Add to Home Screen.
- Complete the core workflow without developer assistance.
- Upgrade from every previously deployed schema fixture.
- Confirm that refreshes and deployments never reset user records.
- Restore the final backup into a clean installation.

## Initial backlog after the core release

- Clients and project colors.
- Favorite/recent tasks.
- Search and advanced filtering.
- Configurable first day of week and time format.
- Tags and expenses.
- Monthly summaries and charts.
- Optional passcode/privacy screen.
- Import from additional CSV formats.

These items remain outside the core phases until physical-device feedback shows
which enhancements have the highest value.

## Definition of done for every phase

- The phase acceptance criteria pass on the physical iPad 2.
- No unsupported syntax or external runtime dependency is present.
- Existing stored data survives the upgrade.
- Error paths give a visible, actionable message rather than an endless loader.
- The deployed version and its known limitations are documented.
