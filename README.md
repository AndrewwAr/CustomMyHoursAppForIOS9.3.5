# My Hours Custom

A standalone, local-first time tracker targeting Safari on an iPad 2 running
iOS 9.3.5. The application is intentionally built with HTML, conservative CSS,
and ECMAScript 5 JavaScript. It has no runtime dependencies and does not connect
to the My Hours service.

Phase 1 proves that the deployed application starts and that Safari can persist
records locally. Phase 1.5 adds a persistent stopwatch to verify accurate timing
across reloads, Safari backgrounding, and device sleep before full time-tracking
features are introduced. Phase 2 adds manual time tracking. Phase 3 connects the
persistent timer to projects, tasks, and exact-second time entries. Phase 4 adds
weekly navigation, daily totals, filters, and edit access from the weekly view.
Phase 5 adds local JSON backup, restore, and CSV export.
Phase 6 also combines the live timer and Today workflow on one screen.

## Phase 5 physical iPad test

1. Open **Diagnostics** and export a JSON backup. On iOS 9, copy the selected
   text into Notes or email; desktop browsers may download the file directly.
2. Export CSV and confirm the generated text contains the time-entry columns.
3. Add a new note or entry, then import the JSON backup and confirm the prior
   data is restored.
4. Try importing an invalid text file and confirm it is rejected without
   changing the current data.

## Run locally

Serve the repository over HTTP rather than opening `index.html` as a file:

```powershell
npx.cmd http-server . -c-1
```

Then open the displayed URL in a browser.

## Verify

Install development dependencies once, then run all checks:

```powershell
npm.cmd install
npm.cmd test
```

The checks exercise the storage layer, confirm the page has no external runtime
dependencies, and parse all project JavaScript as ECMAScript 5.

## Publish with GitHub Pages

1. Create a GitHub repository and push this directory to its default branch.
2. Open **Settings > Pages** in the repository.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the default branch and the `/ (root)` folder, then save.
5. Open the URL shown by GitHub after the deployment completes.

Keep the GitHub Pages hostname and repository name unchanged after entering real
data. Safari storage belongs to the website origin; moving the site to another
hostname will make the old data unavailable at the new address.

## Phase 1 physical iPad test

1. Open the GitHub Pages URL in Safari on the iPad.
2. Confirm the green compatibility message appears.
3. Save a note and refresh the page.
4. Close Safari, reopen it, and confirm the note remains.
5. Rotate the iPad and test portrait and landscape.
6. Open Diagnostics and copy the report if anything fails.
7. Restart the iPad and confirm the note remains.

## Phase 1.5 physical iPad timer test

1. Open **Timer** and start the timer.
2. Press Home, wait one minute, return, and verify the elapsed time advanced.
3. Lock the iPad, wait one minute, unlock it, and verify the elapsed time advanced.
4. Refresh while the timer is running and verify that it continues.
5. Close Safari, reopen the page, and verify that the timer continues.
6. Pause the timer and verify that it stops increasing.
7. Resume it, verify that it continues from the saved value, and then reset it.

## Phase 2 physical iPad test

1. Open **Projects** and create a project.
2. Add a task to that project.
3. Edit both names and verify the changes in the project list.
4. Open **Today** and add a 1 hour 30 minute entry with a description.
5. Confirm the daily total reads `1h 30m` after refreshing Safari.
6. Edit the entry, duplicate it, and confirm the total changes correctly.
7. Delete the duplicate and confirm the total returns to the expected value.
8. Select another date, add an entry, then return to today.
9. Archive the task and project and confirm historical entries retain their
   names and durations.
10. Restore the project and task and confirm they can be selected again.
11. Verify that the timer test and the original storage-test notes still work.

## Phase 3 physical iPad test

1. Open **Timer**, select a project and task, add a description, and start it.
2. Background Safari or lock the iPad, wait, and verify the elapsed time advances.
3. Refresh Safari and confirm the assignment and elapsed time recover.
4. Pause, wait, resume, then select **Stop & save**.
5. Open **Today** and verify the entry includes the exact elapsed seconds.
6. Start another timer, cancel it, and verify no time entry is created.
7. Stop a timer, select another project/task, and start the next timer.

## Phase 4 physical iPad test

1. Open **Week** and verify the date range, seven daily totals, grouped totals,
   and weekly total.
2. Use Previous week, Next week, and Current week.
3. Filter by project, billable, and non-billable entries.
4. Tap **Edit** on a weekly entry, save it in Today, then return to Week and
   verify the totals changed.

Data is stored only in Safari's local storage. Clearing Safari history and
website data removes it. Backup and restore are scheduled for Phase 5.

See [AGILE_PLAN.md](AGILE_PLAN.md) for the full delivery roadmap.
