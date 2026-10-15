(function (root) {
  "use strict";

  var STORAGE_KEY = "myhours-custom.phase1.data";
  var SCHEMA_VERSION = 1;

  function createEmptyData() {
    return {
      schemaVersion: SCHEMA_VERSION,
      records: [],
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

  function validateData(data) {
    var index;

    if (!data || data.schemaVersion !== SCHEMA_VERSION || !data.records ||
        Object.prototype.toString.call(data.records) !== "[object Array]") {
      return false;
    }

    for (index = 0; index < data.records.length; index += 1) {
      if (!isValidRecord(data.records[index])) {
        return false;
      }
    }

    return true;
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
    schemaVersion: SCHEMA_VERSION,
    storageKey: STORAGE_KEY
  };
}(this));
