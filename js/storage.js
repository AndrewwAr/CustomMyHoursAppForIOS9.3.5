(function (root) {
  "use strict";

  var STORAGE_KEY = "myhours-custom.phase1.data";
  var SCHEMA_VERSION = 5;

  function createEmptyData() {
    return {
      schemaVersion: SCHEMA_VERSION,
      records: [],
      timer: null,
      projects: [],
      tasks: [],
      timeEntries: [],
      settings: {
        selectedDate: null,
        favorites: []
      },
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

    if ((timer.status === "running" && typeof timer.startedAtMs !== "number") ||
        (timer.status === "paused" && timer.startedAtMs !== null)) {
      return false;
    }

    return (timer.projectId === null || typeof timer.projectId === "string") &&
      (timer.taskId === null || typeof timer.taskId === "string") &&
      typeof timer.description === "string" && typeof timer.billable === "boolean" &&
      (timer.startedDate === null || /^\d{4}-\d{2}-\d{2}$/.test(timer.startedDate));
  }

  function isValidLegacyTimer(timer) {
    if (timer === null) { return true; }
    return !!timer && (timer.status === "running" || timer.status === "paused") &&
      typeof timer.elapsedMs === "number" && timer.elapsedMs >= 0 &&
      typeof timer.updatedAtMs === "number" &&
      ((timer.status === "running" && typeof timer.startedAtMs === "number") ||
       (timer.status === "paused" && timer.startedAtMs === null));
  }

  function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
  }

  function everyItem(items, validator) {
    var index;

    if (!isArray(items)) {
      return false;
    }

    for (index = 0; index < items.length; index += 1) {
      if (!validator(items[index])) {
        return false;
      }
    }

    return true;
  }

  function isValidProject(project) {
    return !!project && typeof project.id === "string" &&
      typeof project.name === "string" && project.name.length > 0 &&
      typeof project.color === "string" && typeof project.archived === "boolean" &&
      typeof project.createdAt === "string" && typeof project.updatedAt === "string";
  }

  function isValidTask(task) {
    return !!task && typeof task.id === "string" &&
      typeof task.projectId === "string" && typeof task.name === "string" &&
      task.name.length > 0 && typeof task.archived === "boolean" &&
      (typeof task.parentTaskId === "undefined" || task.parentTaskId === null || typeof task.parentTaskId === "string") &&
      typeof task.createdAt === "string" && typeof task.updatedAt === "string";
  }

  function isValidTimeEntry(entry) {
    return !!entry && typeof entry.id === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
      typeof entry.projectId === "string" &&
      (entry.taskId === null || typeof entry.taskId === "string") &&
      typeof entry.durationSeconds === "number" &&
      entry.durationSeconds > 0 && entry.durationSeconds <= 2678400 &&
      Math.floor(entry.durationSeconds) === entry.durationSeconds &&
      typeof entry.description === "string" && typeof entry.billable === "boolean" &&
      typeof entry.createdAt === "string" && typeof entry.updatedAt === "string";
  }

  function isValidVersion3Entry(entry) {
    return !!entry && typeof entry.id === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
      typeof entry.projectId === "string" &&
      (entry.taskId === null || typeof entry.taskId === "string") &&
      typeof entry.durationMinutes === "number" && entry.durationMinutes > 0 &&
      entry.durationMinutes <= 1440 && Math.floor(entry.durationMinutes) === entry.durationMinutes &&
      typeof entry.description === "string" && typeof entry.billable === "boolean" &&
      typeof entry.createdAt === "string" && typeof entry.updatedAt === "string";
  }

  function isValidSettings(settings) {
    return !!settings && (settings.selectedDate === null ||
      /^\d{4}-\d{2}-\d{2}$/.test(settings.selectedDate));
  }

  function hasUniqueIds(items) {
    var seen = {};
    var index;

    for (index = 0; index < items.length; index += 1) {
      if (seen[items[index].id]) {
        return false;
      }
      seen[items[index].id] = true;
    }

    return true;
  }

  function findItem(items, id) {
    var index;
    for (index = 0; index < items.length; index += 1) {
      if (items[index].id === id) {
        return items[index];
      }
    }
    return null;
  }

  function hasValidRelationships(data) {
    var index;
    var task;

    for (index = 0; index < data.tasks.length; index += 1) {
      if (!findItem(data.projects, data.tasks[index].projectId)) {
        return false;
      }
      if (data.tasks[index].parentTaskId !== null && typeof data.tasks[index].parentTaskId !== "undefined") {
        task = findItem(data.tasks, data.tasks[index].parentTaskId);
        if (!task || task.projectId !== data.tasks[index].projectId || task.id === data.tasks[index].id) {
          return false;
        }
        if (hasTaskCycle(data.tasks, data.tasks[index].id)) {
          return false;
        }
      }
    }

    for (index = 0; index < data.timeEntries.length; index += 1) {
      if (!findItem(data.projects, data.timeEntries[index].projectId)) {
        return false;
      }
      if (data.timeEntries[index].taskId !== null) {
        task = findItem(data.tasks, data.timeEntries[index].taskId);
        if (!task || task.projectId !== data.timeEntries[index].projectId) {
          return false;
        }
      }
    }

    if (data.timer && data.timer.projectId !== null) {
      if (!findItem(data.projects, data.timer.projectId)) { return false; }
      if (data.timer.taskId !== null) {
        task = findItem(data.tasks, data.timer.taskId);
        if (!task || task.projectId !== data.timer.projectId) { return false; }
      }
    } else if (data.timer && data.timer.taskId !== null) {
      return false;
    }

    return true;
  }

  function hasTaskCycle(tasks, taskId) {
    var seen = {};
    var current = findItem(tasks, taskId);
    while (current && current.parentTaskId) {
      if (seen[current.id]) { return true; }
      seen[current.id] = true;
      current = findItem(tasks, current.parentTaskId);
    }
    return !!(current && seen[current.id]);
  }

  function isValidVersion2(data) {
    return !!data && data.schemaVersion === 2 && validateRecords(data.records) &&
      isValidLegacyTimer(data.timer) && !!data.metadata && typeof data.metadata === "object";
  }


  function isValidVersion3(data) {
    return !!data && data.schemaVersion === 3 && validateRecords(data.records) &&
      isValidLegacyTimer(data.timer) && everyItem(data.projects, isValidProject) &&
      everyItem(data.tasks, isValidTask) && everyItem(data.timeEntries, isValidVersion3Entry) &&
      isValidSettings(data.settings) && !!data.metadata && typeof data.metadata === "object";
  }

  function validateData(data) {
    return !!data && data.schemaVersion === SCHEMA_VERSION &&
      validateRecords(data.records) && isValidTimer(data.timer) &&
      everyItem(data.projects, isValidProject) && hasUniqueIds(data.projects) &&
      everyItem(data.tasks, isValidTask) && hasUniqueIds(data.tasks) &&
      everyItem(data.timeEntries, isValidTimeEntry) && hasUniqueIds(data.timeEntries) &&
      isValidSettings(data.settings) &&
      !!data.metadata && typeof data.metadata === "object" &&
      hasValidRelationships(data);
  }

  function migrateData(data) {
    if (data && data.schemaVersion === 1 && validateRecords(data.records)) {
      data = {
        schemaVersion: 2,
        records: data.records,
        timer: null,
        metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {
          createdAt: null,
          updatedAt: null
        }
      };
    }

    if (isValidVersion2(data)) {
      data = {
        schemaVersion: 3,
        records: data.records,
        timer: data.timer,
        projects: [],
        tasks: [],
        timeEntries: [],
        settings: { selectedDate: null, favorites: [] },
        metadata: data.metadata
      };
    }

    if (isValidVersion3(data)) {
      data.schemaVersion = 4;
      data.timer = data.timer ? {
        status: data.timer.status,
        startedAtMs: data.timer.startedAtMs,
        elapsedMs: data.timer.elapsedMs,
        updatedAtMs: data.timer.updatedAtMs,
        projectId: null,
        taskId: null,
        description: "",
        billable: true,
        startedDate: null
      } : null;
      data.timeEntries = data.timeEntries.map(function (entry) {
        return {
          id: entry.id, date: entry.date, projectId: entry.projectId,
          taskId: entry.taskId, durationSeconds: entry.durationMinutes * 60,
          startTime: entry.startTime || "", endTime: entry.endTime || "",
          description: entry.description, tag: entry.tag || "", billable: entry.billable,
          createdAt: entry.createdAt, updatedAt: entry.updatedAt
        };
      });
    }

    if (data && data.schemaVersion === 4 && validateRecords(data.records) &&
        isValidLegacyTimer(data.timer) && everyItem(data.projects, isValidProject) &&
        everyItem(data.tasks, isValidTask) && everyItem(data.timeEntries, isValidTimeEntry) &&
        isValidSettings(data.settings) && data.metadata && typeof data.metadata === "object") {
      data.schemaVersion = SCHEMA_VERSION;
      data.settings.favorites = data.settings.favorites || [];
      data.tasks = data.tasks.map(function (task) {
        task.parentTaskId = task.parentTaskId || null;
        return task;
      });
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
      throw new Error("The data could not be saved. Safari storage may be full or unavailable.");
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
