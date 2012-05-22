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

IOSUtils.prototype.calculatePaths = function (nodeModule) {
    var self = this,
        platformBlock = self.getPlatformBlock(nodeModule);
    
    var xcodeproj = platformBlock.project;
    if (!xcodeproj) {
        throw new Error("Property 'kirin/platforms/ios/project' needs to point to an .xcodeproj file. ");
    }
    
    xcodeproj = path.join(nodeModule.packageRoot, xcodeproj);
    if (!fs.existsSync(xcodeproj)) {
        throw new Error("Property 'kirin/platforms/ios/project' needs to point to an existing .xcodeproj file. Currently points to " + xcodeproj);
    }
    if (!platformBlock.projectDirectory) {
        platformBlock.projectDirectory = path.dirname(xcodeproj);
    }
    
    if (!platformBlock.idlOutput) {
        platformBlock.idlOutput = path.join(platformBlock.projectDirectory, "idl-generated");
    }

    var jsDirectory = path.join(path.dirname(xcodeproj), "generated-javascript");
    self.argv.jsDirectory = self.argv.jsDirectory || jsDirectory; 
};



