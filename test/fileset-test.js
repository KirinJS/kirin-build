"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan;

var filesets = require("../lib/filesets"),
    _ = require("underscore"),
    path = require("path"),
    fs = require("fs"),
    fsHelper = require("../lib/fs-helper");

var testPackage = path.join(__dirname, "test-package");


filesets.argv({
    buildType: "dev",
    platform: "android"
});

test("ctor", function (t) {
    var empty = filesets.directory(__dirname);
    
    t.equal(__dirname, empty.directory);
    t.equal('object', typeof empty.fileMap);
    t.equal('object', typeof empty.directoryMap);
    t.ok(_.isEmpty(empty.fileMap));
    t.ok(_.isEmpty(empty.directoryMap));
    t.end();
});

test("crawl", function (t) {
    var fileset = filesets.directory(testPackage);
    fileset.crawl();
    
    t.ok(!_.isEmpty(fileset.fileMap));
    t.ok(!_.isEmpty(fileset.directoryMap));
    
    
    t.equal(fileset.fileMap["lib/my-module-platform-match.js"], path.join(testPackage, "lib/my-module-platform-match.android.js"));

    t.ok(!fileset.fileMap["lib/my-module-excluded.js"]); // because it's ios, and we've filtered only for android.
    
    
    t.equal(fileset.directoryMap.lib, path.join(testPackage, "lib"));
    
    t.end();
});

test("filter regexp", function (t) {
    var fileset = filesets.directory(testPackage).crawl();
    /*jshint regexp:false*/
    var jsonOnly = fileset.filter(/.*\.json/);
    var jsOnly = fileset.filter(/.*\.js$/);
    /*jshint regexp:true*/
    
    t.equal(_.size(jsonOnly.fileMap), 1);
    t.ok(_.size(fileset.fileMap) > _.size(jsonOnly.fileMap));
    t.ok(_.isEmpty(jsonOnly.directoryMap));
    
    t.ok(_.size(fileset.fileMap) > _.size(jsOnly.fileMap));
    t.ok(!_.isEmpty(jsOnly.directoryMap));
    t.ok(_.size(fileset.directoryMap) >= _.size(jsOnly.directoryMap));
    
    
    t.end();
});

test("filter function", function (t) {
    var fileset = filesets.directory(testPackage).crawl();
    var jsonOnly = fileset.filter(function (f) {
        return f.indexOf("json") >= 0;
    });
    
    t.equal(_.size(jsonOnly.fileMap), 1);
    t.ok(_.size(fileset.fileMap) > _.size(jsonOnly.fileMap));
    t.ok(_.isEmpty(jsonOnly.directoryMap));
    
    var jsOnly = fileset.filter(function (f) {
        return f.indexOf("lib/") === 0;
    });
    t.ok(_.size(fileset.fileMap) > _.size(jsOnly.fileMap));
    t.ok(!_.isEmpty(jsOnly.directoryMap));
    t.ok(_.size(fileset.directoryMap) >= _.size(jsOnly.directoryMap));
    
    t.end();
});

test("filter string", function (t) {
    var fileset = filesets.directory(testPackage).crawl();
    var jsonOnly = fileset.filter("package.json");
    
    var packageJson = jsonOnly.files();
    
    t.equal(packageJson.length, 1);
    t.equal(packageJson[0], path.join(testPackage, "package.json"));
    
    t.ok(_.isEmpty(jsonOnly.directoryMap));
    
    t.end();
});

test("files", function (t) {
    var json = filesets.directory(testPackage).crawl().filter(/json$/);
    
    var jsonFiles = json.files();
    t.equal(jsonFiles.length, 1);
    
    t.equal(jsonFiles[0], path.join(testPackage, "package.json"));
    t.end();
});

test("directories", function (t) {
    var json = filesets.directory(testPackage).crawl();
    
    var jsonFiles = json.directories();
    t.equal(jsonFiles.length, 1);
    t.equal(jsonFiles[0], path.join(testPackage, "lib"));
    t.end();
});

test("commondir", function (t) {
    var all = filesets.directory(testPackage).crawl();
    t.equal(all.commonDir(), testPackage);
    
    var js = all.filter(/\.js$/);
    t.equal(js.commonDir(), path.join(testPackage, "lib"));
    
    t.end();
});

test("copy", function (t) {
    var all = filesets.directory(testPackage).crawl();
    
    t.equal(all.directory, testPackage);
    
    var copy = all.copy("/tmp/new");
    
    t.equal(copy.directory, "/tmp/new");
    t.equal(all.fileMap, copy.fileMap);
 
    t.end();
});

test("reduce", function (t) {
    var all = filesets.directory(testPackage).crawl();
    
    t.equal(all.directory, testPackage);
    
    var js = all.filter(/\.js$/);
    
    t.equal(js.directory, testPackage);
    
    var reduced = js.reduce();
    t.equal(reduced.directory, path.join(testPackage, "lib"));
    
    t.equal(reduced.fileMap["my-extension.js"], path.join(testPackage, "lib", "my-extension.js"));
    
    t.end();
});

test("mergeWithStructure", function (t) {
    var dirA = filesets.directory(path.join(__dirname, "test-package", "lib" )).crawl();
    var dirB = filesets.directory(path.join(__dirname, "browserify-me", "lib")).crawl();
    
    var merged = filesets.merge([dirA, dirB], true);
    
    t.equal(merged.directory, __dirname);
    
    t.equal(merged.filter("browserify-me/lib/foo-screen.js").files()[0], path.join(__dirname, "browserify-me/lib/foo-screen.js"));
    t.equal(merged.filter("test-package/lib/environment.js").files()[0], path.join(__dirname, "test-package/lib/environment.js"));
    
    var copy = merged.copy("/tmp/x");

    var src = copy.onDisk("test-package/lib/environment.js");
    var target = copy.filter("test-package/lib/environment.js").files()[0];
    
    t.equal(src, path.join(__dirname, "test-package/lib/environment.dev.js"));
    t.equal(target, path.join("/tmp/x", "test-package/lib/environment.js"));
    
    
    t.end();
});

test("mergeWithoutStructure", function (t) {
    var dirA = filesets.directory(path.join(__dirname, "test-package", "lib" )).crawl();
    var dirB = filesets.directory(path.join(__dirname, "browserify-me", "lib")).crawl();
    
    var merged = filesets.merge([dirA, dirB]);
    t.equal(merged.directory, __dirname);

    t.equal(merged.filter("foo-screen.js").files()[0], path.join(__dirname, "foo-screen.js"));
    t.equal(merged.filter("environment.js").files()[0], path.join(__dirname, "environment.js"));
    
    var copy = merged.copy("/tmp/x");

    var src = copy.onDisk("environment.js");
    var target = copy.filter("environment.js").files()[0];
    
    t.equal(src, path.join(__dirname, "test-package/lib/environment.dev.js"));
    t.equal(target, path.join("/tmp/x", "environment.js"));
    
    t.end();
});


test("write", function (t) {
    var dirA = filesets.directory(path.join(__dirname, "test-package", "lib" )).crawl();
    var dirB = filesets.directory(path.join(__dirname, "browserify-me", "lib" )).crawl();
    var tmpPath = "/tmp/x";
    
    var copy = dirA.copy(tmpPath);
    
    fsHelper.rmRf(tmpPath);
    copy.write();
    
    t.ok(fs.existsSync(path.join(tmpPath, "environment.js")));
    copy = dirB.copy(tmpPath);
    copy.write(true);
    t.ok(!fs.existsSync(path.join(tmpPath, "environment.js")));
    t.ok(fs.existsSync(path.join(tmpPath, "foo-screen.js")));
    
    t.end();
});

test("remove", function (t) {
    var dirA = filesets.directory(path.join(__dirname, "test-package")).crawl();
    var dirB = filesets.directory(path.join(__dirname, "browserify-me", "lib")).crawl();
    
    var tmpPath = "/tmp/x", 
        tmpLibPath = path.join(tmpPath, "lib");
    
    var copyX = dirA.copy(tmpPath);
    var copyY = dirB.copy(tmpLibPath);
    
    
    
    t.ok(!fs.existsSync(path.join(tmpPath, "package.json")));
    copyX.write(true);
    t.ok(fs.existsSync(path.join(tmpPath, "package.json")));
    t.ok(fs.existsSync(path.join(tmpLibPath, "environment.js")));
    
    copyY.write();
    t.ok(fs.existsSync(path.join(tmpLibPath, "environment.js")));
    t.ok(fs.existsSync(path.join(tmpLibPath, "foo-screen.js")));
    
    copyY.remove(false);
    t.ok(!fs.existsSync(path.join(tmpLibPath, "foo-screen.js")));
    t.ok(fs.existsSync(path.join(tmpLibPath, "environment.js")));
    
    
    t.end();
});
