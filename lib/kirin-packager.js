var _ = require("underscore"),
    path = require("path"),
    fsHelper = require("../lib/fs-helper");

function Packet (browersifyOutput, bom, argv) {
    // a string.
    this.browserifyBundle = browersifyOutput;
    this.bom = bom;
    this.argv = argv || {};
}

exports.Packet = Packet;

Packet.prototype.copyAllOtherFiles = function (directory) {
    var self = this, 
        bom = self.bom;
    
    bom.prepare(directory, bom.nonJavascriptTest).performCopy();
};

Packet.prototype.prepareFiles = function () {
    var self = this;
    
    
    var fileOrder = self.fileOrder = [];
    var fileContent = self.fileContent = {};
    
    var applicationFile;
    if (self.argv.minify) {
        applicationFile = self.argv.javascriptFile || "application.js";
        fileOrder.push(applicationFile);
        fileContent[applicationFile] = self.browserifyBundle;
        return;
    }
    
    var parts = self.browserifyBundle.split("/*browserify:");
    var isFirst = true;
    /*jshint regexp:false*/
    var re = /^(?:module|entry)\s*"([^"]+)"\s*\*\//;
    /*jshint regexp:true*/
    var counter = 0;
    _.each(parts, function (part) {
        var filename;
        var content;
        if (part.indexOf("end*/") === 0) {
            return;
        }
        
        if (isFirst) {
            filename = "browserify-preamble.js";
            content = part;
            isFirst = false;
        } else {
            var match = part.match(re);
            if (match) {
                content = part.substring(match[0].length);
                filename = match[1];
            } else {
                filename = "browserify-postamble" + (counter ? ("-" + counter) : "") + ".js";
                content = part;
            }
        }
        
        if (filename && content) {
            fileOrder.push(filename);
            fileContent[filename] = content;
        }
    });
};

Packet.prototype.writeModules = function (directory) {
    var self = this;
    
    var fileOrder = self.fileOrder, 
        fileContent = self.fileContent;
    
    
    _.each(fileOrder, function (file) {
        var content = fileContent[file];
        
        var filepath = path.join(directory, file);
        
        //fsHelper.writeFileSync(filepath, content);
        
    });
};

Packet.prototype.assemble = function () {
    var self = this;
    self.prepareFiles();
    console.dir(self.fileOrder);
    self.writeModules(self.argv.directory);
    self.copyAllOtherFiles(self.directory);
};

