(function (root, document) {
  "use strict";

  var state;
  var groupedView = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function text(element, value) {
    element.textContent = String(value);
  }

  function show(element) {
    element.className = element.className.replace(/(?:^|\s)is-hidden(?:\s|$)/g, " ");
  }

  function hide(element) {
    if ((" " + element.className + " ").indexOf(" is-hidden ") === -1) {
      element.className += " is-hidden";
    }
  }

  function createId(prefix) {
    return prefix + "-" + new Date().getTime() + "-" + Math.floor(Math.random() * 100000);
  }

  function replaceData(restored) {
    var key;

    for (key in state.data) {
      if (Object.prototype.hasOwnProperty.call(state.data, key)) {
        delete state.data[key];
      }
    }

    for (key in restored) {
      if (Object.prototype.hasOwnProperty.call(restored, key)) {
        state.data[key] = restored[key];
      }
    }
  }

  function saveMutation(mutator, errorElement, successMessage) {
    var backup = JSON.stringify(state.data);

    text(errorElement, "");
    try {
      mutator();
      state.repository.save(state.data);
      renderAll();
      state.notify("success", successMessage);
      return true;
    } catch (error) {
      replaceData(JSON.parse(backup));
      renderAll();
      text(errorElement, error.message);
      state.notify("error", error.message);
      return false;
    }
  }

  function appendOption(select, value, label, selected) {
    var option = document.createElement("option");
    option.value = value;
    text(option, label);
    option.selected = selected === value;
    select.appendChild(option);
  }

  function clearChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function fillProjectSelect(select, selectedId, allowArchivedSelected) {
    var projects = state.data.projects;
    var project;
    var index;

    clearChildren(select);
    appendOption(select, "", projects.length ? "Select a project" : "Create a project first", selectedId);

    for (index = 0; index < projects.length; index += 1) {
      project = projects[index];
      if (!project.archived || (allowArchivedSelected && project.id === selectedId)) {
        appendOption(select, project.id, project.name + (project.archived ? " (archived)" : ""), selectedId);
      }
    }
  }

  function fillTaskSelect(select, projectId, selectedId) {
    var tasks = state.domain.tasksForProject(state.data.tasks, projectId, selectedId);
    var index;
    var task;
    var visit = function (parentId, prefix) {
      var children = state.domain.childrenOfTask(tasks, parentId, true);
      var childIndex;
      for (childIndex = 0; childIndex < children.length; childIndex += 1) {
        task = children[childIndex];
        appendOption(select, task.id, prefix + task.name + (task.archived ? " (archived)" : ""), selectedId);
        visit(task.id, prefix + "  ");
      }
    };

    clearChildren(select);
    appendOption(select, "", "No task", selectedId);
    visit(null, "");
  }

  function fillParentTaskSelect(projectId, selectedId, excludedId) {
    var select = byId("task-parent");
    var tasks = state.domain.tasksForProject(state.data.tasks, projectId, selectedId);
    var visit = function (parentId, prefix) {
      var children = state.domain.childrenOfTask(tasks, parentId, true);
      var index;
      var task;
      for (index = 0; index < children.length; index += 1) {
        task = children[index];
        if (task.id !== excludedId && !state.domain.isDescendant(tasks, task.id, excludedId)) {
          appendOption(select, task.id, prefix + task.name + (task.archived ? " (archived)" : ""), selectedId);
          visit(task.id, prefix + "  ");
        }
      }
    };
    if (!select) { return; }
    clearChildren(select);
    appendOption(select, "", "No parent (top level)", selectedId || "");
    visit(null, "");
  }

  function resetProjectForm() {
    byId("project-id").value = "";
    byId("project-name").value = "";
    byId("project-color").value = "#3b8fc2";
    text(byId("project-error"), "");
    text(byId("project-submit"), "Add project");
    hide(byId("project-cancel"));
  }

  function resetTaskForm() {
    byId("task-id").value = "";
    byId("task-name").value = "";
    text(byId("task-error"), "");
    text(byId("task-submit"), "Add task");
    hide(byId("task-cancel"));
    fillProjectSelect(byId("task-project"), "", false);
    fillParentTaskSelect("", "", "");
  }

  function resetEntryForm() {
    byId("entry-id").value = "";
    byId("entry-hours").value = "0";
    byId("entry-minutes").value = "0";
    byId("entry-seconds").value = "0";
    byId("entry-start").value = "";
    byId("entry-end").value = "";
    byId("entry-description").value = "";
    byId("entry-tag").value = "";
    byId("entry-billable").checked = true;
    text(byId("entry-error"), "");
    text(byId("entry-submit"), "Add time entry");
    hide(byId("entry-cancel"));
    fillProjectSelect(byId("entry-project"), "", false);
    fillTaskSelect(byId("entry-task"), "", "");
  }

  function saveProject(event) {
    var id = byId("project-id").value;
    var name = state.domain.trim(byId("project-name").value);
    var color = byId("project-color").value;
    var existing = state.domain.findById(state.data.projects, id);
    var now = new Date().toISOString();

    event.preventDefault();
    if (!name) {
      text(byId("project-error"), "Enter a project name.");
      byId("project-name").focus();
      return;
    }

    if (state.domain.hasDuplicateName(state.data.projects, name, undefined, id)) {
      text(byId("project-error"), "An active project already uses this name.");
      return;
    }

    if (saveMutation(function () {
      if (existing) {
        existing.name = name;
        existing.color = color;
        existing.updatedAt = now;
      } else {
        state.data.projects.push({
          id: createId("project"),
          name: name,
          color: color,
          archived: false,
          createdAt: now,
          updatedAt: now
        });
      }
    }, byId("project-error"), existing ? "Project updated." : "Project created.")) {
      resetProjectForm();
      resetTaskForm();
      resetEntryForm();
      renderAll();
    }
  }

  function saveTask(event) {
    var id = byId("task-id").value;
    var projectId = byId("task-project").value;
    var parentTaskId = byId("task-parent").value || null;
    var name = state.domain.trim(byId("task-name").value);
    var existing = state.domain.findById(state.data.tasks, id);
    var project = state.domain.findById(state.data.projects, projectId);
    var now = new Date().toISOString();

    event.preventDefault();
    if (!project || project.archived) {
      text(byId("task-error"), "Select an active project.");
      return;
    }
    if (parentTaskId) {
      var parentTask = state.domain.findById(state.data.tasks, parentTaskId);
      if (!parentTask || parentTask.projectId !== projectId || (existing && (parentTask.id === existing.id || state.domain.isDescendant(state.data.tasks, parentTask.id, existing.id)))) {
        text(byId("task-error"), "Choose a valid parent task from this project.");
        return;
      }
    }
    if (!name) {
      text(byId("task-error"), "Enter a task name.");
      byId("task-name").focus();
      return;
    }
    var siblingDuplicate = state.data.tasks.some(function (candidate) {
      return candidate.id !== id && !candidate.archived && candidate.projectId === projectId &&
        (candidate.parentTaskId || null) === parentTaskId && state.domain.trim(candidate.name).toLowerCase() === name.toLowerCase();
    });
    if (siblingDuplicate) {
      text(byId("task-error"), "This parent already has an active task with that name.");
      return;
    }

    if (saveMutation(function () {
      if (existing) {
        existing.projectId = projectId;
        existing.name = name;
        existing.parentTaskId = parentTaskId;
        existing.updatedAt = now;
      } else {
        state.data.tasks.push({
          id: createId("task"),
          projectId: projectId,
          name: name,
          parentTaskId: parentTaskId,
          archived: false,
          createdAt: now,
          updatedAt: now
        });
      }
    }, byId("task-error"), existing ? "Task updated." : "Task created.")) {
      resetTaskForm();
      resetEntryForm();
      renderAll();
    }
  }

  function saveEntry(event) {
    var id = byId("entry-id").value;
    var date = byId("selected-date").value;
    var projectId = byId("entry-project").value;
    var taskId = byId("entry-task").value || null;
    var duration = state.domain.parseDurationSeconds(byId("entry-hours").value, byId("entry-minutes").value, byId("entry-seconds").value);
    var project = state.domain.findById(state.data.projects, projectId);
    var task = taskId ? state.domain.findById(state.data.tasks, taskId) : null;
    var existing = state.domain.findById(state.data.timeEntries, id);
    var now = new Date().toISOString();

    event.preventDefault();
    if (!state.domain.isValidDateKey(date)) {
      text(byId("entry-error"), "Enter a valid date in YYYY-MM-DD format.");
      return;
    }
    if (!project || (project.archived && (!existing || existing.projectId !== projectId))) {
      text(byId("entry-error"), "Select an active project.");
      return;
    }
    if (task && (task.projectId !== projectId || (task.archived && (!existing || existing.taskId !== taskId)))) {
      text(byId("entry-error"), "Select a task belonging to this project.");
      return;
    }
    if (!duration.valid) {
      text(byId("entry-error"), duration.message);
      return;
    }

    if (saveMutation(function () {
      if (existing) {
        existing.date = date;
        existing.projectId = projectId;
        existing.taskId = taskId;
        existing.durationSeconds = duration.seconds;
        existing.startTime = state.domain.trim(byId("entry-start").value);
        existing.endTime = state.domain.trim(byId("entry-end").value);
        existing.description = state.domain.trim(byId("entry-description").value);
        existing.tag = state.domain.trim(byId("entry-tag").value);
        existing.billable = byId("entry-billable").checked;
        existing.updatedAt = now;
      } else {
        state.data.timeEntries.push({
          id: createId("entry"),
          date: date,
          projectId: projectId,
          taskId: taskId,
          durationSeconds: duration.seconds,
          startTime: state.domain.trim(byId("entry-start").value),
          endTime: state.domain.trim(byId("entry-end").value),
          description: state.domain.trim(byId("entry-description").value),
          tag: state.domain.trim(byId("entry-tag").value),
          billable: byId("entry-billable").checked,
          createdAt: now,
          updatedAt: now
        });
      }
      state.data.settings.selectedDate = date;
    }, byId("entry-error"), existing ? "Time entry updated." : "Time entry added.")) {
      resetEntryForm();
      renderAll();
    }
  }

  function editProject(id) {
    var project = state.domain.findById(state.data.projects, id);
    if (!project) {
      return;
    }
    byId("project-id").value = project.id;
    byId("project-name").value = project.name;
    byId("project-color").value = project.color;
    text(byId("project-submit"), "Save project");
    show(byId("project-cancel"));
    byId("project-name").focus();
  }

  function editTask(id) {
    var task = state.domain.findById(state.data.tasks, id);
    if (!task) {
      return;
    }
    byId("task-id").value = task.id;
    fillProjectSelect(byId("task-project"), task.projectId, false);
    fillParentTaskSelect(task.projectId, task.parentTaskId || "", task.id);
    byId("task-name").value = task.name;
    text(byId("task-submit"), "Save task");
    show(byId("task-cancel"));
    byId("task-name").focus();
  }

  function addSubtask(parentId) {
    var parent = state.domain.findById(state.data.tasks, parentId);
    if (!parent) { return; }
    resetTaskForm();
    fillProjectSelect(byId("task-project"), parent.projectId, false);
    fillParentTaskSelect(parent.projectId, parent.id, "");
    byId("task-parent").value = parent.id;
    byId("task-name").focus();
  }

  function editEntry(id) {
    var entry = state.domain.findById(state.data.timeEntries, id);
    if (!entry) {
      return;
    }
    byId("entry-id").value = entry.id;
    byId("selected-date").value = entry.date;
    state.data.settings.selectedDate = entry.date;
    fillProjectSelect(byId("entry-project"), entry.projectId, true);
    fillTaskSelect(byId("entry-task"), entry.projectId, entry.taskId || "");
    byId("entry-hours").value = String(Math.floor(entry.durationSeconds / 3600));
    byId("entry-minutes").value = String(Math.floor((entry.durationSeconds % 3600) / 60));
    byId("entry-seconds").value = String(entry.durationSeconds % 60);
    byId("entry-start").value = entry.startTime || "";
    byId("entry-end").value = entry.endTime || "";
    byId("entry-tag").value = entry.tag || "";
    byId("entry-description").value = entry.description;
    byId("entry-billable").checked = entry.billable;
    text(byId("entry-submit"), "Save time entry");
    show(byId("entry-cancel"));
    root.scrollTo(0, 0);
  }

  function removeItems(items, ids) {
    var kept = [];
    var index;
    for (index = 0; index < items.length; index += 1) {
      if (ids.indexOf(items[index].id) === -1) { kept.push(items[index]); }
    }
    return kept;
  }

  function deleteProject(id) {
    var project = state.domain.findById(state.data.projects, id);
    var taskIds;
    var entryCount = 0;
    var index;
    if (!project) { return; }
    taskIds = state.data.tasks.filter(function (task) { return task.projectId === id; }).map(function (task) { return task.id; });
    for (index = 0; index < state.data.timeEntries.length; index += 1) {
      if (state.data.timeEntries[index].projectId === id) { entryCount += 1; }
    }
    if (!root.confirm("Delete project '" + project.name + "' and its " + taskIds.length + " task(s)" + (entryCount ? " and " + entryCount + " time entr" + (entryCount === 1 ? "y" : "ies") : "") + "? This cannot be undone.")) {
      return;
    }
    saveMutation(function () {
      state.data.projects = removeItems(state.data.projects, [id]);
      state.data.tasks = removeItems(state.data.tasks, taskIds);
      state.data.timeEntries = state.data.timeEntries.filter(function (entry) { return entry.projectId !== id; });
      state.data.settings.favorites = (state.data.settings.favorites || []).filter(function (favorite) { return favorite.projectId !== id; });
      if (state.data.timer && state.data.timer.projectId === id) { state.data.timer = null; }
    }, byId("project-error"), "Project deleted.");
    resetProjectForm();
    resetTaskForm();
    resetEntryForm();
  }

  function deleteTask(id) {
    var task = state.domain.findById(state.data.tasks, id);
    var taskIds;
    var entryCount = 0;
    var index;
    if (!task) { return; }
    taskIds = [id].concat(state.domain.descendantsOfTask(state.data.tasks, id).map(function (item) { return item.id; }));
    for (index = 0; index < state.data.timeEntries.length; index += 1) {
      if (taskIds.indexOf(state.data.timeEntries[index].taskId) !== -1) { entryCount += 1; }
    }
    if (!root.confirm("Delete task '" + task.name + "' and its " + (taskIds.length - 1) + " subtask(s)" + (entryCount ? " and " + entryCount + " time entr" + (entryCount === 1 ? "y" : "ies") : "") + "? This cannot be undone.")) {
      return;
    }
    saveMutation(function () {
      state.data.tasks = removeItems(state.data.tasks, taskIds);
      state.data.timeEntries = state.data.timeEntries.filter(function (entry) { return taskIds.indexOf(entry.taskId) === -1; });
      state.data.settings.favorites = (state.data.settings.favorites || []).filter(function (favorite) { return taskIds.indexOf(favorite.taskId) === -1; });
      if (state.data.timer && taskIds.indexOf(state.data.timer.taskId) !== -1) { state.data.timer = null; }
    }, byId("task-error"), "Task deleted.");
    resetTaskForm();
    resetEntryForm();
  }

  function duplicateEntry(id) {
    var entry = state.domain.findById(state.data.timeEntries, id);
    var now = new Date().toISOString();
    if (!entry) {
      return;
    }
    saveMutation(function () {
      state.data.timeEntries.push({
        id: createId("entry"),
        date: entry.date,
        projectId: entry.projectId,
        taskId: entry.taskId,
        durationSeconds: entry.durationSeconds,
        startTime: entry.startTime || "",
        endTime: entry.endTime || "",
        description: entry.description,
        tag: entry.tag || "",
        billable: entry.billable,
        createdAt: now,
        updatedAt: now
      });
    }, byId("entry-error"), "Time entry duplicated.");
  }

  function deleteEntry(id) {
    var entry = state.domain.findById(state.data.timeEntries, id);
    var index;
    if (!entry || !root.confirm("Delete this time entry?")) {
      return;
    }
    saveMutation(function () {
      for (index = 0; index < state.data.timeEntries.length; index += 1) {
        if (state.data.timeEntries[index].id === id) {
          state.data.timeEntries.splice(index, 1);
          break;
        }
      }
    }, byId("entry-error"), "Time entry deleted.");
    resetEntryForm();
  }

  function actionButton(label, action, id, danger) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "button" + (danger ? " button-danger" : "");
    button.setAttribute("data-action", action);
    button.setAttribute("data-id", id);
    text(button, label);
    return button;
  }

  function renderProjects() {
    var list = byId("project-list");
    var project;
    var card;
    var heading;
    var title;
    var actions;
    var tasks;
    var taskList;
    var taskItem;
    var taskActions;
    var index;
    var taskIndex;

    clearChildren(list);
    text(byId("project-count"), state.data.projects.length);
    if (!state.data.projects.length) {
      show(byId("projects-empty"));
    } else {
      hide(byId("projects-empty"));
    }

    for (index = 0; index < state.data.projects.length; index += 1) {
      project = state.data.projects[index];
      card = document.createElement("div");
      card.className = "project-card" + (project.archived ? " is-archived" : "");
      card.style.borderLeftColor = project.color;
      heading = document.createElement("div");
      heading.className = "project-card-heading";
      title = document.createElement("h3");
      text(title, project.name + (project.archived ? " (archived)" : ""));
      actions = document.createElement("div");
      actions.className = "project-actions";
      if (!project.archived) {
        actions.appendChild(actionButton("Edit", "project-edit", project.id, false));
      }
      actions.appendChild(actionButton("Delete", "project-delete", project.id, true));
      heading.appendChild(title);
      heading.appendChild(actions);
      card.appendChild(heading);

      tasks = state.data.tasks.filter(function (candidate) {
        return candidate.projectId === project.id;
      });
      taskList = document.createElement("ul");
      taskList.className = "task-list";
      if (!tasks.length) {
        taskItem = document.createElement("li");
        taskItem.className = "task-item";
        text(taskItem, "No tasks");
        taskList.appendChild(taskItem);
      }
      var renderTaskTree = function (parentId, container) {
        var children = state.domain.childrenOfTask(tasks, parentId, true);
        var childIndex;
        var child;
        var nested;
        for (childIndex = 0; childIndex < children.length; childIndex += 1) {
          child = children[childIndex];
          taskItem = document.createElement("li");
          taskItem.className = "task-item" + (child.archived ? " is-archived" : "");
          text(taskItem, child.name + (child.archived ? " (archived)" : ""));
          taskActions = document.createElement("span");
          taskActions.className = "task-actions";
          if (!child.archived && !project.archived) {
            taskActions.appendChild(actionButton("Edit", "task-edit", child.id, false));
            taskActions.appendChild(actionButton("+ Subtask", "task-add-child", child.id, false));
          }
          taskActions.appendChild(actionButton("Delete", "task-delete", child.id, true));
          taskItem.appendChild(taskActions);
          container.appendChild(taskItem);
          nested = document.createElement("ul");
          nested.className = "task-list task-children";
          renderTaskTree(child.id, nested);
          if (nested.firstChild) { container.appendChild(nested); }
        }
      };
      renderTaskTree(null, taskList);
      card.appendChild(taskList);
      list.appendChild(card);
    }
  }

  function renderEntries() {
    var selectedDate = state.data.settings.selectedDate || state.domain.dateKey(new Date());
    var entries = state.domain.entriesForDate(state.data.timeEntries, selectedDate);
    var list = byId("entry-list");
    var entry;
    var project;
    var task;
    var item;
    var title;
    var description;
    var meta;
    var duration;
    var actions;
    var index;
    var groups;
    var group;
    var groupKey;

    state.data.settings.selectedDate = selectedDate;
    byId("selected-date").value = selectedDate;
    text(byId("entries-date-label"), selectedDate);
    text(byId("day-total"), state.domain.formatDurationSeconds(state.domain.totalForDate(state.data.timeEntries, selectedDate)));
    clearChildren(list);
    entries.length ? hide(byId("entries-empty")) : show(byId("entries-empty"));

    if (groupedView) {
      groups = [];
      for (index = 0; index < entries.length; index += 1) {
        groupKey = entries[index].projectId + "|" + (entries[index].taskId || "");
        group = null;
        for (var groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
          if (groups[groupIndex].key === groupKey) { group = groups[groupIndex]; break; }
        }
        if (!group) {
          group = { key: groupKey, entry: entries[index], seconds: 0, count: 0 };
          groups.push(group);
        }
        group.seconds += entries[index].durationSeconds;
        group.count += 1;
      }
      for (index = 0; index < groups.length; index += 1) {
        group = groups[index];
        project = state.domain.findById(state.data.projects, group.entry.projectId);
        task = group.entry.taskId ? state.domain.findById(state.data.tasks, group.entry.taskId) : null;
        item = document.createElement("li");
        item.className = "entry-item grouped-entry";
        item.style.borderLeftColor = project ? project.color : "#667985";
        title = document.createElement("span");
        title.className = "entry-title";
        text(title, (project ? project.name : "Unknown project") + (task ? " / " + state.domain.taskPath(state.data.tasks, task.id) : ""));
        description = document.createElement("span");
        description.className = "entry-description";
        text(description, String(group.count) + " log" + (group.count === 1 ? "" : "s") + " grouped");
        duration = document.createElement("span");
        duration.className = "entry-duration";
        text(duration, state.domain.formatDurationSeconds(group.seconds));
        item.appendChild(title);
        item.appendChild(description);
        item.appendChild(duration);
        list.appendChild(item);
      }
      return;
    }

    for (index = 0; index < entries.length; index += 1) {
      entry = entries[index];
      project = state.domain.findById(state.data.projects, entry.projectId);
      task = entry.taskId ? state.domain.findById(state.data.tasks, entry.taskId) : null;
      item = document.createElement("li");
      item.className = "entry-item";
      item.style.borderLeftColor = project ? project.color : "#667985";
      title = document.createElement("span");
      title.className = "entry-title";
      text(title, (project ? project.name : "Unknown project") + (task ? " / " + state.domain.taskPath(state.data.tasks, task.id) : ""));
      description = document.createElement("span");
      description.className = "entry-description";
      text(description, entry.description || "No description");
      meta = document.createElement("span");
      meta.className = "entry-meta";
      text(meta, entry.billable ? "Billable" : "Non-billable");
      duration = document.createElement("span");
      duration.className = "entry-duration";
      text(duration, state.domain.formatDurationSeconds(entry.durationSeconds));
      actions = document.createElement("span");
      actions.className = "entry-actions";
      actions.appendChild(actionButton("Edit", "entry-edit", entry.id, false));
      actions.appendChild(actionButton("Copy", "entry-duplicate", entry.id, false));
      actions.appendChild(actionButton("Delete", "entry-delete", entry.id, true));
      item.appendChild(title);
      item.appendChild(description);
      item.appendChild(meta);
      item.appendChild(duration);
      item.appendChild(actions);
      list.appendChild(item);
    }
  }

  function renderFormOptions() {
    var editingEntry = state.domain.findById(state.data.timeEntries, byId("entry-id").value);
    var currentProject = byId("entry-project").value;
    var currentTask = byId("entry-task").value;
    var taskProject = byId("task-project").value;

    fillProjectSelect(byId("entry-project"), currentProject, !!editingEntry);
    fillTaskSelect(byId("entry-task"), byId("entry-project").value, currentTask);
    fillProjectSelect(byId("task-project"), taskProject, false);
    fillParentTaskSelect(byId("task-project").value, byId("task-parent").value || "", byId("task-id").value);
  }

  function renderAll() {
    renderProjects();
    renderEntries();
    renderFormOptions();
  }

  function handleProjectActions(event) {
    var target = event.target || event.srcElement;
    var action;
    var id;
    if (!target || target.tagName.toLowerCase() !== "button") {
      return;
    }
    action = target.getAttribute("data-action");
    id = target.getAttribute("data-id");
    if (action === "project-edit") { editProject(id); }
    if (action === "project-delete") { deleteProject(id); }
    if (action === "task-edit") { editTask(id); }
    if (action === "task-add-child") { addSubtask(id); }
    if (action === "task-delete") { deleteTask(id); }
  }

  function handleEntryActions(event) {
    var target = event.target || event.srcElement;
    var action;
    var id;
    if (!target || target.tagName.toLowerCase() !== "button") {
      return;
    }
    action = target.getAttribute("data-action");
    id = target.getAttribute("data-id");
    if (action === "entry-edit") { editEntry(id); }
    if (action === "entry-duplicate") { duplicateEntry(id); }
    if (action === "entry-delete") { deleteEntry(id); }
  }

  function changeSelectedDate() {
    var date = byId("selected-date").value;
    if (!state.domain.isValidDateKey(date)) {
      text(byId("entry-error"), "Enter a valid date in YYYY-MM-DD format.");
      return;
    }
    saveMutation(function () {
      state.data.settings.selectedDate = date;
    }, byId("entry-error"), "Selected day changed.");
    resetEntryForm();
    renderAll();
  }

  function bindEvents() {
    byId("project-form").onsubmit = saveProject;
    byId("task-form").onsubmit = saveTask;
    byId("entry-form").onsubmit = saveEntry;
    byId("project-cancel").onclick = resetProjectForm;
    byId("task-cancel").onclick = resetTaskForm;
    byId("entry-cancel").onclick = resetEntryForm;
    byId("project-list").onclick = handleProjectActions;
    byId("entry-list").onclick = handleEntryActions;
    byId("entry-project").onchange = function () {
      fillTaskSelect(byId("entry-task"), byId("entry-project").value, "");
    };
    byId("task-project").onchange = function () {
      fillParentTaskSelect(byId("task-project").value, "", byId("task-id").value);
    };
    byId("selected-date").onchange = changeSelectedDate;
  }

  function init(options) {
    state = options;
    if (!state.data.settings.selectedDate || !state.domain.isValidDateKey(state.data.settings.selectedDate)) {
      state.data.settings.selectedDate = state.domain.dateKey(new Date());
    }
    bindEvents();
    resetProjectForm();
    resetTaskForm();
    resetEntryForm();
    renderAll();
  }

  root.MHProduct = {
    init: init,
    renderAll: renderAll,
    setGroupedView: function (enabled) { groupedView = !!enabled; renderEntries(); },
    editEntry: editEntry,
    replaceData: function (nextData) { state.data = nextData; renderAll(); }
  };
}(this, document));
