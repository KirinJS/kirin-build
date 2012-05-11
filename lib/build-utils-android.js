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

AndroidUtils.protoype.findJavascriptDirectory = function () {
    var self = this, 
    platformBlock = self.platformBlock;

    var project = platformBlock.project;
    
    if (project || !fs.existsSync(project)) {
        throw new Error("Property 'kirin/platforms/ios/project' needs to point to an .project file");
    }
    
    jsDirectory = path.join(path.dirname(project), "assets", "generated-javascript");
    self.argv.jsDirectory = jsDirectory; 
    
    return jsDirectory;
};


