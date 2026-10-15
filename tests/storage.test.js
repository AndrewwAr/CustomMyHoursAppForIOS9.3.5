"use strict";

var assert = require("assert");
var fs = require("fs");
var vm = require("vm");
var storageSource = fs.readFileSync("js/storage.js", "utf8");

function MemoryStorage() {
  this.values = {};
}

MemoryStorage.prototype.getItem = function (key) {
  return Object.prototype.hasOwnProperty.call(this.values, key) ? this.values[key] : null;
};

MemoryStorage.prototype.setItem = function (key, value) {
  this.values[key] = String(value);
};

MemoryStorage.prototype.removeItem = function (key) {
  delete this.values[key];
};

function loadStorageModule() {
  var context = {};
  vm.createContext(context);
  vm.runInContext(storageSource, context);
  return context.MHStorage;
}

function run() {
  var module = loadStorageModule();
  var storage = new MemoryStorage();
  var repository = new module.StorageRepository(storage);
  var data;
  var loaded;

  assert.strictEqual(repository.checkAvailability().available, true);
  data = repository.load();
  assert.strictEqual(data.schemaVersion, 4);
  assert.strictEqual(data.records.length, 0);
  assert.strictEqual(data.timer, null);
  assert.strictEqual(data.projects.length, 0);
  assert.strictEqual(data.tasks.length, 0);
  assert.strictEqual(data.timeEntries.length, 0);

  data.records.push({
    id: "note-1",
    note: "Persistence works",
    createdAt: "2026-10-15T20:00:00.000Z"
  });
  repository.save(data);
  loaded = repository.load();
  assert.strictEqual(loaded.records.length, 1);
  assert.strictEqual(loaded.records[0].note, "Persistence works");
  assert.ok(loaded.metadata.createdAt);
  assert.ok(loaded.metadata.updatedAt);

  storage.setItem(module.storageKey, "not-json");
  assert.throws(function () {
    repository.load();
  }, /not valid JSON/);

  storage.setItem(module.storageKey, JSON.stringify({ schemaVersion: 99, records: [] }));
  assert.throws(function () {
    repository.load();
  }, /unsupported format/);

  assert.strictEqual(module.validateData(module.createEmptyData()), true);
  assert.strictEqual(module.validateData({ schemaVersion: 4, records: [{}], timer: null, projects: [], tasks: [], timeEntries: [], settings: {}, metadata: {} }), false);

  storage.setItem(module.storageKey, JSON.stringify({
    schemaVersion: 1,
    records: [{ id: "old-note", note: "Keep me", createdAt: "2026-10-15T20:00:00.000Z" }],
    metadata: { createdAt: null, updatedAt: null }
  }));
  loaded = repository.load();
  assert.strictEqual(loaded.schemaVersion, 4);
  assert.strictEqual(loaded.records[0].note, "Keep me");
  assert.strictEqual(loaded.timer, null);

  storage.setItem(module.storageKey, JSON.stringify({
    schemaVersion: 2,
    records: [{ id: "phase-15-note", note: "Keep timer data", createdAt: "2026-10-15T20:00:00.000Z" }],
    timer: { status: "paused", startedAtMs: null, elapsedMs: 65000, updatedAtMs: 100000 },
    metadata: { createdAt: "2026-10-15T20:00:00.000Z", updatedAt: "2026-10-15T20:01:05.000Z" }
  }));
  loaded = repository.load();
  assert.strictEqual(loaded.schemaVersion, 4);
  assert.strictEqual(loaded.records[0].note, "Keep timer data");
  assert.strictEqual(loaded.timer.elapsedMs, 65000);
  assert.strictEqual(loaded.projects.length, 0);

  data = module.createEmptyData();
  data.projects.push({
    id: "project-1", name: "Project", color: "#3b8fc2", archived: false,
    createdAt: "2026-10-16T08:00:00.000Z", updatedAt: "2026-10-16T08:00:00.000Z"
  });
  data.tasks.push({
    id: "task-1", projectId: "project-1", name: "Task", archived: false,
    createdAt: "2026-10-16T08:00:00.000Z", updatedAt: "2026-10-16T08:00:00.000Z"
  });
  data.timeEntries.push({
    id: "entry-1", date: "2026-10-16", projectId: "project-1", taskId: "task-1",
    durationSeconds: 5400, description: "Work", billable: true,
    createdAt: "2026-10-16T08:00:00.000Z", updatedAt: "2026-10-16T08:00:00.000Z"
  });
  assert.strictEqual(module.validateData(data), true);
  data.tasks[0].projectId = "missing-project";
  assert.strictEqual(module.validateData(data), false);

  storage.setItem(module.storageKey, JSON.stringify({
    schemaVersion: 3,
    records: [],
    timer: { status: "paused", startedAtMs: null, elapsedMs: 17000, updatedAtMs: 100000 },
    projects: [{ id: "p1", name: "Project", color: "#3b8fc2", archived: false, createdAt: "2026-10-16T08:00:00.000Z", updatedAt: "2026-10-16T08:00:00.000Z" }],
    tasks: [],
    timeEntries: [{ id: "e1", date: "2026-10-16", projectId: "p1", taskId: null, durationMinutes: 90, description: "Old entry", billable: true, createdAt: "2026-10-16T08:00:00.000Z", updatedAt: "2026-10-16T08:00:00.000Z" }],
    settings: { selectedDate: "2026-10-16" },
    metadata: { createdAt: null, updatedAt: null }
  }));
  loaded = repository.load();
  assert.strictEqual(loaded.schemaVersion, 4);
  assert.strictEqual(loaded.timeEntries[0].durationSeconds, 5400);
  assert.strictEqual(typeof loaded.timeEntries[0].durationMinutes, "undefined");
  assert.strictEqual(loaded.timer.projectId, null);
  assert.strictEqual(loaded.timer.description, "");
  console.log("Storage tests passed.");
}

run();
