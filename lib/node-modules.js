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
    
    // now let's look at dependencies
    var dependencies = kirinInfo.dependencies || _.keys(packageJson.dependencies || {});
    
    _.each(dependencies, function (package_) {
        // we should assume that we can find the module 
        // otherwise, we can't build.

        var main;
        try {            
            main = resolvePackage(package_, self.directory);
        } catch (e) {
            if (package_ === 'kirin-core') {
                if (process.env.KIRIN_HOME) {
                    main = process.env.KIRIN_HOME;
                } else {
                    // this is a very bad fallback.
                    main = path.join(self.directory, "..");
                }
            } else {
                throw new Error(e);
            }
        }
        
        var newModule = exports.module(main);
        self.children.push(newModule);
        
        newModule.discoverAll();
    });
    return self;
};

NodeModule.prototype.crawlAll = function () {
    var self = this;

    var root = self.packageRoot = self.directory;
    
    if (self.kirinInfo.shared) {
        self.directory = path.join(root, self.kirinInfo.shared);
    }
    
    // TODO obey package.json directories/files.
    var directories = _.map(self.kirinInfo.directories || ["."], function (f) {
        return path.join(self.directory, f);
    });

    var filesets = [];
    _.each(directories, function (dir) {
        filesets.push(Fileset.directory(dir).crawl());
    });
    
    _.extend(self, Fileset.merge(filesets, self.directory, true));
    self.fileMap["package.json"] = root + "/package.json";
    // we'll need the extensions later on.
    var extensions = self.kirinExtensions = self.kirinInfo.extensions || {};
    
    function jsFile (file) {
        if (file.indexOf(".js") < 0) {
            return file + ".js";
        } 
        return file;
    }
    
    _.each(extensions, function (i, extensionName) {
        var relPath = jsFile(extensions[extensionName]);
        var absPath = self.fileOnDisk(relPath);
        if (absPath) {
            extensions[extensionName] = absPath;
        } else {
            delete extensions[extensionName];
        }
    });
    
    if (argv.debug) {
        console.log("Extensions are: ");
        console.dir(extensions);
    }
    
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

NodeModule.prototype.collectAllExtensions = function (directory, extensionMap) {
    var self = this;
    extensionMap = extensionMap || {};
    directory = directory || self.directory;
    
    var myExtensions = self.kirinExtensions;

    _.each(self.children, function (child) {
        child.collectAllExtensions(directory, extensionMap);
    });
    
    _.each(myExtensions, function (i, name) {
        var relativePrefix = path.relative(directory, self.directory);
        // TODO what do we do for extensions have already been declared?
        // currently, we collect children before parents (i.e. dependers can overwrite dependees)
        // do we need to warn?
        if (extensionMap[name]) {
            console.warn("Overriding the " + name + " extension. This is probably ok, but may indicate a problem");
        }
        // the hard work has already been done in crawl.
        extensionMap[name] = myExtensions[name];
    });
    
    return extensionMap;
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

