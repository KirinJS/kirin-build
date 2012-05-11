"use strict";

var _ = require("underscore"),
    fs = require("fs"),
    path = require("path"),
    fsHelper = require("./fs-helper"),
    fileFilters = require("./file-filters"),
    filesets = require("./filesets"),
    browserifier = require("./browserifier"),
    argv = {};

exports.argv = function (argv_) {
    if (argv_) {
        argv = argv_;
        browserifier.argv(argv);
        return exports;
    } else {
        return argv;
    }
};

exports.createJavascriptPackage = function (buildUtils, nodeModule) {
    var jsDirectory = argv.jsDirectory || buildUtils.findJavascriptDirectory();
    var distFileset = browserifier.browserify(nodeModule);
    
    nodeModule.copy(jsDirectory).filter(fileFilters.nonBrowserfiable).write(true);
    distFileset.copy(jsDirectory).write();
};
