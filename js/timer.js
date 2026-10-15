(function (root) {
  "use strict";

  function copyDetails(source, target) {
    target.projectId = source && typeof source.projectId === "string" ? source.projectId : null;
    target.taskId = source && typeof source.taskId === "string" ? source.taskId : null;
    target.description = source && typeof source.description === "string" ? source.description : "";
    target.billable = source && typeof source.billable === "boolean" ? source.billable : true;
    target.startedDate = source && typeof source.startedDate === "string" ? source.startedDate : null;
    return target;
  }

  function createRunning(now, details) {
    return copyDetails(details, {
      status: "running",
      startedAtMs: now,
      elapsedMs: 0,
      updatedAtMs: now
    });
  }

  function getElapsed(timer, now) {
    var additional;

    if (!timer) {
      return 0;
    }

    if (timer.status !== "running") {
      return Math.max(0, timer.elapsedMs);
    }

    additional = now - timer.startedAtMs;
    if (additional < 0) {
      additional = 0;
    }

    return Math.max(0, timer.elapsedMs + additional);
  }

  function start(timer, now, details) {
    if (!timer) {
      return createRunning(now, details);
    }

    if (timer.status === "running") {
      return timer;
    }

    return copyDetails(timer, {
      status: "running",
      startedAtMs: now,
      elapsedMs: Math.max(0, timer.elapsedMs),
      updatedAtMs: now
    });
  }

  function pause(timer, now) {
    if (!timer || timer.status !== "running") {
      return timer;
    }

    return copyDetails(timer, {
      status: "paused",
      startedAtMs: null,
      elapsedMs: getElapsed(timer, now),
      updatedAtMs: now
    });
  }

  function isValid(timer) {
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

  root.MHTimer = {
    getElapsed: getElapsed,
    start: start,
    pause: pause,
    isValid: isValid
  };
}(this));
