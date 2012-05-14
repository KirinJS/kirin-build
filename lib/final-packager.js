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
    var jsDirectory = argv.jsDirectory,
        distFileset = browserifier.browserify(nodeModule),
        prefix = "modules",
        modulesPath = path.join(jsDirectory, prefix);
    
    var nonBrowserfiable = nodeModule.copy(jsDirectory).filter(fileFilters.nonBrowserfiable);
    var browserfiable = distFileset.copy(modulesPath);
    
    if (argv.debug) {
        console.log("Writing to jsDirectory: " + nonBrowserfiable.directory);
        console.dir(nonBrowserfiable.files());
        console.log("Writing to jsDirectory: " + browserfiable.directory);
        console.dir(browserfiable.files());
    }

    nonBrowserfiable.write(true);
    browserfiable.write();
    
    
    var allFiles = [];
    var browserfiedFiles = distFileset.fileOrder || browserfiable.relativeFiles();
    var unbrowserifiedFiles = nonBrowserfiable.relativeFiles();
    
    allFiles.push(unbrowserifiedFiles);
    allFiles.push(_.map(browserfiedFiles, function (f) {
        return path.join(prefix, f);
    }));
    
    
    
    buildUtils.writeIndexFile(allFiles);
    
    
    if (!argv.debug) {
        distFileset.remove(true);
    }
    
    console.log("Put javascript into " + argv.jsDirectory);
};

exports.compileNative = function (buildUtils, nodeModule, callback, errback) {
    var childModules = nodeModule.collectAll([]);
    var platform = argv.platform;
    var kirinModules = _.filter(childModules, function (m) {
        return m.kirinInfo && m.kirinInfo.platforms && m.kirinInfo.platforms[platform];
    });
    var i = argv.noDeps ? (kirinModules.length - 1) : 0; 
    
    function next() {
        if (i >= kirinModules.length) {
            callback();
            return;
        }
        
        var theModule = kirinModules[i];
        i++;
        
        console.log("# Compiling native components of " + theModule.name);
        buildUtils.buildNative(theModule, next, errback);
    }
   
    next();
};
