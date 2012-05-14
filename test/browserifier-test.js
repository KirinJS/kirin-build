"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    path = require("path"),
    fs = require("fs"),
    _ = require("underscore");

var argv = {
        minify: false, 
        javascriptFile: "application.js",
        jsDirectory: "/tmp/test-app/generated-javascript",
        platform: "android",
        buildType: "dev",
        debug: true
};

var testPackage = path.join(__dirname, "test-package"),
    testPackage_withDependency = path.join(__dirname, "browserify-me");
var nodeModules = require("../lib/node-modules").argv(argv),
    browserifier = require("../lib/browserifier").argv(argv);



var packet;


test("browserifyToString no dependencies used", function (t) {
    
    var myModule = nodeModules.module(testPackage, {
        name: "hello-world",
        kirin: {
            dependencies: ["underscore"],
            directories: ["lib"],
            extensions: {
                "exported-extension": "./lib/my-extension" 
            }
        }
    });
    
    var string = browserifier.browserifyToString(myModule.crawlAll());
    t.ok(string);
    t.end();
});

test("browserifyToString one dependencies used", function (t) {
    
    var myModule = nodeModules.module(testPackage_withDependency, {
        name: "hello-world",
        kirin: {
            dependencies: ["underscore"],
            directories: ["lib"],
            extensions: {
                "exported-extension": "./lib/my-extension" 
            }
        }
    });
    
    var string = browserifier.browserifyToString(myModule.crawlAll());
    t.ok(string);
    t.end();
});

test("browserify to disk", function (t) {
    var myModule = nodeModules.module(testPackage_withDependency, {
        name: "hello-world",
        kirin: {
            dependencies: ["underscore"],
            directories: ["lib"],
            extensions: {
                "exported-extension": "./lib/foo-screen" 
            }
        }
    }).crawlAll();
    
    var bundle = browserifier.browserifyToString(myModule);
    
    var fileset = browserifier.browserifyBundleToDisk(bundle, myModule.name);
    
    require("../lib/fs-helper").writeFileSync("generated-bundle.js", bundle);
    
    console.dir(fileset.files());
    
    t.end();
});