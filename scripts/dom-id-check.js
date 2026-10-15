"use strict";

var assert = require("assert");
var fs = require("fs");
var html = fs.readFileSync("index.html", "utf8");
var sources = [fs.readFileSync("js/app.js", "utf8"), fs.readFileSync("js/product.js", "utf8")];
var htmlIds = {};
var usedIds = {};
var match;
var missing = [];
var idPattern = /\bid=["']([^"']+)["']/g;
var byIdPattern = /\bbyId\(["']([^"']+)["']\)/g;
var index;
var key;

while ((match = idPattern.exec(html)) !== null) {
  assert.strictEqual(htmlIds[match[1]], undefined, "Duplicate HTML id: " + match[1]);
  htmlIds[match[1]] = true;
}

for (index = 0; index < sources.length; index += 1) {
  while ((match = byIdPattern.exec(sources[index])) !== null) {
    usedIds[match[1]] = true;
  }
  byIdPattern.lastIndex = 0;
}

for (key in usedIds) {
  if (Object.prototype.hasOwnProperty.call(usedIds, key) && !htmlIds[key]) {
    missing.push(key);
  }
}

assert.deepStrictEqual(missing, [], "JavaScript references missing HTML ids: " + missing.join(", "));
console.log("DOM id checks passed for " + Object.keys(usedIds).length + " references.");
