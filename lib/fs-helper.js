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
    if (!fs.existsSync(dir)) {
        return;
    }
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

function ensureDirExists(dest, dryRun) {
    var dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
        if (dryRun) {
            console.log("mkdir -p " + dir);
        } else {
            var mkdirp = require("mkdirp");
            mkdirp.sync(dir);
        }
    }
}

exports.copyFiles = function (files, dryRun) {
    _.each(files, function (i, src) {
        var dest = files[src];
    
        ensureDirExists(dest, dryRun);

        if (dryRun) {
            console.log("cp " + src + " " + dest);
        } else {
            fs.linkSync(src, dest);
        }
        
    });
};

exports.copy = function (src, dest, dryRun) {
    if (dryRun) {
        console.log("cp " + src + " " + dest);
    } else {
        ensureDirExists(dest, dryRun);
        fs.linkSync(src, dest);
    }    
};

exports.isDirectoryEmpty = function (directory) {
    if (exports.isDirectory(directory)) {
        var files = fs.readdirSync(directory);
        return files.length === 0;
    }
    return false;
};

exports.writeFileSync = function (filepath, content, dryRun) {
    ensureDirExists(filepath, dryRun);
    if (dryRun) {
        console.log("Writing  " + filepath);
    } else {
        fs.writeFileSync(filepath, content);
    }
};
