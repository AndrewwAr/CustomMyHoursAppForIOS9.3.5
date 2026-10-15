(function (root) {
  "use strict";

  function trim(value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
  }

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function dateKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function dateFromKey(value) {
    var parts = value.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function addDays(value, amount) {
    var date = dateFromKey(value);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  }

  function startOfWeek(value) {
    var date = dateFromKey(value);
    var day = date.getDay();
    return addDays(value, day === 0 ? -6 : 1 - day);
  }

  function sumDurationSeconds(entries) {
    var total = 0;
    var index;
    for (index = 0; index < entries.length; index += 1) { total += entries[index].durationSeconds; }
    return total;
  }

  function dailyTotals(entries, start, count) {
    var totals = [];
    var index;
    var day;
    for (index = 0; index < count; index += 1) {
      day = addDays(start, index);
      totals.push(totalForDate(entries, day));
    }
    return totals;
  }

  function isValidDateKey(value) {
    var parts;
    var date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    parts = value.split("-");
    date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.getFullYear() === Number(parts[0]) &&
      date.getMonth() === Number(parts[1]) - 1 &&
      date.getDate() === Number(parts[2]);
  }

  function parseDuration(hoursValue, minutesValue) {
    var hoursText = trim(hoursValue);
    var minutesText = trim(minutesValue);
    var hours = hoursText === "" ? 0 : Number(hoursText);
    var minutes = minutesText === "" ? 0 : Number(minutesText);

    if (!isFinite(hours) || !isFinite(minutes) ||
        Math.floor(hours) !== hours || Math.floor(minutes) !== minutes) {
      return { valid: false, minutes: 0, message: "Hours and minutes must be whole numbers." };
    }

    if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59 ||
        (hours === 24 && minutes !== 0)) {
      return { valid: false, minutes: 0, message: "Enter a duration from 1 minute up to 24 hours." };
    }

    if (hours === 0 && minutes === 0) {
      return { valid: false, minutes: 0, message: "Duration must be at least one minute." };
    }

    return { valid: true, minutes: (hours * 60) + minutes, message: "" };
  }

  function parseDurationSeconds(hoursValue, minutesValue, secondsValue) {
    var base = parseDuration(hoursValue, minutesValue);
    var secondsText = trim(secondsValue);
    var seconds = secondsText === "" ? 0 : Number(secondsText);

    if (!isFinite(seconds) || Math.floor(seconds) !== seconds || seconds < 0 || seconds > 59) {
      return { valid: false, seconds: 0, message: "Seconds must be a whole number from 0 to 59." };
    }
    if (!base.valid && !(Number(hoursValue || 0) === 0 && Number(minutesValue || 0) === 0 && seconds > 0)) {
      return { valid: false, seconds: 0, message: base.message };
    }
    if (base.minutes === 1440 && seconds > 0) {
      return { valid: false, seconds: 0, message: "Enter a duration up to 24 hours." };
    }
    return { valid: true, seconds: (base.minutes * 60) + seconds, message: "" };
  }

  function formatDuration(totalMinutes) {
    var minutes = Math.max(0, Math.floor(totalMinutes));
    var hours = Math.floor(minutes / 60);
    return hours + "h " + pad(minutes % 60) + "m";
  }

  function formatDurationSeconds(totalSeconds) {
    var seconds = Math.max(0, Math.floor(totalSeconds));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainder = seconds % 60;

    return hours + "h " + pad(minutes) + "m" + (remainder ? " " + pad(remainder) + "s" : "");
  }

  function findById(items, id) {
    var index;

    for (index = 0; index < items.length; index += 1) {
      if (items[index].id === id) {
        return items[index];
      }
    }

    return null;
  }

  function activeProjects(projects) {
    return projects.filter(function (project) {
      return !project.archived;
    });
  }

  function tasksForProject(tasks, projectId, includeArchivedId) {
    return tasks.filter(function (task) {
      return task.projectId === projectId && (!task.archived || task.id === includeArchivedId);
    });
  }

  function entriesForDate(entries, selectedDate) {
    return entries.filter(function (entry) {
      return entry.date === selectedDate;
    }).sort(function (left, right) {
      return left.createdAt < right.createdAt ? 1 : -1;
    });
  }

  function totalForDate(entries, selectedDate) {
    var total = 0;
    var index;

    for (index = 0; index < entries.length; index += 1) {
      if (entries[index].date === selectedDate) {
        total += entries[index].durationSeconds;
      }
    }

    return total;
  }

  function hasDuplicateName(items, name, projectId, excludedId) {
    var normalized = trim(name).toLowerCase();
    var index;

    for (index = 0; index < items.length; index += 1) {
      if (items[index].id !== excludedId && !items[index].archived &&
          trim(items[index].name).toLowerCase() === normalized &&
          (typeof projectId === "undefined" || items[index].projectId === projectId)) {
        return true;
      }
    }

    return false;
  }

  function createTimerEntry(timer, elapsedMs, createdAt, id, fallbackDate) {
    return {
      id: id,
      date: timer.startedDate || fallbackDate,
      projectId: timer.projectId,
      taskId: timer.taskId,
      durationSeconds: Math.max(1, Math.floor(Math.max(0, elapsedMs) / 1000)),
      description: timer.description,
      billable: timer.billable,
      createdAt: createdAt,
      updatedAt: createdAt
    };
  }

  root.MHDomain = {
    trim: trim,
    dateKey: dateKey,
    addDays: addDays,
    startOfWeek: startOfWeek,
    sumDurationSeconds: sumDurationSeconds,
    dailyTotals: dailyTotals,
    isValidDateKey: isValidDateKey,
    parseDuration: parseDuration,
    parseDurationSeconds: parseDurationSeconds,
    formatDuration: formatDuration,
    formatDurationSeconds: formatDurationSeconds,
    findById: findById,
    activeProjects: activeProjects,
    tasksForProject: tasksForProject,
    entriesForDate: entriesForDate,
    totalForDate: totalForDate,
    hasDuplicateName: hasDuplicateName,
    createTimerEntry: createTimerEntry
  };
}(this));
