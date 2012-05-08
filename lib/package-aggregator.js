"use strict";

var _ = require("underscore"),
    commonDir = require("commondir"),
    path = require("path"), 
    fsHelper = require("./fs-helper"),
    fs = require("fs");

function Bom (packages, argv) {
    this.packages = packages;
    this.argv = argv || {};
}

exports.Bom = Bom;

Bom.prototype.getRoot = function () {
    var directories = _.pluck(_.values(this.packages), "directory");
    return commonDir(directories);
};

Bom.prototype.planCopying = function (package_, sourceRoot, destRoot, plan) {
    var sourceRootAbs = package_.directory,
        sourceRootRel = path.relative(sourceRoot, sourceRootAbs),
        files = package_.files;
    
    var distFiles = package_.dist = {};
    
    plan = plan || {};
    _.each(files, function (i, file) {
        var srcFile = path.join(sourceRootAbs, files[file]);
        var destFile = path.join(destRoot, sourceRootRel, file);
        plan[srcFile] = destFile;
        distFiles[file] = destFile;
    });
    return plan;
};

Bom.prototype.planAliases = function (package_, aliases) {
    var self = this, 
        packageAliases = package_.aliases,
        dist = package_.dist;
    aliases = aliases || {};
    
    _.each(packageAliases, function (i, alias) {
        aliases[alias] = dist[packageAliases[alias]];
    });
    
    return aliases;
};


Bom.prototype.prepare = function (destFolder) {
    var self = this, 
        plan = self.plan = {},
        aliases = self.aliases = {},
        root = self.getRoot();
    
    self.directory = destFolder;
    
    _.each(_.values(self.packages), function (package_) {
        self.planCopying(package_, root, destFolder, plan);
        self.planAliases(package_, aliases);
    });    
};

Bom.prototype.performCopy = function () {
    var self = this, 
        files = self.plan,
        dryRun = self.argv.dryRun;
    
    var mkdirp = require("mkdirp");
    
    if (dryRun) {
        console.log("rm -Rf " + self.directory);
    } else {
        fsHelper.rmRf(self.directory);
    }
    
    _.each(files, function (i, src) {
        var dest = files[src],
            dir = path.dirname(dest);
        
        if (!fs.existsSync(dir)) {
            if (dryRun) {
                console.log("mkdir -p " + dir);
            } else {
                mkdirp.sync(dir);
            }
        }
        
        if (dryRun) {
            console.log("cp " + src + " " + dest);
        } else {
            fs.linkSync(src, dest);
        }
        
    });
};