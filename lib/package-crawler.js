"use strict";

var fs = require("fs"),
    path = require("path"),
    _ = require("underscore"), 
    resolve = require("resolve"),
    findit = require("findit"),
    buildConfig = require("./build-configurations"),
    fsHelper = require("./fs-helper");
    
var KIRIN_IN_PACKAGE_JSON = "kirin";

var loadJson = fsHelper.loadJson;

function Package (packageLocation) {
    this.packageLocation = packageLocation;    
}

var findFileSuffix = fsHelper.findFileSuffix;
exports.findFileSuffix = findFileSuffix;

function findPackageJson (packageDir) {
    return findFileSuffix(packageDir, "package.json");
}
exports.findPackageJson = findPackageJson;



function resolvePackage (file, basedir) {
    return resolve.sync(file, {
        basedir : basedir,
        //extensions : this.extensions,
        packageFilter : function (pkg) {
            var b = pkg.kirin;
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

function recursiveDiscover (filePath, packages, mockPackageJson) {
    packages = packages || {};
    var packageJsonLocation = findPackageJson(filePath);
    var newestPackage = new Package(packageJsonLocation);

    newestPackage.discover(mockPackageJson);

    packages[newestPackage.name] = newestPackage;    
    var dependencies = _.filter(newestPackage.getDependencies(), function (package_) {
        return !packages[package_];
    });


    _.each(dependencies, function (package_) {
        // we should assume that we can find the module 
        // otherwise, we can't build.

        var main = resolvePackage(package_, newestPackage.directory);
        recursiveDiscover(main, packages);
    });
    
    return packages;
}

exports.discover = function (packageLocation, mockPackageJson) {
    return recursiveDiscover(packageLocation, {}, mockPackageJson);
};

exports.crawl = function (packages, argv) {
    argv = argv || {};
    if (_.isArray(packages)) {
        _.each(packages, function (package_) {
            package_.crawl(argv);
        });
    } else if (_.isObject(packages)) {
        _.each(packages, function (i, key) {
            packages[key].crawl(argv);
        });
    } else if (packages) {
        packages.crawl(argv);
    }
    return packages;
};
    
exports.discoverDeep = function (packageLocation, argv) {
    var packages = exports.discover(packageLocation);
    return exports.crawl(packages, argv);
};

exports.createPackage = function (moduleName, dirname) {
    
    var main,
        pkgLocation;
    
    if (dirname) {
        main = resolvePackage(moduleName, dirname);
    } else {
        main = moduleName;
    }
    
    pkgLocation = findPackageJson(main);
    return new Package(pkgLocation);
};

Package.prototype.discover = function (mockPackageJson) {
    var self = this;
    var packageJsonLocation = this.packageLocation;
    if (!fs.existsSync(packageJsonLocation)) {
        throw new Error("Expecting to find a package.json file at " + packageJsonLocation);
    }    
    
    var packageJson = mockPackageJson || loadJson(packageJsonLocation);

    if (!packageJson) {
        throw new Error("Can't load a valid package.json file at " + packageJsonLocation);
    }
    
    // package.json looked for: name, kirin, dependencies, 
    
    self.name = packageJson.name;
    self.directory = path.dirname(packageJsonLocation);
    self.directories = ["."];
    var kirinInfo = packageJson[KIRIN_IN_PACKAGE_JSON];

    // TODO merge with variants, if any.
    
    // Default to Kirin dependencies, otherwise use package dependencies
    var packageDependencies = _.keys(packageJson.dependencies || {});

    if (!kirinInfo) {
        self.dependencies = packageDependencies;
        self.kirinExtensionPaths = {};
        return self;
    }
    
    if (kirinInfo.directories) {
        self.directories = kirinInfo.directories;
    }
    
    self.dependencies = kirinInfo.dependencies || packageDependencies;
    
    var kirinExtensions = kirinInfo.extensions || {},
        reverseKirinExtensions = {};
    _.each(kirinExtensions, function (i, key) {
        var filepath = path.resolve(self.directory, kirinExtensions[key]);
        reverseKirinExtensions[filepath] = key;
    });
    self.kirinExtensionPaths = reverseKirinExtensions;
    
    // TODO do the crawl
    return self;
};

Package.prototype.getDependencies = function () {
    return this.dependencies;
};


Package.prototype.crawl = function (argv_) {
    var self = this;
    argv_ = argv_ || {};
    
    var files = [path.join(self.directory, "package.json")];
    _.each(self.directories, function (relativeDirectory) {
        var directory = path.resolve(self.directory, relativeDirectory);
        files.push(findit.findSync(directory));
    });
    
    
    files = _.flatten(files);
    
    var fileMap = self.files = {};
    var aliases = self.aliases = {};
    
    _.each(files, function (filepath) {
        var filename = path.basename(filepath),
            relative = path.relative(self.directory, filepath),
            alias = self.kirinExtensionPaths[filepath];

        if (relative.indexOf("node_modules") >= 0) {
            return;
        }
    
        if (alias) {
            aliases[alias] = relative;
        }
        
        var fileObject = buildConfig.platformSpecificity(argv_, relative);
        
        var canonicalName = fileObject.name,
            existing = fileMap[canonicalName];
        
        if (!existing || fileObject.specificity > existing.specificity) {
            fileMap[canonicalName] = fileObject; 
        }
        
    });
    
    _.each(fileMap, function (i, canonical) {
        if (fileMap[canonical].specificity >= 0) {
            fileMap[canonical] = fileMap[canonical].location;
        } else {
            delete fileMap[canonical];
        }
    });
    
    
    return self;
};

Package.prototype.getAbsolutePath = function (relative) {
    return path.resolve(this.directory, relative);
};