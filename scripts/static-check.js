"use strict";

var assert = require("assert");
var fs = require("fs");
var html = fs.readFileSync("index.html", "utf8");

assert.strictEqual(/<script[^>]+type=["']module["']/i.test(html), false, "Module scripts are not allowed.");
assert.strictEqual(/<script[^>]+src=["']https?:/i.test(html), false, "External runtime scripts are not allowed.");
assert.strictEqual(/<link[^>]+href=["']https?:/i.test(html), false, "External runtime styles are not allowed.");
assert.strictEqual(/serviceWorker/i.test(html), false, "Service workers are unavailable on iOS 9.");
assert.ok(/apple-mobile-web-app-capable/i.test(html), "iOS home-screen metadata is required.");
assert.ok(/js\/storage\.js/.test(html), "The storage component must be loaded.");
assert.ok(/js\/app\.js/.test(html), "The application component must be loaded.");

console.log("Static compatibility checks passed.");
