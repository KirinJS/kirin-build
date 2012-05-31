"use strict";
var _ = require("underscore");

var buildTypes = ['prod', 'dev', 'qa', 'stage', 'uitest'];

var supportedPlatforms = {
        "ios": ["webview", "webkit", "safari"],
        "android": ["webview", "webkit"],
        "wp7": ["webview", "iex"],
        "qt": ["javascript"],
        "html": ["webview", "fakeNative"],
        "node": ["fakeNative"]
    };

var supportedPlatformClasses = _.unique(_.flatten(_.values(supportedPlatforms)));

function makeRegExp (list, begin, end, flags) {
    return new RegExp(begin + list.join(end + "|" + begin) + end, flags);
}

var platformsRegExp = makeRegExp(_.keys(supportedPlatforms), "[\\.-](", ")");
var platformClassesRegExp = makeRegExp(supportedPlatformClasses, "[\\.-](", ")");
var buildTypesRegExp = makeRegExp(buildTypes, "[\\.-](", ")");

exports.platformSpecificity = function (argv, location) {
    var platform = argv.platform,
        platformClasses = supportedPlatforms[platform],
        buildType = argv.buildType;
    if (!platformClasses) {
        throw new Error("You need to specify a platform. One of: '" + _.keys(supportedPlatforms).join("', '") + "'"); 
    }
    
    var done = false;
    var specificity = 0;
    var filepath = location.replace(platformsRegExp, function (match) {
        match = match.substring(1);
        if (platform === match) {
            specificity = 5;
        } else if (!done) {
            specificity = -5;
        }
        done = true;
        
        return "";
    });    
    
    filepath = filepath.replace(platformClassesRegExp, function (match) {
        if (!done) {
            match = match.substring(1);
            if (platformClasses.indexOf(match) >= 0) {
                specificity = 3;
                done = true;
            } else {
                specificity = -3;
            }
        }
        return "";
    });
    
    filepath = filepath.replace(buildTypesRegExp, function (match) {
        match = match.substring(1);
        if (match === buildType) {
            specificity += 1;
            done = true;
        } else {
            specificity -= 1;
        }
        return "";
    });
    
    // TODO add a rule for usernames
    // 
    
    return {name: filepath, specificity: specificity, location:location};
    
};
