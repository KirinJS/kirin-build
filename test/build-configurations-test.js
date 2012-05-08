"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan;

var bc = require("../lib/build-configurations");

test("Build configurations filename reduction", function (t) {
    
    t.ok(!!bc);
    
    var argv = {
        platform: "android",
        buildType: "dev"
    };
    
    t.equal(bc.platformSpecificity(argv, "file.js").name, "file.js");
    t.equal(bc.platformSpecificity(argv, "file-android.js").name, "file.js");
    t.equal(bc.platformSpecificity(argv, "file-webview.js").name, "file.js");
    t.equal(bc.platformSpecificity(argv, "file-ios.js").name, "file.js");
    t.equal(bc.platformSpecificity(argv, "file-dev.js").name, "file.js");
    t.equal(bc.platformSpecificity(argv, "file-ios-dev.js").name, "file.js");
    
    // with dots instead of dashes.
    t.equal(bc.platformSpecificity(argv, "file.dev.js").name, "file.js");
    t.equal(bc.platformSpecificity(argv, "file.ios.dev.js").name, "file.js");

    // keep unrecognised stuffs.
    t.equal(bc.platformSpecificity(argv, "file-reader-dev.js").name, "file-reader.js");
    
    // a bit pathalogical. We shouldn't encourage this.
    t.equal(bc.platformSpecificity(argv, "file-ios-reader.js").name, "file-reader.js");
    
    t.end();
});

test("Build configurations suitability", function (t) {
    var argv = {
            platform: "android",
            buildType: "dev"
        };
    
    var s = bc.platformSpecificity;
    
    // platforms win most things
    t.ok(s(argv, "file-android.js").specificity > s(argv, "file-webview.js").specificity);
    t.ok(s(argv, "file-webview.js").specificity > s(argv, "file.js").specificity);
    t.ok(s(argv, "file.js").specificity > s(argv, "file-ios.js").specificity);
    t.ok(s(argv, "file.js").specificity > s(argv, "file-ios.js").specificity);
    
    // build type modifiers help a bit too.
    t.ok(s(argv, "file-dev.js").specificity > s(argv, "file.js").specificity);
    t.ok(s(argv, "file.js").specificity > s(argv, "file-prod.js").specificity);
    
    // build type modifiers help a bit too.
    t.ok(s(argv, "file-android-dev.js").specificity > s(argv, "file-android.js").specificity);

    t.ok(s(argv, "file-android-dev-prod.js").specificity > s(argv, "file-android.js").specificity);
    t.ok(s(argv, "file-android-dev-qa-prod.js").specificity > s(argv, "file-android.js").specificity);
    
    // build type is dev here.
    t.ok(s(argv, "file-webview-dev-qa-stage-prod.js").specificity > s(argv, "file-webview.js").specificity);
   
    // we prefer a platform match over all other.
    t.ok(s(argv, "file-android.js").specificity > s(argv, "file-webview-dev.js").specificity);
    t.ok(s(argv, "file-webview.js").specificity > s(argv, "file-dev.js").specificity);
    
    // some pathalogical cases
    t.ok(s(argv, "file-android-ios.js").specificity === s(argv, "file-android.js").specificity);
    t.ok(s(argv, "file-android.js").specificity === s(argv, "file-android-webview.js").specificity);
    t.ok(s(argv, "file-android.js").specificity === s(argv, "file-android-javascript.js").specificity);
    
    t.end();
}); 