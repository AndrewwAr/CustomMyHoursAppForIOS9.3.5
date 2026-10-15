(function (root) {
  "use strict";

  var STORAGE_KEY = "myhours-custom.phase1.data";
  var SCHEMA_VERSION = 2;

  function createEmptyData() {
    return {
      schemaVersion: SCHEMA_VERSION,
      records: [],
      timer: null,
      metadata: {
        createdAt: null,
        updatedAt: null
      }
    };
  }

  function isValidRecord(record) {
    return record &&
      typeof record.id === "string" &&
      typeof record.note === "string" &&
      typeof record.createdAt === "string";
  }

  function validateRecords(records) {
    var index;

    if (!records || Object.prototype.toString.call(records) !== "[object Array]") {
      return false;
    }

    for (index = 0; index < records.length; index += 1) {
      if (!isValidRecord(records[index])) {
        return false;
      }
    }

    return true;
  }

  function isValidTimer(timer) {
    if (timer === null) {
      return true;
    }

    if (!timer || (timer.status !== "running" && timer.status !== "paused") ||
        typeof timer.elapsedMs !== "number" || timer.elapsedMs < 0 ||
        typeof timer.updatedAtMs !== "number") {
      return false;
    }

    if (timer.status === "running") {
      return typeof timer.startedAtMs === "number";
    }

    return timer.startedAtMs === null;
  }

  function validateData(data) {
    return !!data && data.schemaVersion === SCHEMA_VERSION &&
      validateRecords(data.records) && isValidTimer(data.timer) &&
      !!data.metadata && typeof data.metadata === "object";
  }

  function migrateData(data) {
    if (data && data.schemaVersion === 1 && validateRecords(data.records)) {
      return {
        schemaVersion: SCHEMA_VERSION,
        records: data.records,
        timer: null,
        metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {
          createdAt: null,
          updatedAt: null
        }
      };
    }

    return data;
  }

  function StorageRepository(storage) {
    this.storage = storage;
  }

  StorageRepository.prototype.checkAvailability = function () {
    var probeKey = STORAGE_KEY + ".probe";

    try {
      this.storage.setItem(probeKey, "ok");
      this.storage.removeItem(probeKey);
      return { available: true, message: "Available" };
    } catch (error) {
      return {
        available: false,
        message: error && error.message ? error.message : "Storage access failed"
      };
    }
  };

  StorageRepository.prototype.load = function () {
    var raw;
    var parsed;

    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch (error) {
      throw new Error("Safari prevented access to local storage.");
    }

    if (!raw) {
      return createEmptyData();
    }

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error("Stored data is not valid JSON. It was left unchanged.");
    }

    parsed = migrateData(parsed);

    if (!validateData(parsed)) {
      throw new Error("Stored data has an unsupported format. It was left unchanged.");
    }

    return parsed;
  };

  StorageRepository.prototype.save = function (data) {
    var now;

    if (!validateData(data)) {
      throw new Error("The application refused to save invalid data.");
    }

    now = new Date().toISOString();
    if (!data.metadata.createdAt) {
      data.metadata.createdAt = now;
    }
    data.metadata.updatedAt = now;

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      throw new Error("The note could not be saved. Safari storage may be full or unavailable.");
    }
  };

  StorageRepository.prototype.getStorageKey = function () {
    return STORAGE_KEY;
  };

  root.MHStorage = {
    StorageRepository: StorageRepository,
    createEmptyData: createEmptyData,
    validateData: validateData,
    migrateData: migrateData,
    schemaVersion: SCHEMA_VERSION,
    storageKey: STORAGE_KEY
  };
}(this));
