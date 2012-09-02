"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    path = require("path"),
    _ = require("underscore");

var argv = { 
        platform: "android", 
        buildType: "dev" 
};

var linter = require("../lib/fileset-linter").argv(argv),
    nodeModules = require("../lib/node-modules").argv(argv);


var testPackageLocation = path.join(__dirname, "test-package");
var packages = nodeModules.module(testPackageLocation, {
    name: "kirin-build-test-package",
    kirin: {
        dependencies: ["underscore"]
    }
}).collectAll();


var kirinBuildPackages = nodeModules.module(__dirname, {
    name: "kirin-build",
    kirin: {
        dependencies: ["underscore"]
    }
}).collectAll();

 
packages = _.extend(kirinBuildPackages, packages);

test("lint a single package with dry run", function (t) {
    argv.dryRun = true;
    
    var errors = linter._lintPackage(packages['kirin-build-test-package']);
    
    t.ok(!errors);
    
    argv.dryRun = false;
    t.end();
});

test("lint a single package", function (t) {
    var package_ = packages['kirin-build'];
    t.ok(package_);
    
    var errors = linter._lintPackage(package_, {});
    
    // it's not empty because we've not told jshint we're using node.
    console.dir(errors);
    t.ok(!_.isEmpty(errors));
    
    // now we're using the .jshintrc file.
    errors = linter._lintPackage(package_);
    
    t.ok(errors);
    t.end();
});

test("lint a single file", function (t) {
    var errors;
    errors = linter._lintFile(__filename);
    t.ok(errors);
    t.ok(!_.isEmpty(errors));
    
    errors = linter._lintFile(__filename, {node: true});
    t.ok(!errors);
    
    t.end();
});

test("lint a string", function (t) {
    var errors;
    errors = linter._lintString(["var a = 1;", "a = a + 1;"]);
    t.ok(_.isEmpty(errors));
    
    errors = linter._lintString(["var a = 1;", "eval('a + 1');"]);
    t.equal(errors.length, 1);
    
    errors = linter._lintString(["b = 1"]);
    t.equal(errors.length, 1);
    
    t.end();
});
