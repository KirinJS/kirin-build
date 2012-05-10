
var _ = require("underscore"),
    commondir = require("commondir"), 
    fsHelper = require("./fs-helper"), 
    path = require("path"),
    fs = require("fs"),
    buildConfig = require("../lib/build-configurations");

var argv = {},
    dryRun = false;



function Fileset (directory, files, directories) {
	this.directory = directory;
	this.fileMap = files || {};
	this.directoryMap = directories || {};
}

Fileset.prototype.crawl = function () {
    var self = this,
        directory = self.directory,
        files = require("findit").findSync(directory),
        fileMap = self.fileMap = {},
        directoryMap = self.directoryMap = {};
    
    _.each(files, function (filepath) {
        var filename = path.basename(filepath),
            relative = path.relative(self.directory, filepath);
        
        // TODO make this obey .gitignore
        if (relative.indexOf("node_modules") >= 0 || relative.indexOf(".git") >= 0) {
            return;
        }
        
        if (!fs.existsSync(filepath)) {
            return;
        }
        
        if (fsHelper.isDirectory(filepath)) {
            directoryMap[relative] = filepath;
            return;
        }
        
        var fileObject = buildConfig.platformSpecificity(argv, relative);
        
        var canonicalName = fileObject.name,
            existing = fileMap[canonicalName];
        
        if (!existing || fileObject.specificity > existing.specificity) {
            fileMap[canonicalName] = fileObject; 
        }
        
    });
    
    _.each(fileMap, function (i, canonical) {
        if (fileMap[canonical].specificity >= 0) {
            fileMap[canonical] = path.join(directory, fileMap[canonical].location);
        } else {
            delete fileMap[canonical];
        }
    });
    return self;
};



Fileset.prototype._filter = function (test, map) {
    var func;
    var newMap = {};
    if (_.isRegExp(test)) {
        func = function (filename) {
            return test.test(filename);
        };
    } else if (_.isFunction(test)) {
        func = test;
    } else if (_.isString(test)) {
        var value = map[test];
        if (!_.isUndefined(value)) {
            newMap[test] = value;
        }
        return newMap;
    } else if (_.isUndefined(test)) {
        return map;
    } else {
        throw new Error(typeof test + " test not supported");
    }
    
    
    _.each(map, function (i, filename) {
        if (func(filename)) {
            newMap[filename] = map[filename];
        }
    });
    return newMap;
};

function allDirectories(fileMap) {
    return _.unique(_.map(_.keys(fileMap), path.dirname));   
}

Fileset.prototype._distillDirectories = function () {
    var self = this, 
        directories = allDirectories(self.fileMap),
        newMap = {},
        oldMap = self.directoryMap;
    
    _.each(directories, function (d) {
        if (d !== ".") {
            newMap[d] = path.join(self.directory, d);
        }
    });
    
    self.directoryMap = newMap;
    return self;
};

Fileset.prototype.filter = function (test) {
    var self = this;
    return new Fileset(self.directory, self._filter(test, self.fileMap))._distillDirectories();
};

Fileset.prototype._absolutize = function (map) {
    var directory = this.directory;
    return _.map(_.keys(map), function (filename) {
        return path.join(directory, filename);
    });    
};

Fileset.prototype.files = function () {
    return this._absolutize(this.fileMap);
};

Fileset.prototype.directories = function () {
    return this._absolutize(this.directoryMap);
};

Fileset.prototype.onDisk = function (relativePath) {
    return this.fileMap[relativePath] || this.directoryMap[relativePath];
};

Fileset.prototype.commonDir = function () {
    var self = this;
    return commondir(this.directory, allDirectories(self.fileMap));
};

Fileset.prototype.copy = function (newDirectory) {
    return new Fileset(newDirectory, this.fileMap, this.directoryMap);
};

Fileset.prototype._rekey = function (newDir, oldMap, newMap) {
    var self = this,
        oldDir = self.directory;
    newMap = newMap || {};    
    _.each(oldMap, function (i, filename) {
        var abs = path.join(oldDir, filename),
            rel = path.relative(newDir, abs);
        newMap[rel] = oldMap[filename];
    });
    
    return newMap;
};

Fileset.prototype.reduce = function () {
    var self = this,
        commonDir = self.commonDir();
    
    return new Fileset(commonDir, self._rekey(commonDir, self.fileMap))._distillDirectories();
};

Fileset.prototype.write = function (overwrite) {
    var self = this,
        map = self.fileMap,
        directory = self.directory;
    
    if (overwrite && fs.existsSync(directory)) {
        fsHelper.rmRf(directory, dryRun);
    }
    
    _.each(map, function (i, filename) {
        fsHelper.copy(map[filename], path.join(directory, filename), dryRun);
    });
    return self;
};

Fileset.prototype.remove = function (nuke) {
    var self = this;
    if (nuke) {
        fsHelper.rmRf(self.directory, dryRun);
    } else {
        _.each(self.files(), function (f) {
            fsHelper.rmRf(f, dryRun);
        });
        
        var sortedDirectories = _.sortBy(self.directories(), function (f) {
            return -f.length;
        });
        
        sortedDirectories.push(self.directory);
        _.each(sortedDirectories, function (dir) {
            if (fsHelper.isDirectoryEmpty(dir)) {
                fsHelper.rmRf(dir, dryRun);
            }
        });
    }

    return new Fileset(self.directory);
};

exports.directory = function (directory) {
    return new Fileset(directory);
};

exports.argv = function (argv_) {
    if (_.isObject(argv_)) {
        argv = argv_;
    }
    dryRun = argv.dryRun;
    return argv;
};

function mergeWithStructure (filesets) {
    var commonDir = commondir(_.pluck(filesets, "directory"));
    var fileMap = {};
    
    _.each(filesets, function (fileset) {
        fileset._rekey(commonDir, fileset.fileMap, fileMap);
    });
    
    return new Fileset(commonDir, fileMap)._distillDirectories();
}

function mergeWithoutPreservingStructure(filesets) {
    var commonDir = commondir(_.pluck(filesets, "directory"));
    var fileMap = {};
    
    _.each(filesets, function (fileset) {
        _.extend(fileMap, fileset.fileMap);
    });
    
    return new Fileset(commonDir, fileMap)._distillDirectories();
}

exports.merge = function (filesets, preserveStructure) {
    if (_.isBoolean(preserveStructure) && preserveStructure) {
        return mergeWithStructure(filesets);
    } else {
        return mergeWithoutPreservingStructure(filesets);
    }
    
    
    
};