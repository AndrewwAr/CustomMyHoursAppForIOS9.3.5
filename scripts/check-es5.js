"use strict";

var acorn = require("acorn");
var fs = require("fs");
var path = require("path");
var roots = ["js", "scripts", "tests"];
var files = [];

function collect(directory) {
  var entries = fs.readdirSync(directory);
  var index;
  var fullPath;
  var stat;

  for (index = 0; index < entries.length; index += 1) {
    fullPath = path.join(directory, entries[index]);
    stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      collect(fullPath);
    } else if (/\.js$/i.test(entries[index])) {
      files.push(fullPath);
    }
  }
}

function check(file) {
  var source = fs.readFileSync(file, "utf8");
  try {
    acorn.parse(source, {
      ecmaVersion: 5,
      allowHashBang: true
    });
  } catch (error) {
    console.error(file + " is not ECMAScript 5 compatible:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

roots.forEach(collect);
files.forEach(check);

if (!process.exitCode) {
  console.log("ES5 syntax checks passed for " + files.length + " JavaScript files.");
}
