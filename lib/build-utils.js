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



BuildUtils.prototype._ctor = function (argv, nodeModule) {
    this.argv = argv;
    this.nodeModule = nodeModule;
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
    
    var platform = platforms[argv.platform];
    searchBlock += "/" + argv.platform;
    if (!platform) {
        throw new Error("No " + searchBlock + " block found in package.json: " + nodeModule.directory + "/package.json");
    }
    
    this.platformBlock = platform;
}



BuildUtils.prototype.writeIndexFile = function (fileset) {
    var self = this,
        argv = self.argv;
    function scriptLine (file) {
        return "<script type=\"text/javascript\" src=\"" + file + "\"></script>";
    }
    
    var scriptLines = [];

    scriptLines.push(_.map(self.nodeModule.filter(fileFilters.nonBrowserfiable).relativeFiles(), scriptLine));
    scriptLines.push(_.map(fileset.relativeFiles(), scriptLine));
    
    var scriptTags = _.flatten(scriptLines).join("\n");

    var jsDirectory = argv.jsDirectory;
    
    var indexFilename = "index." + argv.platform + ".html";
    var indexFileTemplate = fs.readFileSync(path.join(__dirname, "templates", indexFilename));
    
    var indexFileContents = indexFileTemplate.replace("%INCLUDED_SCRIPTS%", scriptTags);
    
    fsHelper.writeFileSync(path.join(jsDirectory, indexFilename), indexFileContents);
};

BuildUtils.prototype.findJavascriptDirectory = function () {
    var self = this;
    if (self.argv.jsDirectory) {
        return;
    }
    
    var jsDirectory = self.platform.jsDirectory;
    searchBlock += "/jsDirectory";
    if (!jsDirectory) {
        throw new Error("No " + searchBlock + " block found in package.json: " + nodeModule.directory + "/package.json");
    }
    
    self.argv.jsDirectory = jsDirectory;
    return jsDiscovery;
};

BuildUtils.prototype.buildNative = function (nodeModule) {
    
};

exports.BuildUtils = BuildUtils;