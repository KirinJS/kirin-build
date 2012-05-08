var path = require("path"),
    fs = require("fs"),
    _ = require("underscore");

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


function isDirectory (fileOrDirectory) {
    return fs.statSync(fileOrDirectory).isDirectory();
}
exports.isDirectory = isDirectory;

function rmRf (dir) {
    if (isDirectory(dir)) {
        var files = fs.readdirSync(dir);
        _.each(files, function (file) {
            rmRf(path.join(dir, file));
        });
        fs.rmdirSync(dir);
    } else {
        // it's a file.
        fs.unlinkSync(dir);
    }
}
exports.rmRf = rmRf;
