"use strict";
var fsHelper = require("../fs-helper"),
    filesets = require("../filesets"),
    frontend = require("./idl-frontend"),
    Frontend = frontend.Frontend,
    _ = require("underscore"),
    path = require("path");


var argv = {};
exports.argv = function (argv_) {
    argv = argv_;
    return exports;
};

function Translator() {
    // NOP
}
exports.Translator = Translator;

Translator.prototype.translateAll = function (nodeModule, writeToDisk) {
    var self = this,
        children = nodeModule.children;
    self.translate(nodeModule, writeToDisk);
    
    if (_.isArray(children)) {
        _.each(children, function (child) {
            self.translateAll(child, writeToDisk);
        });
    }
};

Translator.prototype.translate = function (nodeModule, writeToDisk) {
    var kirinInfo = nodeModule.kirinInfo,
        idlFileset,
        idlFilepath,
        irSymbolTables,
        targetFiles = {};
    if (!kirinInfo) {
        return {};
    }
    filesets.argv(argv);
    
    idlFilepath = path.resolve(nodeModule.packageRoot, (kirinInfo.idl || "idl"));
    if (!fsHelper.existsSync(idlFilepath)) {
        return {};
    }
    
    idlFileset = filesets.directory(idlFilepath).crawl().filter(/\.js$/);
    irSymbolTables = _.map(idlFileset.files(), function (f) {
        return new Frontend(f).generateIR();
    });
    
    // TODO how to integrate gwt into this.
    var fileTypes = [argv.platform];
    if (!argv.noJavascript) {
        fileTypes.push("javascript");
    }
    _.each(fileTypes, function (suffix) {
        var generator;
        
        try {
            generator = require("./generators-" + suffix);
        } catch (e) {
            console.error("Can't find a generator for " + suffix, e);
            return;
        }

        if (generator.argv) {
            generator.argv(argv);
        }
        
        var filepath = generator.getOutputDirectory(nodeModule, kirinInfo, nodeModule.platformBlock);
        if (typeof generator.prepareOutputDirectory === "function") {
            generator.prepareOutputDirectory(filepath);
        }
        
        
        _.each(irSymbolTables, function (irSymbolTable) {
            generator.generateFiles(filepath, irSymbolTable, targetFiles, nodeModule);
        });
        
    });
    
    
    
    if (writeToDisk) {
        
        _.each(targetFiles, function (i, filepath) {
            var content = targetFiles[filepath];
            fsHelper.writeFileSync(filepath, content, argv.dryRun);
        });
    }
    
    return targetFiles;
    
};
