"use strict";

var _ = require("underscore"),
    JSHINT = require("jshint").JSHINT,
    fs = require("fs"),
    path = require("path"),
    fsHelper = require("./fs-helper"),
    fileFilters = require("./file-filters"),
    argv = {};

exports.argv = function (argv_) {
    if (argv_) {
        argv = argv_;
        return exports;
    } else {
        return argv;
    }
};

exports._lintPackage = function lintPackage (package_, options) {
    // if options haven't been supplied, then we could look them up.
    if (!options || !_.isObject(options)) {

        var configFile;
        if (argv.all || argv.lintAll) {
            configFile = fsHelper.findFileSuffix(package_.directory, ".jshintrc");
        } else {
            configFile = path.resolve(package_.packageRoot, ".jshintrc");
            if (!fs.existsSync(configFile)) {
                console.warn("# Can't find " + package_.directory + "/.jshintrc file. Skipping jshint");
                return;
            }
        }
        
        if (configFile) {
            options = fsHelper.loadJson(configFile);
        }
    }
    if (package_.isEmpty()) {
        package_.crawl();
    }
    var jsOnly = package_.filter(fileFilters.handwrittenJavascript);
    
    
    
    var files = jsOnly.filesOnDisk();
    
    
    
    
    if (argv.dryRun) {        
        _.each(files, function (file) {
            console.log("jshint " + file);
        });
        return;
    }

    var filesWithErrors = [];
    _.each(files, function (filePath) {
        
        var fileErrors = [];
        
        var errors = exports._lintFile(filePath, options);
        if (errors) {
            var filename = path.relative(package_.directory, filePath);
            filesWithErrors.push({
                filename: filename,
                errors: errors
            });
        }
        
    });
    if (!_.isEmpty(filesWithErrors)) {
        return {
            name: package_.name,
            directory: package_.directory,
            files: filesWithErrors
        };
    }
};

exports._lintFile = function (filename, options) {
    var buffer;
    try {
        buffer = fs.readFileSync(filename, 'utf-8');
    } catch (e) {
        process.stdout.write("Error: Cant open: " + filename);
        process.stdout.write(e + '\n');
        return;
    }

    // Remove potential Unicode Byte Order Mark.
    buffer = buffer.replace(/^\uFEFF/, '');
    var errors = exports._lintString(buffer, options);
    _.each(errors, function (e) {
        if (e) {
            e.file = filename;
        }
    });
    return errors;
};

exports._lintString = function (string, options) {
    if (!JSHINT(string, options)) {
        return JSHINT.errors;
    }
};

exports.display = function (packageErrors) {
    if (!packageErrors || _.isEmpty(packageErrors)) {
        return;
    }
    var displayError;
    if (argv.platform === "ios" && argv.buildType === "dev") {
        displayError = function (error) {
            if (error) {            
                // <filename>:<linenumber>: error | warn | note : <message>n
                // http://phonegap.com/2010/12/04/xcode-shell-build-phase-reporting-of-errors/
                console.error(error.file + ":" + error.line + ": error : " + error.reason);
            } else {
                console.error("   unknown");
            }
        };
    } else {
        displayError = function (error) {
            if (error) {            
                console.error("  line " + error.line + ", col " + error.character + ": " + error.reason);
            } else {
                console.error("   unknown");
            }
        }; 
    }
    
    
    function displayFile (file) {
        console.error(file.filename);
        _.each(file.errors, displayError);
    }
    
    function displayPackage (package_) {
        console.error("\n" + package_.name + " at " + package_.directory + ": ");
        _.each(package_.files, displayFile);
    }
    
    console.error("JSHint errors:");
    _.each(packageErrors, displayPackage);
};

exports.judge = function (packagesWithErrors) {
    if (!packagesWithErrors || _.isEmpty(packagesWithErrors)) {
        return;
    }
    
    process.exit(1);
};

exports.lint = function (module_, killErrors) {
    var all = [];
    if (module_.collectAll) {
        module_.collectAll(all);
    } else {
        all.root = module_;
    }
    
    var packagesWithErrors = [];
    _.each(all, function (package_) {
        var errors = exports._lintPackage(package_);
        if (errors) {
            packagesWithErrors.push(errors);
        }
    });
    
    if (!_.isEmpty(packagesWithErrors)) {
        exports.display(packagesWithErrors);
    }
    if (killErrors) {
        exports.judge(packagesWithErrors);
    }
};