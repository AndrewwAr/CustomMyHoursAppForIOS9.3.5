(function (root, document) {
  "use strict";

  var state;

  function byId(id) { return document.getElementById(id); }
  function text(element, value) { element.textContent = String(value); }
  function clear(element) { while (element.firstChild) { element.removeChild(element.firstChild); } }

  function option(select, value, label) {
    var item = document.createElement("option");
    item.value = value;
    text(item, label);
    select.appendChild(item);
  }

  function fillProjects() {
    var select = byId("week-project-filter");
    var selected = select.value;
    var index;
    clear(select);
    option(select, "", "All projects");
    for (index = 0; index < state.data.projects.length; index += 1) {
      option(select, state.data.projects[index].id, state.data.projects[index].name);
    }
    select.value = selected;
  }

  function filteredEntries(start, end) {
    var projectId = byId("week-project-filter").value;
    var billable = byId("week-billable-filter").value;
    return state.data.timeEntries.filter(function (entry) {
      return entry.date >= start && entry.date <= end &&
        (!projectId || entry.projectId === projectId) &&
        (!billable || String(entry.billable) === billable);
    });
  }

  function render() {
    var start = state.domain.startOfWeek(state.data.settings.selectedDate || state.domain.dateKey(new Date()));
    var end = state.domain.addDays(start, 6);
    var entries;
    var list = byId("week-list");
    var index;
    var entry;
    var project;
    var task;
    var item;
    var heading;
    var detail;
    var duration;
    var edit;
    var dayTotals;
    var summary = byId("week-summary");
    var groups = {};
    var groupOrder = [];
    var key;
    var row;

    fillProjects();
    entries = filteredEntries(start, end);
    dayTotals = state.domain.dailyTotals(entries, start, 7);
    text(byId("week-range"), start + " to " + end);
    text(byId("week-total"), state.domain.formatDurationSeconds(state.domain.sumDurationSeconds(entries)));
    for (index = 0; index < 7; index += 1) {
      text(byId("week-day-" + index), state.domain.addDays(start, index) + ": " + state.domain.formatDurationSeconds(dayTotals[index]));
    }
    clear(summary);
    for (index = 0; index < entries.length; index += 1) {
      key = entries[index].projectId + "|" + (entries[index].taskId || "");
      if (typeof groups[key] === "undefined") { groups[key] = 0; groupOrder.push(key); }
      groups[key] += entries[index].durationSeconds;
    }
    for (index = 0; index < groupOrder.length; index += 1) {
      key = groupOrder[index];
      entry = entries.filter(function (candidate) {
        return candidate.projectId + "|" + (candidate.taskId || "") === key;
      })[0];
      project = state.domain.findById(state.data.projects, entry.projectId);
      task = entry.taskId ? state.domain.findById(state.data.tasks, entry.taskId) : null;
      row = document.createElement("li");
      text(row, (project ? project.name : "Unknown project") + (task ? " / " + task.name : " / No task") + ": " + state.domain.formatDurationSeconds(groups[key]));
      summary.appendChild(row);
    }
    clear(list);
    if (!entries.length) {
      item = document.createElement("li");
      item.className = "empty-state";
      text(item, "No matching entries in this week.");
      list.appendChild(item);
      return;
    }
    entries.sort(function (left, right) { return left.date < right.date ? 1 : -1; });
    for (index = 0; index < entries.length; index += 1) {
      entry = entries[index];
      project = state.domain.findById(state.data.projects, entry.projectId);
      task = entry.taskId ? state.domain.findById(state.data.tasks, entry.taskId) : null;
      item = document.createElement("li");
      item.className = "entry-item week-entry";
      heading = document.createElement("span");
      heading.className = "entry-title";
      text(heading, entry.date + " — " + (project ? project.name : "Unknown project") + (task ? " / " + task.name : ""));
      detail = document.createElement("span");
      detail.className = "entry-description";
      text(detail, entry.description || "No description");
      duration = document.createElement("span");
      duration.className = "entry-duration";
      text(duration, state.domain.formatDurationSeconds(entry.durationSeconds));
      edit = document.createElement("button");
      edit.type = "button";
      edit.className = "button";
      edit.setAttribute("data-entry-id", entry.id);
      text(edit, "Edit");
      item.appendChild(heading);
      item.appendChild(detail);
      item.appendChild(duration);
      item.appendChild(edit);
      list.appendChild(item);
    }
  }

  function moveWeek(offset) {
    state.data.settings.selectedDate = state.domain.addDays(state.domain.startOfWeek(state.data.settings.selectedDate), offset * 7);
    state.repository.save(state.data);
    render();
  }

  function init(options) {
    state = options;
    byId("week-previous").onclick = function () { moveWeek(-1); };
    byId("week-current").onclick = function () { state.data.settings.selectedDate = state.domain.dateKey(new Date()); state.repository.save(state.data); render(); };
    byId("week-next").onclick = function () { moveWeek(1); };
    byId("week-project-filter").onchange = render;
    byId("week-billable-filter").onchange = render;
    byId("week-list").onclick = function (event) {
      var target = event.target || event.srcElement;
      var id = target && target.getAttribute("data-entry-id");
      if (id) { state.editEntry(id); }
    };
    render();
  }

  root.MHWeekly = { init: init, render: render };
}(this, document));
