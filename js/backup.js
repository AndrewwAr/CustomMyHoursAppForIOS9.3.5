(function (root, document) {
  "use strict";
  var state;
  function byId(id) { return document.getElementById(id); }
  function notice(message, type) { state.notify(type || "success", message); }
  function download(name, content, mime) {
    var blob;
    var url;
    var link;
    byId("backup-output").value = content;
    byId("backup-output").className = "diagnostic-output";
    byId("backup-help").className = "action-status";
    byId("backup-help").textContent = "On this iPad, select and copy this text into Notes or email. Keep the complete text unchanged for restore.";
    byId("backup-copy").className = "button";
    byId("backup-output").focus();
    byId("backup-output").select();
    if (!root.Blob || !root.URL || !root.URL.createObjectURL || /OS 9_/.test(root.navigator.userAgent || "")) {
      notice("The export text is selected below for copying on this iPad.", "info");
      return;
    }
    blob = new root.Blob([content], { type: mime });
    url = root.URL.createObjectURL(blob);
    link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Open export in new page";
    link.className = "button backup-download";
    byId("backup-new-page").innerHTML = "";
    byId("backup-new-page").style.display = "inline-block";
    byId("backup-new-page").style.margin = "0 8px 8px 0";
    byId("backup-new-page").style.verticalAlign = "top";
    byId("backup-new-page").appendChild(link);
    link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.textContent = "Download " + name;
    link.className = "button button-primary backup-download";
    byId("backup-download").innerHTML = "";
    byId("backup-download").style.display = "inline-block";
    byId("backup-download").style.margin = "0 8px 8px 0";
    byId("backup-download").style.verticalAlign = "top";
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
  function copyExport() {
    var copied = false;
    byId("backup-output").focus();
    byId("backup-output").select();
    try { copied = document.execCommand("copy"); } catch (error) { copied = false; }
    notice(copied ? "Export text copied." : "Text is selected; use Copy from the Safari menu.", copied ? "success" : "info");
  }
  function init(options) {
    state = options;
    byId("backup-json").onclick = exportJson;
    byId("backup-csv").onclick = exportCsv;
    byId("backup-file").onchange = importJson;
    byId("backup-copy").onclick = copyExport;
  }
  root.MHBackup = { init: init };
}(this, document));
