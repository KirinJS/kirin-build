"use strict";

var _ = require("underscore"),
    fs = require("fs"),
    path = require("path"),
    fsHelper = require("./fs-helper"),
    fileFilters = require("./file-filters"),
    filesets = require("./filesets"),
    BuildUtils = require("./build-utils").BuildUtils;

    
function AndroidUtils (argv, nodeModule) {
    BuildUtils.apply(this, arguments);
}

exports.create = function (argv, nodeModule) {  
    return new AndroidUtils(argv, nodeModule);
};

AndroidUtils.prototype = new BuildUtils();


AndroidUtils.prototype.calculatePaths = function (nodeModule) {
    var self = this,
    platformBlock = self.getPlatformBlock(nodeModule);

    var projectDir = platformBlock.project;
    if (!projectDir) {
        throw new Error("Property 'kirin/platforms/android/project' needs to point to project directory. ");
    }
    
    projectDir = path.join(nodeModule.packageRoot, projectDir);
    if (!fs.existsSync(projectDir)) {
        throw new Error("Property 'kirin/platforms/android/project' needs to point to an existing project directory. Currently points to " + projectDir);
    }
    
    var jsDirectory = path.join(projectDir, "assets", "generated-javascript");
    
    if (!platformBlock.projectDirectory) {
        platformBlock.projectDirectory = projectDir;
    }
    
    self.argv.jsDirectory = self.argv.jsDirectory || jsDirectory; 
};
