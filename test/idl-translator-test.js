"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    _ = require("underscore"),
    path = require("path"),
    idlTranslator = require("../lib/idl/idl-translator"),
    Translator = idlTranslator.Translator,
    nodeModules = require("../lib/node-modules");


var testPackage = path.join(__dirname, "idl-test-package"),
    buildUtils;
var argv = {
    platform: "ios"
};


var nodeModule, translator;
function setup() {
    nodeModules.argv(argv);
    idlTranslator.argv(argv);
    nodeModule = nodeModules.module(testPackage).crawlAll();
    // TODO calculating paths should be a bit easier than this.
    buildUtils = require("../lib/build-utils-" + argv.platform).create(argv, nodeModule);
    buildUtils.calculatePaths(nodeModule);
    translator = new Translator();
}

test("Full flow", function (t) {
    setup();
    var fileMap = translator.translate(nodeModule);
    t.ok(fileMap);
    t.equal(_.size(fileMap), 5); // one native one for each file, and one for a module in javascript
    t.end();
});