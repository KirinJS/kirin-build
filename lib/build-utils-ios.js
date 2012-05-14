"use strict";

var _ = require("underscore"),
    fs = require("fs"),
    path = require("path"),
    fsHelper = require("./fs-helper"),
    fileFilters = require("./file-filters"),
    filesets = require("./filesets"),
    BuildUtils = require("./build-utils").BuildUtils;

    
function IOSUtils (argv, nodeModule) {
    BuildUtils.apply(this, arguments);
}

exports.create = function (argv, nodeModule) {  
    return new IOSUtils(argv, nodeModule);
};

IOSUtils.prototype = new BuildUtils();

console.log("Prototype: " + IOSUtils.prototype);

IOSUtils.prototype.findJavascriptDirectory = function () {
    var self = this, 
        platformBlock = self.platformBlock;
    
    var xcodeproj = platformBlock.project;
    if (!xcodeproj) {
        throw new Error("Property 'kirin/platforms/ios/project' needs to point to an .xcodeproj file. ");
    }
    
    xcodeproj = path.join(self.nodeModule.packageRoot, xcodeproj);
    if (!fs.existsSync(xcodeproj)) {
        throw new Error("Property 'kirin/platforms/ios/project' needs to point to an existing .xcodeproj file. Currently points to " + xcodeproj);
    }
    
    var jsDirectory = path.join(path.dirname(xcodeproj), "generated-javascript");
    self.argv.jsDirectory = jsDirectory; 
    
    return jsDirectory;
};


