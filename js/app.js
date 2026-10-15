(function (window, document) {
  "use strict";

  var APP_VERSION = "1.0.0-phase1";
  var repository;
  var data;
  var storageStatus;
  var bootTime = new Date();

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(element, value) {
    if (element) {
      element.textContent = String(value);
    }
  }

  function show(element) {
    if (element) {
      element.className = element.className.replace(/(?:^|\s)is-hidden(?:\s|$)/g, " ");
    }
  }

  function hide(element) {
    if (element && (" " + element.className + " ").indexOf(" is-hidden ") === -1) {
      element.className += " is-hidden";
    }
  }

  function setNotice(type, message) {
    var notice = byId("startup-message");
    notice.className = "notice notice-" + type;
    setText(notice, message);
  }

  function formatDate(value) {
    var date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString ? date.toLocaleString() : value;
  }

  function createId() {
    return "note-" + String(new Date().getTime()) + "-" + String(Math.floor(Math.random() * 100000));
  }

  function renderRecords() {
    var list = byId("record-list");
    var empty = byId("empty-state");
    var index;
    var record;
    var item;
    var note;
    var date;
    var deleteButton;

    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    setText(byId("record-count"), data.records.length);

    if (data.records.length === 0) {
      show(empty);
      return;
    }

    hide(empty);

    for (index = data.records.length - 1; index >= 0; index -= 1) {
      record = data.records[index];
      item = document.createElement("li");
      item.className = "record-item";

      note = document.createElement("span");
      note.className = "record-note";
      setText(note, record.note);

      date = document.createElement("span");
      date.className = "record-date";
      setText(date, "Saved " + formatDate(record.createdAt));

      deleteButton = document.createElement("button");
      deleteButton.className = "button button-danger";
      deleteButton.type = "button";
      deleteButton.setAttribute("data-record-id", record.id);
      setText(deleteButton, "Delete");

      item.appendChild(note);
      item.appendChild(date);
      item.appendChild(deleteButton);
      list.appendChild(item);
    }
  }

  function saveRecord(event) {
    var input = byId("record-note");
    var note = input.value.replace(/^\s+|\s+$/g, "");
    var error = byId("form-error");
    var record;

    event.preventDefault();
    setText(error, "");

    if (!storageStatus.available) {
      setText(error, "Local storage is unavailable. Open Diagnostics for details.");
      return;
    }

    if (!note) {
      setText(error, "Enter a note before saving.");
      input.focus();
      return;
    }

    record = {
      id: createId(),
      note: note,
      createdAt: new Date().toISOString()
    };

    data.records.push(record);

    try {
      repository.save(data);
      input.value = "";
      renderRecords();
      setNotice("success", "The note was saved on this device.");
    } catch (saveError) {
      data.records.pop();
      setText(error, saveError.message);
      setNotice("error", saveError.message);
    }
  }

  function deleteRecord(id) {
    var index;
    var removed;

    for (index = 0; index < data.records.length; index += 1) {
      if (data.records[index].id === id) {
        removed = data.records.splice(index, 1)[0];
        break;
      }
    }

    if (!removed) {
      return;
    }

    try {
      repository.save(data);
      renderRecords();
      setNotice("success", "The note was deleted.");
    } catch (error) {
      data.records.splice(index, 0, removed);
      setNotice("error", error.message);
    }
  }

  function handleRecordListClick(event) {
    var target = event.target || event.srcElement;
    var id;

    if (!target || target.tagName.toLowerCase() !== "button") {
      return;
    }

    id = target.getAttribute("data-record-id");
    if (id) {
      deleteRecord(id);
    }
  }

  function setActiveView(name) {
    var recordsView = byId("records-view");
    var diagnosticsView = byId("diagnostics-view");
    var recordsButton = byId("nav-records");
    var diagnosticsButton = byId("nav-diagnostics");

    if (name === "diagnostics") {
      hide(recordsView);
      show(diagnosticsView);
      recordsButton.className = "nav-button";
      diagnosticsButton.className = "nav-button is-active";
      renderDiagnostics();
    } else {
      show(recordsView);
      hide(diagnosticsView);
      recordsButton.className = "nav-button is-active";
      diagnosticsButton.className = "nav-button";
    }
  }

  function diagnosticValues() {
    var startupErrors = window.__mhStartupErrors || [];
    var standalone = window.navigator.standalone === true ? "Yes" : "No";

    return [
      ["Application version", APP_VERSION],
      ["Started", bootTime.toISOString()],
      ["User agent", window.navigator.userAgent || "Unknown"],
      ["Platform", window.navigator.platform || "Unknown"],
      ["Screen", window.screen.width + " x " + window.screen.height],
      ["Viewport", document.documentElement.clientWidth + " x " + document.documentElement.clientHeight],
      ["Orientation", window.innerWidth > window.innerHeight ? "Landscape" : "Portrait"],
      ["Home-screen mode", standalone],
      ["Online", window.navigator.onLine === false ? "No" : "Yes"],
      ["Local storage", storageStatus.available ? "Available" : "Unavailable: " + storageStatus.message],
      ["Storage key", repository.getStorageKey()],
      ["Schema version", window.MHStorage.schemaVersion],
      ["Saved records", data ? data.records.length : 0],
      ["Last saved", data && data.metadata.updatedAt ? data.metadata.updatedAt : "Never"],
      ["Startup errors", startupErrors.length ? JSON.stringify(startupErrors) : "None"]
    ];
  }

  function renderDiagnostics() {
    var list = byId("diagnostic-list");
    var values = diagnosticValues();
    var index;
    var row;
    var term;
    var detail;

    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    for (index = 0; index < values.length; index += 1) {
      row = document.createElement("div");
      row.className = "diagnostic-row";
      term = document.createElement("dt");
      detail = document.createElement("dd");
      setText(term, values[index][0]);
      setText(detail, values[index][1]);
      row.appendChild(term);
      row.appendChild(detail);
      list.appendChild(row);
    }
  }

  function buildDiagnosticReport() {
    var values = diagnosticValues();
    var lines = ["My Hours Custom diagnostics"];
    var index;

    for (index = 0; index < values.length; index += 1) {
      lines.push(values[index][0] + ": " + values[index][1]);
    }

    return lines.join("\n");
  }

  function copyDiagnostics() {
    var output = byId("diagnostic-output");
    var label = byId("diagnostic-output-label");
    var status = byId("copy-status");
    var copied = false;

    output.value = buildDiagnosticReport();
    show(output);
    show(label);
    output.focus();
    output.select();

    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    if (copied) {
      setText(status, "Diagnostic report copied.");
      hide(output);
      hide(label);
    } else {
      setText(status, "Automatic copying is unavailable. The report is selected below for manual copying.");
    }
  }

  function bindEvents() {
    byId("record-form").onsubmit = saveRecord;
    byId("record-list").onclick = handleRecordListClick;
    byId("nav-records").onclick = function () {
      setActiveView("records");
    };
    byId("nav-diagnostics").onclick = function () {
      setActiveView("diagnostics");
    };
    byId("refresh-diagnostics").onclick = renderDiagnostics;
    byId("copy-diagnostics").onclick = copyDiagnostics;
    window.onorientationchange = function () {
      window.setTimeout(renderDiagnostics, 200);
    };
  }

  function boot() {
    var browserStorage;

    if (!window.MHStorage) {
      setNotice("error", "The storage component did not load. Check the network and reload.");
      return;
    }

    try {
      browserStorage = window.localStorage;
      repository = new window.MHStorage.StorageRepository(browserStorage);
      storageStatus = repository.checkAvailability();
    } catch (storageAccessError) {
      repository = {
        getStorageKey: function () {
          return window.MHStorage.storageKey;
        }
      };
      storageStatus = {
        available: false,
        message: storageAccessError.message || "Safari blocked local storage access."
      };
    }

    try {
      data = storageStatus.available ? repository.load() : window.MHStorage.createEmptyData();
    } catch (error) {
      data = window.MHStorage.createEmptyData();
      storageStatus = {
        available: false,
        message: error.message
      };
      setNotice("error", error.message + " Open Diagnostics for details.");
    }

    setText(byId("version-label"), "v" + APP_VERSION);
    renderRecords();
    renderDiagnostics();
    bindEvents();

    if (storageStatus.available) {
      setNotice("success", "Compatibility check passed. JavaScript and local storage are working.");
    } else {
      setNotice("error", "The app loaded, but local storage is unavailable: " + storageStatus.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, false);
  } else {
    boot();
  }
}(window, document));
