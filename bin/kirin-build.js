#!/usr/bin/env node
var optimist = require("optimist"),
    fs = require("fs"),
    _ = require("underscore"),
    crawler = require("../lib/package-crawler"),
    linter = require("../lib/lint-all");


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
    .option('directory', {
        alias: "d",
        desc: "Where the Javascript will be assembled.\n" +
            "Usually, this should be platform specific"
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
        
        if (!argv.directory) {
            throw new Error("Must specify a directory");
        }
        
    })
    .argv;
var src = process.cwd();
var packages = crawler.discoverDeep(src, argv); 
if (!argv.noLint) {
    var packagesWithErrors = linter.lint(packages, argv);
    linter.display(packagesWithErrors);
    linter.judge(packagesWithErrors);
}

var Bom = require("../lib/package-aggregator").Bom,
    bom = new Bom(packages, crawler.rootPackageName, argv);

var bundle = bom.performBrowserify();

var Packet = require("../lib/kirin-packager").Packet,
    packet = new Packet(bundle, bom, argv);

packet.assemble();


