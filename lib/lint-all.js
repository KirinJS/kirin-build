#!/usr/env node
"use strict";

var _ = require("underscore"),
    JSHINT = require("jshint").JSHINT,
    fs = require("fs"),
    fsHelper = require("./fs-helper");

exports.lint = function (packages, argv, options) {
    
    if (_.isObject(packages)) {
        packages = _.values(packages);
    }
    
    argv = argv || {};
    
    if (argv.noDependencies) {
        var errors = exports.lintPackage(packages[0], argv, options);
        if (errors) {
            return [errors];
        }
        return;
    }
    
    var packagesWithErrors = [];
    _.each(packages, function (package_) {
        var errors = exports.lintPackage(package_, argv, options);
        if (errors) {
            packagesWithErrors.push(errors);
        }
    });
    
    if (!_.isEmpty(packagesWithErrors)) {
        return packagesWithErrors;
    }
};

exports.display = function (packages) {
    if (!packages || _.isEmpty(packages)) {
        return;
    }
    
    function displayError (error) {
        if (error) {            
            console.error("  line " + error.line + ", col " + error.character + ": " + error.reason);
        } else {
            console.error("   unknown");
        }
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
    _.each(packages, displayPackage);
};

exports.judge = function (packagesWithErrors) {
    if (!packagesWithErrors || _.isEmpty(packagesWithErrors)) {
        return;
    }
    
    process.exit(1);
};

exports.lintPackage = function lintPackage (package_, argv, options) {
    var jsOnly = /\.js(on)?$/,
        files = _.filter(_.values(package_.files), function (filename) {
            return jsOnly.test(filename);
        });
    
    
    if (argv.dryRun) {        
        _.each(files, function (i, key) {
            console.log("jshint " + package_.getAbsolutePath(files[key]));
        });
        return;
    }
    
    
    // if options haven't been supplied, then we could look them up.
    if (!options || !_.isObject(options)) {        
        var configFile = fsHelper.findFileSuffix(package_.directory, ".jshintrc");
        if (configFile) {
            options = fsHelper.loadJson(configFile);
        }
    }
    
    var filesWithErrors = [];
    _.each(files, function (i, key) {
        var filename = files[key];
        var filePath = package_.getAbsolutePath(filename);
        
        var fileErrors = [];
        
        var errors = exports.lintString(fs.readFileSync(filePath).toString("utf8"), options);
        if (errors) {
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

exports.lintFile = function (filename, options) {
    var buffer;
    try {
        buffer = fs.readFileSync(filename, 'utf-8');
    } catch (e) {
        process.stdout.write("Error: Cant open: " + filename);
        process.stdout.write(e + '\n');
    }

    // Remove potential Unicode Byte Order Mark.
    buffer = buffer.replace(/^\uFEFF/, '');
    return exports.lintString(buffer, options);
};

exports.lintString = function (string, options) {
    if (!JSHINT(string, options)) {
        return JSHINT.errors;
    }
};
