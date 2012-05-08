"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    _ = require("underscore");
    
/*
  ======== A Handy Little Tap Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.plan(numAssertions)
    test.end()
  Test assertions:
    t.ok(value, [message])
    t.equal(actual, expected, [message])
    t.notEqual(actual, expected, [message])
    t.deepEqual(actual, expected, [message])
    t.notDeepEqual(actual, expected, [message])
    t.strictEqual(actual, expected, [message])
    t.notStrictEqual(actual, expected, [message])
    t.throws(block, [error], [message])
    t.doesNotThrow(block, [error], [message])
    t.ifError(value)
*/

var crawler = require("../lib/package-crawler.js"),
    path = require("path"),
    testPackage = path.join(__dirname, "test-package");
    
test("findPackageJson happyCase", function (t) {
    
    var packagejson = crawler.findPackageJson(testPackage);
    t.ok(packagejson);
    t.equal(path.basename(packagejson), "package.json");
    t.equal(path.relative(__dirname, packagejson), "test-package/package.json");
        
    t.end();
});
    
test("findPackageJson notFound", function (t) {
    var packagejson = crawler.findPackageJson(process.env.TMPDIR);
    t.ok(!packagejson, "Package json should be null");
    t.end();  
});

test("recursiveDiscover happyCase", function (t) {
    var modules = crawler.discover(testPackage, {
        name: 'kirin-build-test-package'
    });
    t.ok(modules['kirin-build-test-package']);
    t.end();
});

test("recursiveDiscover from file", function (t) {
    var modules = crawler.discover(testPackage);
    t.ok(modules['kirin-build-test-package']);
    t.end();
});

test("recursiveDiscover with dependencies", function (t) {
    var modules = crawler.discover(testPackage, {
        name: 'kirin-build-test-package',
        dependencies: {
            underscore: ">= 1.3.1"
        }
        
    });
    t.ok(modules['kirin-build-test-package']);
    t.ok(modules.underscore);
    t.end();
});

test("recursiveDiscover with kirin dependencies", function (t) {
    var modules = crawler.discover(testPackage, {
        name: 'kirin-build-test-package',
        kirin: {
            dependencies: ["underscore"]
        },
        dependencies: {
            optimist: ">= 0.3.4"
        }
    });
    t.ok(modules['kirin-build-test-package']);
    t.ok(modules.underscore);
    t.ok(!modules.optimist);
    t.end();
});

test("packageCrawl minimal case", function (t) {
    var m = crawler.createPackage(testPackage);
    m.discover({
        name: "kirin-build-test-package"
    });
    
    m.crawl({
        platform: "android",
        buildType: "dev"
    });
    

    t.equal(m.files["package.json"], "package.json");
    t.equal(m.files["lib/my-module-platform-match.js"], "lib/my-module-platform-match.android.js");
    t.equal(m.files["lib/my-module-platform-no-match.js"], "lib/my-module-platform-no-match.js");
    t.equal(m.files["lib/my-module-platform-class-match.js"], "lib/my-module-platform-class-match.webview.js");
    t.equal(m.files["lib/environment.js"], "lib/environment.dev.js");
    
    t.equal(m.files["lib/my-module-excluded.js"], undefined); //"my-module-excluded.ios.js")
    
    t.end();
});

test("packageCrawl with directories", function (t) {
    var m = crawler.createPackage(testPackage);
    m.discover({
        name: "kirin-build-test-package",
        kirin: {
            directories: ["lib"],
            extensions: {
                "my-extension": "./lib/my-extension.js"
            }
        }
    });
    
    m.crawl({
        platform: "android",
        buildType: "prod"
    });
    
    t.equal(m.files["package.json"], "package.json"); // package.json is always included
    t.equal(m.files["lib/my-module-platform-match.js"], "lib/my-module-platform-match.android.js");
    t.equal(m.files["lib/my-module-platform-no-match.js"], "lib/my-module-platform-no-match.js");
    t.equal(m.files["lib/my-module-platform-class-match.js"], "lib/my-module-platform-class-match.webview.js");
    t.equal(m.files["lib/environment.js"], "lib/environment.prod.js");
    
    t.end();
});

test("packageCrawl with extension aliases", function (t) {
    var m = crawler.createPackage(testPackage);
    m.discover({
        name: "kirin-build-test-package",
        kirin: {
            extensions: {
                "my-extension": "./lib/my-extension.js"
            }
        }
    });
    
    m.crawl({
        platform: "ios",
        buildType: "prod"
    });
    
    
    t.equal(m.aliases["my-extension"], "lib/my-extension.js");
    t.equal(m.files[m.aliases["my-extension"]], "lib/my-extension.prod.js");
    
    // we're using ios here, so we can include this one we don't use for other platforms. 
    // (we've tested for non-inclusion above)
    t.equal(m.files["lib/my-module-excluded.js"], "lib/my-module-excluded.ios.js");
    
    t.end();
});

test("recursiveDiscover and packageCrawl", function (t) {
    var packages = crawler.discover(__dirname);
    crawler.crawl(packages, {
        platform: "android",
        buildType: "dev"
    });
    
    t.ok(packages);
    t.ok(!_.isEmpty(packages));
    
    _.each(packages, function (i, key) {
        t.ok(packages[key].files);
        t.ok(!_.isEmpty(packages[key].files));
    });
    
    t.end();
});