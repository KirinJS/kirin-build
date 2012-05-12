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
    
    var tempFolder = path.join(process.env.TMPDIR, nodeModule.name + Date.now());
    
    
    var allNodeModules = filesets.merge(_.values(nodeModule.collectAll()), true);
    
    var package_ = allNodeModules.filter(fileFilters.browserfiable).copy(tempFolder).write(true);

    
 
    
    
    
    var cwd = process.cwd();
    process.chdir(tempFolder);

    var extensions = nodeModule.collectAllExtensions();
    var aliases = {};
    function jsFile (file) {
        return (file.indexOf(".js") >= 0) ? file : (file + ".js");
    }
    _.each(extensions, function (i, key) {
        var relativePath = path.join("..", jsFile(extensions[key]));
        var filepath = path.join(tempFolder, "node_modules", jsFile(key));
        fsHelper.writeFileSync(filepath, "module.export = require(\"" + relativePath + "\");");
        aliases[key] = relativePath;
    });
    if (argv.debug) {
        console.log("Aliases for browserify:");
        console.dir(aliases);
        
        console.log("All non-generated files");
        console.dir(package_.files());
    }
    
    if (argv.debug) {
        console.log("Options used for browserify:");
        console.dir(opts);
    }
    

    var opts = {
            root: tempFolder,
            require: _.map(package_.relativeFiles(), function (f) { 
                return "./" + f; 
            })
    };
    var b = browserify(opts);    
    var bundle = b.bundle();
    _.each(nodeModule.relativeFiles(), function (f) {
        var filename = "./" + f;
        if (argv.debug) {
            console.log("Requiring " + filename);
        }
        
//        b.require(filename); 
    });
    
    
    process.chdir(cwd);
    console.dir(package_.files());
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
    var re = /^(?:module|entry|alias)[^"]+"([^"]+)"/;
    
    /*jshint regexp:true*/
    var counter = 0,
        isFirst = true,
        
        fileOrder = [],
        fileContent = {};
    _.each(parts, function (part) {
        var filename;
        var content;
        if (part.indexOf("end*/") === 0) {
            // we're losing the end here, and the inbetween modules.
            return;
        }
        
        if (isFirst) {
            filename = "browserify-preamble.js";
            content = part;
            isFirst = false;
        } else {
            var match = part.match(re);
            if (match) {
                var endComment = part.indexOf("*/");
                content = part.substring(endComment + 2);
                filename = match[1];
            } else {
                filename = "browserify-postamble" + (counter ? ("-" + counter) : "") + ".js";
                content = part;
                counter ++;
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
    
    return filesets.directory(tempFolder).crawl(true);
    
};



exports.browserify = function (nodeModule) {
    var bundle = exports.browserifyToString(nodeModule);
    return exports.browserifyBundleToDisk(bundle, nodeModule.name);
};


