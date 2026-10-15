(function (root, document) {
  "use strict";
  var state;
  function byId(id) { return document.getElementById(id); }
  function notice(message, type) { state.notify(type || "success", message); }
  function download(name, content, mime) {
    var blob;
    var url;
    var link;
    if (!root.Blob || !root.URL || !root.URL.createObjectURL) {
      byId("backup-output").value = content;
      byId("backup-output").className = "diagnostic-output";
      notice("Download is unavailable; the backup text is selected below for manual copying.", "info");
      byId("backup-output").focus();
      byId("backup-output").select();
      return;
    }
    blob = new root.Blob([content], { type: mime });
    url = root.URL.createObjectURL(blob);
    link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.textContent = "Download " + name;
    link.className = "button button-primary backup-download";
    byId("backup-download").innerHTML = "";
    byId("backup-download").appendChild(link);
    notice("Your export is ready. Tap the download link.");
  }
  function exportJson() { download("myhours-backup.json", JSON.stringify(state.data, null, 2), "application/json"); }
  function csvCell(value) { return '"' + String(value === null || typeof value === "undefined" ? "" : value).replace(/"/g, '""') + '"'; }
  function exportCsv() {
    var lines = ["Date,Project,Task,Duration seconds,Description,Billable"];
    var index, entry, project, task;
    for (index = 0; index < state.data.timeEntries.length; index += 1) {
      entry = state.data.timeEntries[index];
      project = state.domain.findById(state.data.projects, entry.projectId);
      task = entry.taskId ? state.domain.findById(state.data.tasks, entry.taskId) : null;
      lines.push([entry.date, project ? project.name : "", task ? task.name : "", entry.durationSeconds, entry.description, entry.billable ? "Yes" : "No"].map(csvCell).join(","));
    }
    download("myhours-entries.csv", lines.join("\r\n"), "text/csv");
  }
  function importJson(event) {
    var file = event.target.files && event.target.files[0];
    var reader;
    if (!file) { return; }
    reader = new root.FileReader();
    reader.onload = function () {
      var imported;
      try { imported = JSON.parse(reader.result); } catch (error) { notice("The backup is not valid JSON.", "error"); return; }
      if (!root.MHStorage.validateData(imported)) { notice("The backup format is not supported or is incomplete.", "error"); return; }
      if (!root.confirm("Restore this backup? Current local data will be replaced.")) { return; }
      try { state.repository.save(imported); state.data = imported; state.replaceData(imported); notice("Backup restored successfully."); }
      catch (saveError) { notice(saveError.message, "error"); }
    };
    reader.readAsText(file);
  }
  function init(options) {
    state = options;
    byId("backup-json").onclick = exportJson;
    byId("backup-csv").onclick = exportCsv;
    byId("backup-file").onchange = importJson;
  }
  root.MHBackup = { init: init };
}(this, document));
