#!/usr/bin/env node
var optimist = require("optimist"),
    fs = require("fs"),
    _ = require("underscore");

fs.existsSync = fs.existsSync || require("path").existsSync;


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
    .option('native', {
        desc: "Compile the native application too",
        boolean: false, 
        "default": false
    })
    .option('target', {
        desc: "Use the build.${target} commands from package.json"
    })
    .option('noDeps', {
        desc: "Don't native compile dependencies too. This is helpful when the app shares dependencies."
    })
    .option('noJavascript', {
        desc: "Don't package the javascript. This is useful for compiling native projects",
        boolean: false, 
        "default": false
    })
    .option('noLint', {
        desc: "Don't lint any thing if this option is set",
        boolean: false, 
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
            "Usually, this should be platform specific, in the source tree of the native app"
    })
    .option('tempDirectory', {
        desc: "This is where the javascript will be collected before being transformed into the generated-javascript directory.\n" + 
            "This is useful for debugging."
        
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

if (argv.buildType === "none") {
    return;
}

var nodeModules = require("../lib/node-modules").argv(argv),
    linter = require("../lib/fileset-linter").argv(argv),
    packager = require("../lib/final-packager").argv(argv);
    
var buildUtils, platformSpecificBuildUtils;
var nodeModule = nodeModules.argv(argv).module(directory).crawlAll();

try {
    platformSpecificBuildUtils = require("../lib/build-utils-" + argv.platform);
} catch (e) {
    platformSpecificBuildUtils = require("../lib/build-utils");
}
buildUtils = platformSpecificBuildUtils.create(argv, nodeModule);

if (!argv.noJavascript) {
    if (!argv.noLint) {
        console.log("# Linting modules that have a .jshintrc file");
        linter.argv(argv).lint(nodeModule, true);
    }
    packager.createJavascriptPackage(buildUtils, nodeModule);
}

if (argv.native) { 
    packager.compileNative(buildUtils, nodeModule, function () {
        console.log("# done");
    }, function (err) {
        console.error(err);
    });
}


