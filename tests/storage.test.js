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
  assert.strictEqual(data.schemaVersion, 2);
  assert.strictEqual(data.records.length, 0);
  assert.strictEqual(data.timer, null);

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
  assert.strictEqual(module.validateData({ schemaVersion: 2, records: [{}], timer: null, metadata: {} }), false);

  storage.setItem(module.storageKey, JSON.stringify({
    schemaVersion: 1,
    records: [{ id: "old-note", note: "Keep me", createdAt: "2026-10-15T20:00:00.000Z" }],
    metadata: { createdAt: null, updatedAt: null }
  }));
  loaded = repository.load();
  assert.strictEqual(loaded.schemaVersion, 2);
  assert.strictEqual(loaded.records[0].note, "Keep me");
  assert.strictEqual(loaded.timer, null);
  console.log("Storage tests passed.");
}

run();
