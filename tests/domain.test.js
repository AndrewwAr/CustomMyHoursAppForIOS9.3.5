"use strict";

var assert = require("assert");
var fs = require("fs");
var vm = require("vm");
var source = fs.readFileSync("js/domain.js", "utf8");
var context = {};
var domain;
var projects;
var tasks;
var entries;

vm.createContext(context);
vm.runInContext(source, context);
domain = context.MHDomain;

assert.strictEqual(domain.dateKey(new Date(2026, 9, 6)), "2026-10-06");
assert.strictEqual(domain.isValidDateKey("2026-02-28"), true);
assert.strictEqual(domain.isValidDateKey("2026-02-31"), false);
assert.strictEqual(domain.isValidDateKey("16-10-2026"), false);

assert.strictEqual(domain.parseDuration("1", "30").minutes, 90);
assert.strictEqual(domain.parseDuration("0", "1").valid, true);
assert.strictEqual(domain.parseDuration("0", "0").valid, false);
assert.strictEqual(domain.parseDuration("24", "1").valid, false);
assert.strictEqual(domain.parseDuration("1.5", "0").valid, false);
assert.strictEqual(domain.formatDuration(0), "0h 00m");
assert.strictEqual(domain.formatDuration(125), "2h 05m");
assert.strictEqual(domain.parseDurationSeconds("0", "0", "17").seconds, 17);
assert.strictEqual(domain.parseDurationSeconds("1", "2", "3").seconds, 3723);
assert.strictEqual(domain.parseDurationSeconds("24", "0", "1").valid, false);
assert.strictEqual(domain.formatDurationSeconds(3723), "1h 02m 03s");
assert.strictEqual(domain.formatDurationSeconds(3600), "1h 00m");
assert.strictEqual(domain.startOfWeek("2026-10-16"), "2026-10-12");
assert.strictEqual(domain.startOfWeek("2026-10-18"), "2026-10-12");
assert.strictEqual(domain.addDays("2026-10-31", 1), "2026-11-01");

projects = [
  { id: "p1", name: "Alpha", archived: false },
  { id: "p2", name: "Old", archived: true }
];
tasks = [
  { id: "t1", projectId: "p1", parentTaskId: null, name: "Build", archived: false },
  { id: "t2", projectId: "p1", parentTaskId: "t1", name: "Frontend", archived: true },
  { id: "t3", projectId: "p2", parentTaskId: null, name: "Other", archived: false }
];
entries = [
  { id: "e1", date: "2026-10-16", durationSeconds: 1800, createdAt: "2026-10-16T08:00:00Z" },
  { id: "e2", date: "2026-10-16", durationSeconds: 4500, createdAt: "2026-10-16T09:00:00Z" },
  { id: "e3", date: "2026-10-15", durationSeconds: 3600, createdAt: "2026-10-15T08:00:00Z" }
];

assert.strictEqual(domain.activeProjects(projects).length, 1);
assert.strictEqual(domain.tasksForProject(tasks, "p1", "").length, 1);
assert.strictEqual(domain.tasksForProject(tasks, "p1", "t2").length, 2);
assert.strictEqual(domain.childrenOfTask(tasks, "t1", true)[0].id, "t2");
assert.strictEqual(domain.descendantsOfTask(tasks, "t1").length, 1);
assert.strictEqual(domain.taskPath(tasks, "t2"), "Build / Frontend");
assert.strictEqual(domain.isDescendant(tasks, "t2", "t1"), true);
assert.strictEqual(domain.isDescendant(tasks, "t1", "t2"), false);
assert.strictEqual(domain.entriesForDate(entries, "2026-10-16")[0].id, "e2");
assert.strictEqual(domain.totalForDate(entries, "2026-10-16"), 6300);
assert.strictEqual(domain.sumDurationSeconds(entries), 9900);
assert.strictEqual(JSON.stringify(domain.dailyTotals(entries, "2026-10-15", 2)), JSON.stringify([3600, 6300]));
assert.strictEqual(domain.hasDuplicateName(projects, " alpha ", undefined, ""), true);
assert.strictEqual(domain.hasDuplicateName(tasks, "build", "p1", ""), true);
assert.strictEqual(domain.hasDuplicateName(tasks, "build", "p2", ""), false);

assert.deepStrictEqual(JSON.parse(JSON.stringify(domain.createTimerEntry({
  projectId: "p1", taskId: "t1", description: "Timed work", billable: true,
  startedDate: "2026-10-16"
}, 17234, "2026-10-16T10:00:00.000Z", "timer-entry", "2026-10-17"))), {
  id: "timer-entry", date: "2026-10-16", projectId: "p1", taskId: "t1",
  durationSeconds: 17, description: "Timed work", billable: true,
  createdAt: "2026-10-16T10:00:00.000Z", updatedAt: "2026-10-16T10:00:00.000Z"
});

console.log("Domain tests passed.");
