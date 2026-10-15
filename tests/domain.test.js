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

projects = [
  { id: "p1", name: "Alpha", archived: false },
  { id: "p2", name: "Old", archived: true }
];
tasks = [
  { id: "t1", projectId: "p1", name: "Build", archived: false },
  { id: "t2", projectId: "p1", name: "Old task", archived: true },
  { id: "t3", projectId: "p2", name: "Other", archived: false }
];
entries = [
  { id: "e1", date: "2026-10-16", durationMinutes: 30, createdAt: "2026-10-16T08:00:00Z" },
  { id: "e2", date: "2026-10-16", durationMinutes: 75, createdAt: "2026-10-16T09:00:00Z" },
  { id: "e3", date: "2026-10-15", durationMinutes: 60, createdAt: "2026-10-15T08:00:00Z" }
];

assert.strictEqual(domain.activeProjects(projects).length, 1);
assert.strictEqual(domain.tasksForProject(tasks, "p1", "").length, 1);
assert.strictEqual(domain.tasksForProject(tasks, "p1", "t2").length, 2);
assert.strictEqual(domain.entriesForDate(entries, "2026-10-16")[0].id, "e2");
assert.strictEqual(domain.totalForDate(entries, "2026-10-16"), 105);
assert.strictEqual(domain.hasDuplicateName(projects, " alpha ", undefined, ""), true);
assert.strictEqual(domain.hasDuplicateName(tasks, "build", "p1", ""), true);
assert.strictEqual(domain.hasDuplicateName(tasks, "build", "p2", ""), false);

console.log("Domain tests passed.");
