"use strict";

var fs = require("fs"),
    path = require("path"),
    _ = require("underscore"), 
    resolve = require("resolve"),
    fsHelper = require("./fs-helper"),
    Fileset = require("./filesets");
    
var KIRIN_IN_PACKAGE_JSON = "kirin";

var argv = {};

function resolvePackage (file, basedir) {
    return resolve.sync(file, {
        basedir : basedir,
        //extensions : this.extensions,
        packageFilter : function (pkg) {
            var b = pkg[KIRIN_IN_PACKAGE_JSON];
            if (b) {
                if (typeof b === 'string') {
                    pkg.main = b;
                }
                else if (typeof b === 'object' && b.main) {
                    pkg.main = b.main;
                }
            }
            return pkg;
        }
    });
}



function NodeModule (directory) {
    var self = this;
    self.directory = directory;
    self.name = directory;
    
    self.kirinInfo = {};
    
    // these will end up as extensions
    self.kirinExtensions = {};
    self.children = [];
}

NodeModule.prototype = Fileset.directory();

NodeModule.prototype.discoverAll = function (mockPackageJson) {
    var self = this;
    var packageJsonLocation = fsHelper.findFileSuffix(self.directory, "package.json");
    if (!packageJsonLocation || !fs.existsSync(packageJsonLocation)) {
        throw new Error("Expecting to find a package.json file at " + packageJsonLocation);
    }    
    self.directory = path.dirname(packageJsonLocation);
    
    var packageJson = mockPackageJson || fsHelper.loadJson(packageJsonLocation);

    if (!packageJson) {
        throw new Error("Can't load a valid package.json file at " + packageJsonLocation);
    }

    self.name = packageJson.name;

    var kirinInfo = self.kirinInfo = packageJson[KIRIN_IN_PACKAGE_JSON] || {};
            
    // we'll need the extensions later on.
    self.kirinExtensions = kirinInfo.extensions || {};
    
    // now let's look at dependencies
    var dependencies = kirinInfo.dependencies || _.keys(packageJson.dependencies || {});
    
    _.each(dependencies, function (package_) {
        // we should assume that we can find the module 
        // otherwise, we can't build.

        var main = resolvePackage(package_, self.directory);
        var newModule = exports.module(main);
        self.children.push(newModule);
        
        newModule.discoverAll();
    });
    return self;
};

NodeModule.prototype.crawlAll = function () {
    var self = this;
    

    // TODO obey package.json directories/files.
    var directories = _.map(self.kirinInfo.directories || ["."], function (f) {
        return path.join(self.directory, f);
    });

    var filesets = [];
    _.each(directories, function (dir) {
        filesets.push(Fileset.directory(dir).crawl());
    });
    
    _.extend(self, Fileset.merge(filesets, true).reduce(self.directory));
    _.each(self.children, function (d) {
        d.crawlAll();   
    });
    return self;
};

NodeModule.prototype.collectAll = function (moduleMap) {
    var self = this;
    moduleMap = moduleMap || {};
    if (moduleMap[self.name]) {
        // we should check if there are any other modules. 
        // hmm.
    }
    moduleMap[self.name] = self;
    
    _.each(self.children, function (child) {
        child.collectAll(moduleMap);
    });
    
    return moduleMap;
};

exports.module = function (path, mockPackageJson) {
    var m = new NodeModule(path);
    m.discoverAll(mockPackageJson);
    return m;
};

exports.argv = function (argv_) {
    if (argv_) {
        argv = argv_;
        Fileset.argv(argv);
        return exports;
    } else {
        return argv;
    }
};

