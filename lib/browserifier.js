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

function reverseFileMap (targetPackage) {
    var fileMap = targetPackage.fileMap,
    revFileMap = {};

    _.each(fileMap, function (i, key) {
        revFileMap[fileMap[key]] = key;
    });
    return revFileMap;
}

function writeAliasModule (aliasLocation, relativePathToActual) {
    fsHelper.writeFileSync(aliasLocation, 
            "module.exports = require(" + JSON.stringify("./" + relativePathToActual) + ");");    
}

function generateExtensions (nodeModule, targetPackage) {
    var extensions = nodeModule.kirinExtensions;
    
    var revFileMap = reverseFileMap(targetPackage);
    
    var nameToRelMapping = {};
    _.each(extensions, function (i, key) {
        var absPath = extensions[key];
        var relPath = revFileMap[absPath];
        nameToRelMapping[key] = revFileMap[absPath];
    });

    
    function jsFile (file) {
        return (file.indexOf(".js") >= 0) ? file : (file + ".js");
    }
    var extensionPrefix = path.join(targetPackage.directory, "..");
    _.each(nameToRelMapping, function (i, key) {
        var relPath = path.join(nodeModule.name, nameToRelMapping[key]),
            aliasModule = path.join(extensionPrefix, jsFile(key));
            
        if (relPath) {
            writeAliasModule(aliasModule, relPath);
        }
    });

}

exports.browserifyToString = function (nodeModule) {
    var self = this,
    browserify = require("browserify");
    
    var tempFolder = argv.tempDirectory || path.join(process.env.TMPDIR, nodeModule.name + Date.now());
    fsHelper.rmRf(tempFolder);
    
    var nodeModulesDir = path.join(tempFolder, "node_modules");
    
    var allPackages = nodeModule.collectAll();
    
    _.each(allPackages, function (myModule) {
        var myModulePath = path.join(nodeModulesDir, myModule.name);
        var targetPackage = myModule.copy(myModulePath).filter(fileFilters.browserfiable).write(true);
        
        generateExtensions(myModule, targetPackage);
    });

    
    var cwd = process.cwd();
    process.chdir(tempFolder);


    var revFileMap = reverseFileMap(nodeModule);
    
    var allRequires = _.map(nodeModule.filter(fileFilters.browserfiable).relativeFiles(), function (f) {
        var fileOnDisk = nodeModule.fileOnDisk(f);
        var relPath = revFileMap[fileOnDisk];
        var aliasName = path.join(nodeModulesDir, path.basename(relPath));
        writeAliasModule(aliasName, path.join(".", nodeModule.name, relPath));
        return path.basename(relPath); 
    });
    
    
    var opts = {
            root: tempFolder,
            require: allRequires
    };
    
    if (argv.debug) {
        console.log("Options used for browserify:");
        console.dir(opts);
    }
    
    var b = browserify(opts);
    if (allPackages.kirin) {
        b.require("kirin", {root: tempFolder});
    }
    var bundle = b.bundle();
    
    process.chdir(cwd);
    if (!argv.debug && !argv.tempDirectory) {
        fsHelper.rmRf(tempFolder);
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
    
    if (argv.debug) {
        console.log("Writing out files from browserify");
        console.dir(fileOrder);
    }
    _.each(fileOrder, function (file) {
        var content = fileContent[file];
        var filepath = path.join(tempFolder, file);
        fsHelper.writeFileSync(filepath, content);
    });
    
    var fileset = filesets.directory(tempFolder).crawl(true);
    fileset.fileOrder = fileOrder;
    return fileset;
};



exports.browserify = function (nodeModule) {
    var bundle = exports.browserifyToString(nodeModule);
    return exports.browserifyBundleToDisk(bundle, nodeModule.name);
};


