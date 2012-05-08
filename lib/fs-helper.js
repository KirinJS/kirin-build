var path = require("path"),
    fs = require("fs");

exports.findFileSuffix = function findFileSuffix (packageDir, fileSuffix) {
    
    if (!packageDir) {
        return null;
    }

    var suggestedLocation = path.resolve(packageDir, fileSuffix);

    if (fs.existsSync(suggestedLocation)) {
        return suggestedLocation;
    }
    
    var parent = path.dirname(packageDir);
    if (parent === packageDir) {
        console.error("Can't find " + fileSuffix + ". Looked at:");
        console.error("  " + suggestedLocation);
        return null;
    }
    
    var location = findFileSuffix(parent, fileSuffix);
    if (location) {
        return location;
    }
    console.error("  " + suggestedLocation);
};

exports.loadJson = function (dir, file) {
    var myPath = file ? path.resolve(dir, file) : dir;
    try {
        var string = fs.readFileSync(myPath);
        return JSON.parse(string.toString());
    } catch (e) {
        console.error("Problem parsing " + myPath, e);
    }
};