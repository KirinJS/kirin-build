"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    path = require("path"),
    _ = require("underscore");

var lintAll = require("../lib/lint-all"),
    crawler = require("../lib/package-crawler");

var argv = { 
        platform: "android", 
        buildType: "dev" 
    };

var testPackageLocation = path.join(__dirname, "test-package");
var packages = crawler.discover(testPackageLocation, {
    name: "kirin-build-test-package",
    kirin: {
        dependencies: ["underscore"]
    }
});
crawler.crawl(packages, argv);

var kirinBuildPackages = crawler.discover(__dirname, {
    name: "kirin-build",
    kirin: {
        dependencies: ["underscore"]
    }
});
crawler.crawl(kirinBuildPackages, argv);
 
packages = _.extend(kirinBuildPackages, packages);

test("lint a single package with dry run", function (t) {
    argv.dryRun = true;
    
    var errors = lintAll.lintPackage(packages['kirin-build-test-package'], argv);
    
    t.ok(!errors);
    
    argv.dryRun = false;
    t.end();
});

test("lint a single package", function (t) {
    var package_ = packages['kirin-build'];
    t.ok(package_);
    
    var errors = lintAll.lintPackage(package_, argv, {});
    
    // it's not empty because we've not told jshint we're using node.
    console.dir(errors);
    t.ok(!_.isEmpty(errors));
    
    // now we're using the .jshintrc file.
    errors = lintAll.lintPackage(package_, argv);
    t.ok(!errors);
    t.end();
});

test("lint a single file", function (t) {
    var errors;
    errors = lintAll.lintFile(__filename);
    t.ok(errors);
    t.ok(!_.isEmpty(errors));
    
    errors = lintAll.lintFile(__filename, {node: true});
    t.ok(!errors);
    
    t.end();
});

test("lint a string", function (t) {
    var errors;
    errors = lintAll.lintString(["var a = 1;", "a = a + 1;"]);
    t.ok(_.isEmpty(errors));
    
    errors = lintAll.lintString(["var a = 1;", "eval('a + 1');"]);
    t.equal(errors.length, 1);
    
    errors = lintAll.lintString(["b = 1"]);
    t.equal(errors.length, 1);
    
    t.end();
});

test("display errors", function (t) {
    var errors = lintAll.lint(packages, {}, {});
    // there should be if we don't tell jshint that we're using node.
    t.ok(errors);
    lintAll.display(errors);
    t.end();
});
