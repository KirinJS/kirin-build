"use strict";

var _ = require("underscore"),
    fs = require("fs"),
    path = require("path"),
    fsHelper = require("./fs-helper"),
    fileFilters = require("./file-filters"),
    filesets = require("./filesets");

function BuildUtils () {
    if (arguments.length) {
        this._ctor.apply(this, arguments);
    }
}
BuildUtils.prototype = {};

exports.create = function (argv, nodeModule) {  
    return new BuildUtils(argv, nodeModule);
};

BuildUtils.prototype._ctor = function (argv, nodeModule) {
    this.argv = argv;
    this.nodeModule = nodeModule;
    
    this.annotateNodeModules(nodeModule);
    argv.jsDirectory = nodeModule.platformBlock.jsDirectory;
};

BuildUtils.prototype.annotateNodeModules = function (nodeModule) {
    var self = this;
    if (!_.isEmpty(nodeModule.kirinInfo)) {        
        self.calculatePaths(nodeModule);
    }
    _.each(nodeModule.children, function (child) {
        self.annotateNodeModules(child);
    });
};


BuildUtils.prototype.getPlatformBlock = function (nodeModule) {
    var self = this;
    nodeModule = nodeModule || self.nodeModule;
    if (nodeModule.platformBlock) {
        return nodeModule.platformBlock;
    }
    
    var kirinInfo = nodeModule.kirinInfo;
    var searchBlock = "kirin";
    if (!kirinInfo) {
        throw new Error("No " + searchBlock + " block found in package.json: " + nodeModule.directory + "/package.json");
    }
    
    var platforms = kirinInfo.platforms;
    searchBlock += "/platforms";
    if (!platforms) {
        throw new Error("No " + searchBlock + " block found in package.json: " + nodeModule.directory + "/package.json");
    }
    
    var platform = platforms[self.argv.platform];
    searchBlock += "/" + self.argv.platform;
    if (!platform) {
        throw new Error("No " + searchBlock + " block found in package.json: " + nodeModule.directory + "/package.json");
    }
    nodeModule.platformBlock = platform;
    return platform;
}

BuildUtils.prototype.writeIndexFile = function (scriptLines) {
    var self = this,
        argv = self.argv;
    function scriptLine (file) {
        return "<script type=\"text/javascript\" src=\"" + file + "\"></script>";
    }
    

    var scriptTags = _.map(_.flatten(scriptLines), scriptLine).join("\n");

    var jsDirectory = argv.jsDirectory;
    
    var indexFilename = "index." + argv.platform + ".html";
    var indexFileTemplate = fs.readFileSync(path.join(__dirname, "..", "templates", indexFilename), "utf-8");
    
    var indexFileContents = indexFileTemplate.replace("%INCLUDED_SCRIPTS%", scriptTags);
    
    fsHelper.writeFileSync(path.join(jsDirectory, indexFilename), indexFileContents);
};

BuildUtils.prototype.calculatePaths = function (nodeModule) {
    throw new Error("Not implemented");
};

BuildUtils.prototype.buildNative = function (nodeModule, callback, errback) {
    var self = this;
    var childProcess = require("child_process");
    var cwd = process.cwd();
    var platformBlock = self.getPlatformBlock(nodeModule);
    
    var buildCommand = platformBlock["build." + self.argv.target] || platformBlock["build"]; 
    
    if (buildCommand) {
        self.calculatePaths(nodeModule);
        if (platformBlock.projectDirectory) {
            console.log("cd " + platformBlock.projectDirectory);
            process.chdir(platformBlock.projectDirectory);
        }
        console.log(buildCommand);
        childProcess.exec(buildCommand, {maxBuffer: 2 * 1024*1024}, function (error, stdout, stderr) {
            process.chdir(cwd);
            if (error) {
                errback(error);
            } else {
                callback(nodeModule);
            }
        });
    } else {
        errback("Don't know how to compile " + nodeModule.name + " for " + self.argv.platform);
    }
    
    return self;
};

exports.BuildUtils = BuildUtils;