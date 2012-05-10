#!/usr/bin/env node
var optimist = require("optimist"),
    fs = require("fs"),
    _ = require("underscore"),
    nodeModules = require("../lib/node-modules"),
    linter = require("../lib/fileset-linter");


var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('platform', {
        alias: "p",
        desc: "The platform which files are going to be checked",
        "default": "android"
    })
    .option('buildType', {
        alias: "b",
        desc: "The platform which files are going to be checked",
        "default": "dev"
    })
    .option('all', {
        alias: "a",
        desc: "Lint all dependent modules, using the nearest .jshintrc file available.\n" +
            "Default is to only lint modules with a .jshintrc in the root of the directory.",
        boolean: true, 
        "default": false
    })
    .option('help', {
        alias: "?",
        desc: "Display this message"
    })
    .check(function (argv) {
        if (argv.help) {
            throw "";
        }
        if (argv._.length === 0) {
            argv.directories = [process.cwd()];
        } else {
            argv.directories = argv._;
        }
        
    })
    .argv;

_.each(argv.directories, function (directory) {
    if (!fs.existsSync(directory)) {
        throw "No such directory " + directory;
    }
    
    var m = nodeModules.argv(argv).module(directory);
    linter.argv(argv).clean(m, true);
});
