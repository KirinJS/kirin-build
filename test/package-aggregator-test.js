"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    path = require("path"),
    fs = require("fs"),
    crawler = require("../lib/package-crawler"),
    _ = require("underscore");

var testPackage = path.join(__dirname, "test-package");

var aggregator = require("../lib/package-aggregator"),
    Bom = aggregator.Bom;
var argv = {
        platform: "android",
        buildType: "dev"
    };
var packages = require("../lib/package-crawler").discoverDeep(__dirname, argv);

test("Common root of all packages is obvious", function (t) {
    var bom = new Bom(packages),
        root = bom.getRoot();
    
    t.ok(root);
    t.ok(fs.existsSync(root));
    
    t.end();
});

test("Copy package plan", function (t) {
    var bom = new Bom(packages),
        package_ = packages['kirin-build'],
        plan = bom.planCopying(package_, process.env.HOME, "/tmp");
    
    // so this file is in.
    t.ok(plan[__filename]);
    t.ok(plan[__filename].indexOf("/tmp") >= 0, plan[__filename]);
    
    // but directories aren't.
    t.ok(!plan[__dirname]);
    
    t.ok(package_.dist);
    t.equal(_.size(package_.dist), _.size(plan));
    
    var relFile = path.relative(package_.directory, __filename);
    var destFile = package_.dist[relFile];
    
    t.ok(destFile, destFile);
    
    t.end();
});

test("Aliases plan", function (t) {
    
    var myPackages = crawler.discoverDeep(testPackage, argv),
        bom = new Bom(myPackages),
        package_ = myPackages['kirin-build-test-package'];
    t.ok(package_);
    
    var plan = bom.planCopying(package_, process.env.HOME, "/tmp"),
        aliases = bom.planAliases(package_);

    t.end();
});

test("Plan all", function (t) {
    var packages = crawler.discoverDeep(__dirname, argv),
        bom = new Bom(packages);
    
    bom.prepare("/tmp");
    
    _.each(packages, function (p) {
        t.ok(p.dist);
        t.equal(_.size(p.dist), _.size(p.files));
    });
    
    t.end();
});

test("Perform copy", function (t) {
    var packages = crawler.discoverDeep(__dirname, argv),
    bom = new Bom(packages);
    
    bom.prepare("/tmp/my-new-project");
    
    bom.performCopy();
    
    t.end();
});