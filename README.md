# My Hours Custom

A standalone, local-first time tracker targeting Safari on an iPad 2 running
iOS 9.3.5. The application is intentionally built with HTML, conservative CSS,
and ECMAScript 5 JavaScript. It has no runtime dependencies and does not connect
to the My Hours service.

Phase 1 proves that the deployed application starts and that Safari can persist
records locally before the time-tracking features are introduced.

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

Data is stored only in Safari's local storage. Clearing Safari history and
website data removes it. Backup and restore are scheduled for Phase 5.

See [AGILE_PLAN.md](AGILE_PLAN.md) for the full delivery roadmap.
