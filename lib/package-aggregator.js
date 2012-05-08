"use strict";

var _ = require("underscore"),
    commonDir = require("commondir"),
    path = require("path"), 
    fsHelper = require("./fs-helper"),
    fs = require("fs");

function Bom (packages, rootPackageName, argv) {
    this.packages = packages;
    this.rootPackageName = rootPackageName;
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

Bom.prototype.performCopy = function (re) {
    var self = this, 
        files = self.plan,
        dryRun = self.argv.dryRun;
    
    var mkdirp = require("mkdirp");
    
    if (fs.existsSync(self.directory)) {
        if (dryRun) {
            console.log("rm -Rf " + self.directory);
        } else {
            fsHelper.rmRf(self.directory);
        }
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
        
        if (re && !re.test(src)) {
            return;
        } 
        
        if (dryRun) {
            console.log("cp " + src + " " + dest);
        } else {
            fs.linkSync(src, dest);
        }
        
    });
};

Bom.prototype.performBrowserify = function () {
    var self = this,
        rootPackage = self.packages[self.rootPackageName],
        aliases = self.aliases,
        browserify = require("browserify");

    
    var re = /\.(js|coffee)$/;
    var cwd = process.cwd();
    process.chdir(self.directory);
    var opts = {
            root: self.directory,
            require: _.map(_.filter(_.values(rootPackage.dist), function (f) {
                return re.test(f);
            }), function (f) { 
                return "./" + path.relative(self.directory, f); 
            })
        };
    
    console.dir(opts);
    var b = browserify(opts);
    
    _.each(aliases, function (i, key) {
        b.alias(key, path.relative(self.directory, aliases[key]))
    });
    
    console.log(b.bundle());
    process.chdir(cwd);
};