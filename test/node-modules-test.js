"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan;

var path = require("path"),
    _ = require("underscore");

var nodeModules = require("../lib/node-modules");

nodeModules.argv({platform:"android", buildType:"dev"});

var testPackage = path.join(__dirname, "test-package");
test("instantiation", function (t) {
    var m = nodeModules.module(testPackage);
    m.crawl();
    
    
    t.equal(m.directory, testPackage);
    
    // these methods come from filesets.
    var copy = m.copy("/tmp/x");
    
    t.ok(copy.files().length > 0);
    
    t.end();
});

test("dependency discovery", function (t) {
    var m = nodeModules.module(testPackage, {
        name: "my-root",
        kirin: {
            dependencies: ["underscore"]
        }
    });
    
    var all = m.collectAll();
    
    t.ok(all.underscore);
    t.ok(all['my-root']);
    
    t.end();
    
});

test("crawlAll", function (t) {
    var m = nodeModules.module(testPackage, {
        name: "my-root",
        kirin: {
            dependencies: ["underscore"]
        }
    });
    
    var all = m.collectAll();
    
    _.each(_.values(all), function (m) {
        t.ok(m.isEmpty(), m.name);
    });
    
    m.crawlAll();

    _.each(_.values(all), function (m) {
        t.ok(!m.isEmpty(), m.name);
    });
    
    
    t.end();
});

