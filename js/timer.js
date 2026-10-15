(function (root) {
  "use strict";

  function createRunning(now) {
    return {
      status: "running",
      startedAtMs: now,
      elapsedMs: 0,
      updatedAtMs: now
    };
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

  function start(timer, now) {
    if (!timer) {
      return createRunning(now);
    }

    if (timer.status === "running") {
      return timer;
    }

    return {
      status: "running",
      startedAtMs: now,
      elapsedMs: Math.max(0, timer.elapsedMs),
      updatedAtMs: now
    };
  }

  function pause(timer, now) {
    if (!timer || timer.status !== "running") {
      return timer;
    }

    return {
      status: "paused",
      startedAtMs: null,
      elapsedMs: getElapsed(timer, now),
      updatedAtMs: now
    };
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
