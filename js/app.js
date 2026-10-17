(function (window, document) {
  "use strict";

  var APP_VERSION = "7.3.0-phase6";
  var repository;
  var data;
  var storageStatus;
  var bootTime = new Date();
  var timerRefreshId = null;
  var safeMode = /(?:\?|&)safe=1(?:&|$)/.test(window.location.search || "");

  function setSidebarCollapsed(collapsed) {
    var body = document.body;
    var toggle = byId("sidebar-toggle");
    var className = body.className || "";
    var hasClass = (" " + className + " ").indexOf(" sidebar-collapsed ") !== -1;

    if (collapsed && !hasClass) {
      body.className = (className + " sidebar-collapsed").replace(/^\s+/, "");
    } else if (!collapsed && hasClass) {
      body.className = className.replace(/(?:^|\s)sidebar-collapsed(?:\s|$)/g, " ").replace(/^\s+|\s+$/g, "");
    }

    if (toggle) {
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.setAttribute("aria-label", collapsed ? "Show navigation" : "Hide navigation");
      setText(toggle, collapsed ? "→" : "←");
    }
  }

  function toggleSidebar() {
    var collapsed = (" " + (document.body.className || "") + " ").indexOf(" sidebar-collapsed ") !== -1;
    setSidebarCollapsed(!collapsed);
    try {
      window.localStorage.setItem("myhours-custom.sidebar-collapsed", collapsed ? "no" : "yes");
    } catch (ignore) {}
  }

  function moveSelectedDate(amount) {
    var input = byId("selected-date");
    var current = input.value || window.MHDomain.dateKey(new Date());
    input.value = window.MHDomain.addDays(current, amount);
    input.onchange();
  }

  function selectToday() {
    var input = byId("selected-date");
    input.value = window.MHDomain.dateKey(new Date());
    input.onchange();
  }

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

  window.onerror = function (message, source, line) {
    var errors = window.__mhStartupErrors || [];
    errors.push(String(message) + (source ? " (" + source + ":" + line + ")" : ""));
    window.__mhStartupErrors = errors.slice(-5);
    if (byId("startup-message")) {
      setNotice("error", "The app caught an error. Open Diagnostics, export a backup, then reload or use safe mode.");
    }
    return false;
  };

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
    var names = ["today", "projects", "week", "records", "diagnostics"];
    var index;

    for (index = 0; index < names.length; index += 1) {
      if (names[index] === name) {
        show(byId(names[index] + "-view"));
        byId("nav-" + names[index]).className = "nav-button is-active";
      } else {
        hide(byId(names[index] + "-view"));
        byId("nav-" + names[index]).className = "nav-button";
      }
    }

    if (name === "diagnostics") {
      renderDiagnostics();
    } else if (name === "week") {
      window.MHWeekly.render();
    } else if (name === "today" || name === "projects") {
      window.MHProduct.renderAll();
    }
  }

  function formatElapsed(milliseconds) {
    var totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    function pad(value) {
      return value < 10 ? "0" + value : String(value);
    }

    return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  }

  function stopTimerRefresh() {
    if (timerRefreshId !== null) {
      window.clearInterval(timerRefreshId);
      timerRefreshId = null;
    }
  }

  function startTimerRefresh() {
    stopTimerRefresh();
    if (data.timer && data.timer.status === "running") {
      timerRefreshId = window.setInterval(renderTimer, 250);
    }
  }

  function showComposer() {
    show(byId("timer-view"));
    if (!data || !data.timer) {
      setTimerFormCollapsed(false);
    }
    hide(byId("new-time-log"));
  }

  function dismissComposer() {
    if (data.timer && data.timer.status === "running") {
      setNotice("info", "The timer is still running in the background. Reopen the time log to manage it.");
    }
    hide(byId("timer-view"));
    show(byId("new-time-log"));
  }

  function setTimerFormCollapsed(collapsed) {
    if (collapsed) {
      hide(byId("entry-form"));
      hide(byId("timer-actions"));
      show(byId("active-timer-bar"));
    } else {
      show(byId("entry-form"));
      show(byId("timer-actions"));
      hide(byId("active-timer-bar"));
    }
  }

  function appendTimerOption(select, value, label, selected) {
    var option = document.createElement("option");
    option.value = value;
    setText(option, label);
    option.selected = value === selected;
    select.appendChild(option);
  }

  function fillTimerProjects(selectedId) {
    var select = byId("timer-project");
    var project;
    var index;
    while (select.firstChild) { select.removeChild(select.firstChild); }
    appendTimerOption(select, "", data.projects.length ? "Select a project" : "Create a project first", selectedId);
    for (index = 0; index < data.projects.length; index += 1) {
      project = data.projects[index];
      if (!project.archived || project.id === selectedId) {
        appendTimerOption(select, project.id, project.name + (project.archived ? " (archived)" : ""), selectedId);
      }
    }
  }

  function fillTimerTasks(projectId, selectedId) {
    var select = byId("timer-task");
    var tasks = window.MHDomain.tasksForProject(data.tasks, projectId, selectedId);
    var index;
    while (select.firstChild) { select.removeChild(select.firstChild); }
    appendTimerOption(select, "", "No task", selectedId);
    for (index = 0; index < tasks.length; index += 1) {
      appendTimerOption(select, tasks[index].id, tasks[index].name + (tasks[index].archived ? " (archived)" : ""), selectedId);
    }
  }

  function fillFavoriteProjects(selectedId) {
    var select = byId("favorite-project");
    var index;
    var project;
    if (!select) { return; }
    if (!data.projects) { data.projects = []; }
    while (select.firstChild) { select.removeChild(select.firstChild); }
    appendTimerOption(select, "", data.projects.length ? "Select a project" : "Create a project first", selectedId);
    for (index = 0; index < data.projects.length; index += 1) {
      project = data.projects[index];
      if (!project.archived || project.id === selectedId) {
        appendTimerOption(select, project.id, project.name, selectedId);
      }
    }
  }

  function fillFavoriteTasks(projectId, selectedId) {
    var select = byId("favorite-task");
    var tasks;
    var index;
    if (!select) { return; }
    if (!data.tasks) { data.tasks = []; }
    tasks = window.MHDomain.tasksForProject(data.tasks, projectId, selectedId);
    while (select.firstChild) { select.removeChild(select.firstChild); }
    appendTimerOption(select, "", "No task", selectedId);
    for (index = 0; index < tasks.length; index += 1) {
      appendTimerOption(select, tasks[index].id, tasks[index].name, selectedId);
    }
  }

  function renderFavorites() {
    var list = byId("favorite-list");
    var favorites = data.settings.favorites || [];
    var index;
    var favorite;
    var project;
    var task;
    var item;
    var label;
    var play;
    while (list.firstChild) { list.removeChild(list.firstChild); }
    for (index = 0; index < favorites.length; index += 1) {
      favorite = favorites[index];
      project = window.MHDomain.findById(data.projects, favorite.projectId);
      task = favorite.taskId ? window.MHDomain.findById(data.tasks, favorite.taskId) : null;
      item = document.createElement("div");
      item.className = "favorite-item";
      label = document.createElement("span");
      label.className = "favorite-label";
      setText(label, String(index + 1) + ". " + (task ? task.name : (project ? project.name : "Favorite")));
      play = document.createElement("button");
      play.className = "favorite-play";
      play.type = "button";
      play.setAttribute("data-favorite-id", favorite.id);
      play.setAttribute("aria-label", "Start " + label.textContent);
      setText(play, "▶");
      item.appendChild(label);
      item.appendChild(play);
      list.appendChild(item);
    }
  }

  function favoriteDisplayName(favorite) {
    var project = window.MHDomain.findById(data.projects, favorite.projectId);
    var task = favorite.taskId ? window.MHDomain.findById(data.tasks, favorite.taskId) : null;
    return task ? task.name : (project ? project.name : "Favorite");
  }

  function saveFavorites() {
    try {
      repository.save(data);
      renderFavorites();
    } catch (error) {
      setNotice("error", "Unable to save favorite order: " + error.message);
    }
  }

  function renderFavoriteEditor() {
    var list = byId("favorite-editor-list");
    var favorites = data.settings.favorites || [];
    var index;
    var row;
    var label;
    var controls;
    var up;
    var down;
    var remove;
    while (list.firstChild) { list.removeChild(list.firstChild); }
    for (index = 0; index < favorites.length; index += 1) {
      row = document.createElement("div");
      row.className = "favorite-editor-item";
      row.draggable = true;
      row.setAttribute("data-favorite-index", String(index));
      label = document.createElement("span");
      label.className = "favorite-editor-label";
      setText(label, String(index + 1) + ". " + favoriteDisplayName(favorites[index]));
      controls = document.createElement("span");
      controls.className = "favorite-editor-controls";
      up = document.createElement("button");
      up.type = "button";
      up.className = "favorite-edit-button";
      up.setAttribute("data-favorite-action", "up");
      up.setAttribute("data-favorite-index", String(index));
      setText(up, "↑");
      down = document.createElement("button");
      down.type = "button";
      down.className = "favorite-edit-button";
      down.setAttribute("data-favorite-action", "down");
      down.setAttribute("data-favorite-index", String(index));
      setText(down, "↓");
      remove = document.createElement("button");
      remove.type = "button";
      remove.className = "favorite-edit-button favorite-delete-button";
      remove.setAttribute("data-favorite-action", "delete");
      remove.setAttribute("data-favorite-index", String(index));
      setText(remove, "Delete");
      controls.appendChild(up);
      controls.appendChild(down);
      controls.appendChild(remove);
      row.appendChild(label);
      row.appendChild(controls);
      list.appendChild(row);
    }
  }

  function openFavoriteEditor() {
    renderFavoriteEditor();
    show(byId("favorite-editor-modal"));
  }

  function closeFavoriteEditor() {
    hide(byId("favorite-editor-modal"));
  }

  function moveFavorite(index, direction) {
    var favorites = data.settings.favorites || [];
    var target = index + direction;
    var item;
    if (target < 0 || target >= favorites.length) { return; }
    item = favorites[index];
    favorites[index] = favorites[target];
    favorites[target] = item;
    saveFavorites();
    renderFavoriteEditor();
  }

  function handleFavoriteEditorClick(event) {
    var target = event.target || event.srcElement;
    var action;
    var index;
    var favorites;
    if (!target || target.tagName.toLowerCase() !== "button") { return; }
    action = target.getAttribute("data-favorite-action");
    index = parseInt(target.getAttribute("data-favorite-index"), 10);
    favorites = data.settings.favorites || [];
    if (isNaN(index) || !favorites[index]) { return; }
    if (action === "up") { moveFavorite(index, -1); }
    if (action === "down") { moveFavorite(index, 1); }
    if (action === "delete") {
      favorites.splice(index, 1);
      saveFavorites();
      renderFavoriteEditor();
    }
  }

  function handleFavoriteDrop(event) {
    var target = event.target || event.srcElement;
    var row;
    var from;
    var to;
    var favorites;
    event.preventDefault();
    row = target;
    while (row && row !== byId("favorite-editor-list") && !row.getAttribute("data-favorite-index")) {
      row = row.parentNode;
    }
    if (!row || row === byId("favorite-editor-list")) { return; }
    from = parseInt(event.dataTransfer.getData("text/plain"), 10);
    to = parseInt(row.getAttribute("data-favorite-index"), 10);
    favorites = data.settings.favorites || [];
    if (isNaN(from) || isNaN(to) || from === to || !favorites[from]) { return; }
    favorites.splice(to, 0, favorites.splice(from, 1)[0]);
    saveFavorites();
    renderFavoriteEditor();
  }

  function handleFavoriteDragStart(event) {
    var row = event.target || event.srcElement;
    if (event.dataTransfer && row.getAttribute("data-favorite-index")) {
      event.dataTransfer.setData("text/plain", row.getAttribute("data-favorite-index"));
    }
  }

  function openFavoriteModal() {
    try {
      fillFavoriteProjects("");
      fillFavoriteTasks("", "");
      setText(byId("favorite-error"), "");
      show(byId("favorite-modal"));
    } catch (error) {
      setNotice("error", "Unable to open the favorite form: " + error.message);
    }
  }

  function closeFavoriteModal() {
    hide(byId("favorite-modal"));
  }

  function saveFavorite(event) {
    var projectId = byId("favorite-project").value;
    var taskId = byId("favorite-task").value || null;
    var project = window.MHDomain.findById(data.projects, projectId);
    var task = taskId ? window.MHDomain.findById(data.tasks, taskId) : null;
    event.preventDefault();
    if (!project || project.archived) {
      setText(byId("favorite-error"), "Select an active project.");
      return;
    }
    if (task && (task.archived || task.projectId !== projectId)) {
      setText(byId("favorite-error"), "Select a task belonging to this project.");
      return;
    }
    if (!data.settings.favorites) { data.settings.favorites = []; }
    data.settings.favorites.push({
      id: createId("favorite"),
      projectId: projectId,
      taskId: taskId,
      createdAt: new Date().toISOString()
    });
    try {
      repository.save(data);
      renderFavorites();
      closeFavoriteModal();
      show(byId("favorites-panel"));
    } catch (error) {
      data.settings.favorites.pop();
      setText(byId("favorite-error"), error.message);
    }
  }

  function startFavorite(id) {
    var favorites = data.settings.favorites || [];
    var favorite = window.MHDomain.findById(favorites, id);
    if (!favorite) { return; }
    if (data.timer) {
      setText(byId("timer-error"), "Stop or pause the current timer before starting a favorite.");
      return;
    }
    byId("timer-project").value = favorite.projectId;
    fillTimerTasks(favorite.projectId, favorite.taskId || "");
    byId("timer-task").value = favorite.taskId || "";
    byId("entry-project").value = favorite.projectId;
    fillTimerTasks(favorite.projectId, favorite.taskId || "");
    byId("entry-task").value = favorite.taskId || "";
    toggleTimer();
  }

  function handleFavoriteClick(event) {
    var target = event.target || event.srcElement;
    var id;
    if (!target || target.tagName.toLowerCase() !== "button") { return; }
    id = target.getAttribute("data-favorite-id");
    if (id) { startFavorite(id); }
  }

  function renderTimerAssignment(timer) {
    var projectId = timer && timer.projectId ? timer.projectId : byId("timer-project").value;
    var taskId = timer && timer.taskId ? timer.taskId : byId("timer-task").value;
    var locked = !!(timer && timer.status === "running");

    fillTimerProjects(projectId);
    fillTimerTasks(projectId, taskId);
    if (timer) {
      byId("timer-description").value = timer.description;
      byId("timer-billable").checked = timer.billable;
    }
    byId("entry-project").value = projectId;
    fillTimerTasks(projectId, taskId);
    byId("entry-task").value = taskId || "";
    byId("entry-description").value = timer ? timer.description : byId("entry-description").value;
    byId("entry-billable").checked = timer ? timer.billable : byId("entry-billable").checked;
    byId("timer-project").disabled = locked;
    byId("timer-task").disabled = locked;
    byId("timer-description").disabled = locked;
    byId("timer-billable").disabled = locked;
  }

  function renderTimer() {
    var timer = data ? data.timer : null;
    var elapsed = window.MHTimer.getElapsed(timer, new Date().getTime());
    var toggle = byId("timer-toggle");
    var reset = byId("timer-reset");
    var save = byId("timer-save");

    setText(byId("timer-display"), formatElapsed(elapsed));
    setText(byId("timer-error"), "");

    if (!timer) {
      setTimerFormCollapsed(true);
      hide(byId("timer-view"));
      show(byId("new-time-log"));
      setText(byId("timer-state"), "Ready to start");
      setText(toggle, "Start timer");
      hide(save);
      hide(reset);
      reset.disabled = true;
      save.disabled = true;
    } else if (timer.status === "running") {
      setTimerFormCollapsed(true);
      showComposer();
      show(save);
      show(reset);
      setText(byId("active-timer-project"), (window.MHDomain.findById(data.projects, timer.projectId) || {}).name || "Project");
      setText(byId("active-timer-task"), timer.taskId ? " / " + ((window.MHDomain.findById(data.tasks, timer.taskId) || {}).name || "Task") : "");
      setText(byId("active-timer-toggle"), "Pause");
      setText(byId("timer-state"), "Running - saved on this device");
      setText(toggle, "Pause timer");
      reset.disabled = false;
      save.disabled = false;
    } else {
      setTimerFormCollapsed(true);
      showComposer();
      show(save);
      show(reset);
      setText(byId("active-timer-project"), (window.MHDomain.findById(data.projects, timer.projectId) || {}).name || "Project");
      setText(byId("active-timer-task"), timer.taskId ? " / " + ((window.MHDomain.findById(data.tasks, timer.taskId) || {}).name || "Task") : "");
      setText(byId("active-timer-toggle"), "Resume");
      setText(byId("timer-state"), "Paused - elapsed time is saved");
      setText(toggle, "Resume timer");
      reset.disabled = false;
      save.disabled = false;
    }
  }

  function saveTimerChange(nextTimer, successMessage) {
    var previousTimer = data.timer;

    data.timer = nextTimer;
    try {
      repository.save(data);
      renderTimer();
      startTimerRefresh();
      setNotice("success", successMessage);
    } catch (error) {
      data.timer = previousTimer;
      renderTimer();
      setText(byId("timer-error"), error.message);
      setNotice("error", error.message);
    }
  }

  function toggleTimer() {
    var now = new Date().getTime();
    var projectId = byId("timer-project").value;
    var taskId = byId("timer-task").value || null;
    var project = window.MHDomain.findById(data.projects, projectId);
    var task = taskId ? window.MHDomain.findById(data.tasks, taskId) : null;
    var details;

    if (!storageStatus.available) {
      setText(byId("timer-error"), "Local storage is unavailable. The timer cannot be started safely.");
      return;
    }

    if (data.timer && data.timer.status === "running") {
      saveTimerChange(window.MHTimer.pause(data.timer, now), "The timer was paused and saved.");
    } else {
      if (!project || project.archived) {
        setText(byId("timer-error"), "Select an active project before starting the timer.");
        return;
      }
      if (task && (task.projectId !== projectId || task.archived)) {
        setText(byId("timer-error"), "Select an active task belonging to this project.");
        return;
      }
      details = {
        projectId: projectId,
        taskId: taskId,
        description: window.MHDomain.trim(byId("timer-description").value),
        billable: byId("timer-billable").checked,
        startedDate: data.timer && data.timer.startedDate ? data.timer.startedDate : window.MHDomain.dateKey(new Date())
      };
      if (data.timer) {
        data.timer.projectId = details.projectId;
        data.timer.taskId = details.taskId;
        data.timer.description = details.description;
        data.timer.billable = details.billable;
        data.timer.startedDate = details.startedDate;
      }
      saveTimerChange(window.MHTimer.start(data.timer, now, details), "The timer is running and will survive reloads.");
    }
    renderTimerAssignment(data.timer);
  }

  function stopAndSaveTimer() {
    var timer = data.timer;
    var elapsedSeconds;
    var now;
    var entry;
    var projectId = byId("timer-project").value;
    var taskId = byId("timer-task").value || null;
    var project = window.MHDomain.findById(data.projects, projectId);
    var task = taskId ? window.MHDomain.findById(data.tasks, taskId) : null;

    if (!timer || !project) {
      setText(byId("timer-error"), "Assign the timer to a project before saving it.");
      return;
    }
    if (task && task.projectId !== projectId) {
      setText(byId("timer-error"), "The selected task does not belong to this project.");
      return;
    }
    timer.projectId = projectId;
    timer.taskId = taskId;
    timer.description = window.MHDomain.trim(byId("timer-description").value);
    timer.billable = byId("timer-billable").checked;
    elapsedSeconds = Math.max(1, Math.floor(window.MHTimer.getElapsed(timer, new Date().getTime()) / 1000));
    now = new Date().toISOString();
    entry = window.MHDomain.createTimerEntry(
      timer,
      elapsedSeconds * 1000,
      now,
      "entry-" + String(new Date().getTime()) + "-" + String(Math.floor(Math.random() * 100000)),
      window.MHDomain.dateKey(new Date())
    );
    data.timeEntries.push(entry);
    data.timer = null;
    data.settings.selectedDate = entry.date;
    try {
      repository.save(data);
      stopTimerRefresh();
      renderTimer();
      renderTimerAssignment(null);
      window.MHProduct.renderAll();
      setNotice("success", "Timer saved as " + window.MHDomain.formatDurationSeconds(elapsedSeconds) + ".");
    } catch (error) {
      data.timeEntries.pop();
      data.timer = timer;
      renderTimer();
      setText(byId("timer-error"), error.message);
      setNotice("error", error.message);
    }
  }

  function resetTimer() {
    if (!data.timer) {
      return;
    }

    if (window.confirm("Cancel this timer without saving a time entry?")) {
      saveTimerChange(null, "The timer was cancelled. No entry was created.");
      renderTimerAssignment(null);
    }
  }

  function changeTimerProject() {
    fillTimerTasks(byId("timer-project").value, "");
  }

  function syncTimerFromEntry() {
    var projectId = byId("entry-project").value;
    var taskId = byId("entry-task").value;
    if (window.MHProduct && window.MHProduct.renderAll) {
      window.MHProduct.renderAll();
      byId("entry-project").value = projectId;
      byId("entry-task").value = taskId;
    }
    byId("timer-project").value = byId("entry-project").value;
    fillTimerTasks(byId("timer-project").value, byId("entry-task").value);
    byId("timer-task").value = byId("entry-task").value;
    byId("timer-description").value = byId("entry-description").value;
    byId("timer-billable").checked = byId("entry-billable").checked;
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
      ["Projects", data ? data.projects.length : 0],
      ["Tasks", data ? data.tasks.length : 0],
      ["Time entries", data ? data.timeEntries.length : 0],
      ["Last saved", data && data.metadata.updatedAt ? data.metadata.updatedAt : "Never"],
      ["Timer state", data && data.timer ? data.timer.status : "Not started"],
      ["Timer elapsed", data && data.timer ? formatElapsed(window.MHTimer.getElapsed(data.timer, new Date().getTime())) : "00:00:00"],
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
    byId("nav-today").onclick = function () {
      setActiveView("today");
    };
    byId("nav-projects").onclick = function () {
      setActiveView("projects");
    };
    byId("nav-records").onclick = function () {
      setActiveView("records");
    };
    byId("nav-week").onclick = function () {
      setActiveView("week");
    };
    byId("nav-diagnostics").onclick = function () {
      setActiveView("diagnostics");
    };
    byId("sidebar-toggle").onclick = toggleSidebar;
    byId("date-previous").onclick = function () { moveSelectedDate(-1); };
    byId("date-next").onclick = function () { moveSelectedDate(1); };
    byId("date-today").onclick = selectToday;
    byId("group-logs").onclick = function () {
      var button = byId("group-logs");
      var active = (" " + button.className + " ").indexOf(" is-selected ") !== -1;
      window.MHProduct.setGroupedView(!active);
      button.className = active ? "toolbar-icon" : "toolbar-icon is-selected";
      button.setAttribute("aria-pressed", active ? "false" : "true");
    };
    byId("show-favorites").onclick = function () {
      var panel = byId("favorites-panel");
      var hidden = (" " + panel.className + " ").indexOf(" is-hidden ") !== -1;
      if (hidden) {
        renderFavorites();
        show(panel);
      } else {
        hide(panel);
      }
    };
    byId("add-favorite").onclick = openFavoriteModal;
    byId("edit-favorites").onclick = openFavoriteEditor;
    byId("favorite-editor-close").onclick = closeFavoriteEditor;
    byId("favorite-editor-done").onclick = closeFavoriteEditor;
    byId("favorite-modal-close").onclick = closeFavoriteModal;
    byId("favorite-cancel").onclick = closeFavoriteModal;
    byId("favorite-form").onsubmit = saveFavorite;
    byId("favorite-project").onchange = function () {
      fillFavoriteTasks(byId("favorite-project").value, "");
    };
    byId("favorite-list").onclick = handleFavoriteClick;
    byId("favorite-editor-list").onclick = handleFavoriteEditorClick;
    byId("favorite-editor-list").ondragstart = handleFavoriteDragStart;
    byId("favorite-editor-list").ondragover = function (event) { event.preventDefault(); };
    byId("favorite-editor-list").ondrop = handleFavoriteDrop;
    byId("refresh-diagnostics").onclick = renderDiagnostics;
    byId("copy-diagnostics").onclick = copyDiagnostics;
    byId("safe-mode").onclick = function () { window.location.href = window.location.pathname + "?safe=1"; };
    byId("new-time-log").onclick = showComposer;
    byId("composer-dismiss").onclick = dismissComposer;
    byId("composer-dismiss-action").onclick = dismissComposer;
    byId("active-timer-toggle").onclick = toggleTimer;
    byId("active-timer-save").onclick = stopAndSaveTimer;
    byId("active-timer-reset").onclick = resetTimer;
    byId("dismiss-guide").onclick = function () {
      byId("first-run-guide").className += " is-hidden";
      try { window.localStorage.setItem("myhours-custom.guide-seen", "yes"); } catch (ignore) {}
    };
    byId("timer-toggle").onclick = toggleTimer;
    byId("timer-save").onclick = stopAndSaveTimer;
    byId("timer-reset").onclick = resetTimer;
    byId("timer-project").onchange = changeTimerProject;
    byId("entry-project").onchange = syncTimerFromEntry;
    byId("entry-task").onchange = syncTimerFromEntry;
    byId("entry-description").onchange = syncTimerFromEntry;
    byId("entry-billable").onchange = syncTimerFromEntry;
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        renderTimer();
        startTimerRefresh();
      }
    }, false);
    window.addEventListener("pageshow", function () {
      renderTimer();
      startTimerRefresh();
    }, false);
    window.onorientationchange = function () {
      window.setTimeout(renderDiagnostics, 200);
    };
  }

  function boot() {
    var browserStorage;
    var entryPanel;
    var timerCard;
    var todayView;

    if (!window.MHStorage || !window.MHTimer || !window.MHDomain || !window.MHProduct || !window.MHWeekly || !window.MHBackup) {
      setNotice("error", "A required application component did not load. Check the network and reload.");
      return;
    }

    try {
      setSidebarCollapsed(window.localStorage.getItem("myhours-custom.sidebar-collapsed") === "yes");
    } catch (sidebarError) {
      setSidebarCollapsed(false);
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

    if (!data.settings.favorites) {
      data.settings.favorites = [];
    }

    entryPanel = byId("entry-form").parentNode;
    todayView = byId("today-view");
    todayView.insertBefore(byId("timer-view"), byId("track-toolbar").nextSibling);
    timerCard = byId("timer-view").getElementsByTagName("div")[0];
    byId("timer-view").className = "panel timer-panel";
    timerCard.appendChild(byId("entry-form"));
    byId("entry-form").appendChild(byId("timer-actions"));
    entryPanel.className += " is-hidden";

    setText(byId("version-label"), "v" + APP_VERSION);
    try {
      if (!safeMode && !window.localStorage.getItem("myhours-custom.guide-seen") && !data.records.length && !data.projects.length && !data.timeEntries.length) {
        byId("first-run-guide").className = byId("first-run-guide").className.replace(/\bis-hidden\b/g, "");
      }
    } catch (guideError) {}
    window.MHProduct.init({
      data: data,
      repository: repository,
      storageStatus: storageStatus,
      domain: window.MHDomain,
      notify: setNotice
    });
    window.MHWeekly.init({
      data: data,
      repository: repository,
      domain: window.MHDomain,
      editEntry: function (id) {
        window.MHProduct.editEntry(id);
        setActiveView("today");
      }
    });
    window.MHBackup.init({
      data: data,
      repository: repository,
      domain: window.MHDomain,
      notify: setNotice,
      replaceData: function (nextData) {
        data = nextData;
        window.MHProduct.replaceData(nextData);
        window.MHWeekly.render();
        renderRecords();
        renderTimer();
        renderDiagnostics();
      }
    });
    renderRecords();
    renderTimer();
    renderTimerAssignment(data.timer);
    renderFavorites();
    renderDiagnostics();
    bindEvents();
    startTimerRefresh();

    if (safeMode) {
      stopTimerRefresh();
      setNotice("info", "Safe mode is active. Your data is available for backup and diagnostics; automatic timer refresh is paused.");
    }

    if (storageStatus.available && data.timer) {
      setNotice("success", "Recovered your " + data.timer.status + " timer from this device.");
    } else if (storageStatus.available) {
      hide(byId("startup-message"));
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
