"use strict";

var _ = require("underscore"),
    fs = require("fs"),
    path = require("path"),
    fsHelper = require("./fs-helper"),
    fileFilters = require("./file-filters"),
    filesets = require("./filesets"),
    argv = {};

exports.argv = function (argv_) {
    if (argv_) {
        argv = argv_;
        filesets.argv(argv);
        return exports;
    } else {
        return argv;
    }
};

exports.browserifyToString = function (nodeModule) {
    var self = this,
    browserify = require("browserify");
    
    console.dir(nodeModule.files());
    
    var tempFolder = path.join(process.env.TMPDIR, nodeModule.name + Date.now());

    console.log(tempFolder);
    
    var extensions = nodeModule.collectAllExtensions();
    
    console.dir(extensions);
    
    var allNodeModules = filesets.merge(_.values(nodeModule.collectAll()), true);
    
    var package_ = allNodeModules.filter(fileFilters.browserfiable).copy(tempFolder).write(true);

    console.dir(nodeModule);
    console.dir(package_);
    
    
    console.dir(package_.files());
    
    var cwd = process.cwd();
    process.chdir(tempFolder);
    var opts = {
            root: self.directory,
            require: _.map(package_.relativeFiles(), function (f) { 
                return "./" + f; 
            })
        };
    
    console.dir(opts);
    var b = browserify(opts);
    
    
    _.each(extensions, function (i, key) {
        b.alias(key, extensions[key]);
    });
    
    var bundle = b.bundle();
    
    process.chdir(cwd);
    
    if (!argv.debug) {
        package_.remove(true);
    }
    
    return bundle;
};

exports.browserifyBundleToDisk = function (bundle, bundleName) {
    var self = this;
    bundleName = bundleName || "";
    
    var parts = bundle.split("/*browserify:");
    /*jshint regexp:false*/
    var re = /^(?:module|entry)\s*"([^"]+)"\s*\*\//;
    /*jshint regexp:true*/
    var counter = 0,
        isFirst = true,
        
        fileOrder = [],
        fileContent = {};
    _.each(parts, function (part) {
        var filename;
        var content;
        if (part.indexOf("end*/") === 0) {
            return;
        }
        
        if (isFirst) {
            filename = "browserify-preamble.js";
            content = part;
            isFirst = false;
        } else {
            var match = part.match(re);
            if (match) {
                content = part.substring(match[0].length);
                filename = match[1];
            } else {
                filename = "browserify-postamble" + (counter ? ("-" + counter) : "") + ".js";
                content = part;
            }
        }
        
        if (filename && content) {
            fileOrder.push(filename);
            fileContent[filename] = content;
        }
    });
    
    var tempFolder = path.join(process.env.TMPDIR, "browserified-" + bundleName + Date.now());
    
    _.each(fileOrder, function (file) {
        var content = fileContent[file];
        var filepath = path.join(tempFolder, file);
        fsHelper.writeFileSync(filepath, content);
    });
    
    return filesets.directory(tempFolder).crawl();
    
};



exports.browserify = function (nodeModule) {
    var bundle = exports.browserifyToString(nodeModule);
    return exports.browserifyBundleToDisk(bundle, nodeModule.name);
};


