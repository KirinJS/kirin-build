#!/usr/bin/env node
var optimist = require("optimist"),
    fs = require("fs"),
    crawler = require("../lib/package-crawler"),
    linter = require("../lib/lint-all");


var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('directory', {
        alias : 'd',
        desc : 'The directory of files to generate a report',
        "default": "."
    })
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
    .option('noDependencies', {
        alias: "n",
        desc: "Don't lint dependencies",
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
        if (argv.directory === ".") {
            argv.directory = process.cwd();
        }
        
        if (!fs.existsSync(argv.directory)) {
            throw "Directory must be a directory that exists";
        }
    })
    .argv;

var packages = crawler.discover(argv.directory); 

crawler.crawl(packages, argv);



var packagesWithErrors = linter.lint(packages, argv);
linter.display(packagesWithErrors);
linter.judge(packagesWithErrors);
