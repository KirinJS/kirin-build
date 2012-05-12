#!/usr/bin/env node
var optimist = require("optimist"),
    fs = require("fs"),
    _ = require("underscore"),
    nodeModules = require("../lib/node-modules"),
    linter = require("../lib/fileset-linter"),
    packager = require("../lib/final-packager");


var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('platform', {
        alias: "p",
        desc: "The platform which files are going to be checked"
    })
    .option('buildType', {
        alias: "b",
        desc: "The platform which files are going to be checked",
        "default": "dev"
    })
    .option('noLint', {
        desc: "Don't lint any thing if this option is set",
        boolean: false, 
        "default": false
    })
    .option('lintAll', {
        alias: "a",
        desc: "Lint all dependent modules, using the nearest .jshintrc file available.\n" +
            "Default is to only lint modules with a .jshintrc in the root of the directory.",
        boolean: true, 
        "default": false
    })
    .option('dryRun', {
        desc: "Report what would happen if this flag wasn't on",
        boolean: true, 
        "default": false
    })
    .option('jsDirectory', {
        alias: "d",
        desc: "Where the Javascript will be assembled.\n" +
            "Usually, this should be platform specific"
    })
    .option('debug', {
        desc: "Show your working"
    })
    .option('help', {
        alias: "?",
        desc: "Display this message"
    })
    .check(function (argv) {
        if (argv.help) {
            throw "";
        }
        
        if (!argv.platform) {
            throw new Error("Must specify a platform");
        }
        
        
        
    })
    .argv;
var directory = argv.src || argv._[0] || process.cwd();

if (!directory) {
    throw new Error("Must specify a directory");
}

if (!fs.existsSync(directory)) {
    throw "No such directory " + directory;
}

var nodeModule = nodeModules.argv(argv).module(directory).crawlAll();
if (!argv.noLint) {
    linter.argv(argv).lint(nodeModule, true);
}

var buildUtils;
buildUtils = require("../lib/build-utils-" + argv.platform).create(argv, nodeModule);
packager.argv(argv).createJavascriptPackage(buildUtils, nodeModule);




