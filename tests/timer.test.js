"use strict";

var assert = require("assert");
var fs = require("fs");
var vm = require("vm");
var timerSource = fs.readFileSync("js/timer.js", "utf8");
var context = {};
var timer;

vm.createContext(context);
vm.runInContext(timerSource, context);

timer = context.MHTimer.start(null, 1000, {
  projectId: "p1", taskId: "t1", description: "Build", billable: true,
  startedDate: "2026-10-16"
});
assert.strictEqual(timer.status, "running");
assert.strictEqual(timer.projectId, "p1");
assert.strictEqual(context.MHTimer.getElapsed(timer, 11000), 10000);

timer = context.MHTimer.pause(timer, 16000);
assert.strictEqual(timer.status, "paused");
assert.strictEqual(context.MHTimer.getElapsed(timer, 999999), 15000);
assert.strictEqual(timer.description, "Build");

timer = context.MHTimer.start(timer, 20000);
assert.strictEqual(context.MHTimer.getElapsed(timer, 25000), 20000);
assert.strictEqual(timer.taskId, "t1");

timer = context.MHTimer.pause(timer, 30000);
assert.strictEqual(timer.elapsedMs, 25000);
assert.strictEqual(context.MHTimer.isValid(timer), true);
assert.strictEqual(context.MHTimer.isValid({ status: "running", elapsedMs: -1 }), false);

assert.strictEqual(context.MHTimer.getElapsed({
  status: "running",
  startedAtMs: 5000,
  elapsedMs: 2000,
  updatedAtMs: 5000
}, 4000), 2000);

console.log("Timer tests passed.");
